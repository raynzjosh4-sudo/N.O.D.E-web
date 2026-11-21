import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useToast } from '@/core/widgets/whatsapp_dialog';
import { ProfileApiService } from '@/features/profile/data/services/profile_api_service';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { Product } from '@/features/inventory/domain/entities/product';
import { useProducts } from '@/features/inventory/context/products_context';
import {
  ColorVariant,
  ColorGroup,
} from './order_models';

export default function SpecsOrderPage() {
  const router = useAppNavigation();
  const { showSuccess, showError, showWarning } = useToast();
  const { id, draftId } = useLocalSearchParams<{ id: string; draftId?: string }>();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const isDesktop = width >= 960;
  const { getProductById } = useProducts();

  const initialProduct = id ? getProductById(id) : undefined;
  const [product, setProduct] = useState<Product | undefined>(initialProduct);

  // GitHub Primer flat border colors
  const gitBorder = isDark ? '#30363D' : '#D0D7DE';
  const gitHeaderBg = isDark ? '#161B22' : '#F6F8FA';
  const gitSubtleText = isDark ? '#8B949E' : '#57606A';

  // Fetch full product detail to ensure real colors, sizes, and attributes from DB
  useEffect(() => {
    if (id) {
      ProductApiService.getProductById(id)
        .then((fullProd) => {
          if (fullProd) setProduct(fullProd);
        })
        .catch((err) => {
          console.log('[SpecsOrderPage] Could not fetch fresh product details:', err);
        });
    }
  }, [id]);

  // Dynamically derive the product's actual colors from database
  const availableColors: ColorVariant[] = useMemo(() => {
    if (product?.colors && product.colors.length > 0) {
      return product.colors.map((c) => ({
        label: c.name,
        color: c.hexCode || '#1C1B1F',
      }));
    }
    return [
      { label: 'Standard / As Shown', color: '#1C1B1F' },
    ];
  }, [product?.colors]);

  // Dynamically derive the product's actual sizes from database
  const availableSizes: string[] = useMemo(() => {
    if (product?.sizes && product.sizes.length > 0) {
      return product.sizes.map((s) => s.abbreviation || s.name);
    }
    return ['Standard Unit'];
  }, [product?.sizes]);

  // Confirmed color/size groupings
  const [confirmedGroups, setConfirmedGroups] = useState<ColorGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Bulk Draft naming state
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [bulkDraftName, setBulkDraftName] = useState('');

  // Current builder selections
  const [selectedColor, setSelectedColor] = useState<ColorVariant>(availableColors[0]);
  // Map of active sizes -> quantity
  const [sizeQtys, setSizeQtys] = useState<Record<string, number>>({});

  // Restore saved draft if draftId was provided
  useEffect(() => {
    if (draftId) {
      ProfileApiService.getDraftOrders().then((drafts) => {
        const found = drafts.find((d) => d.id === draftId);
        if (found) {
          if (found.title) setBulkDraftName(found.title);
          const entries = found.entries || [];
          const restored: ColorGroup[] = [];
          entries.forEach((e: any) => {
            const colorName = e.color || e.color_name || 'Standard';
            const hex = e.colorHex || e.hex || '#1C1B1F';
            const sq = e.size_quantities || e.sizeQtys || {};
            restored.push({
              color: { label: colorName, color: hex },
              sizeQtys: sq,
            });
          });
          if (restored.length > 0) {
            setConfirmedGroups(restored);
          }
        }
      }).catch((e) => console.log('Could not restore draft:', e));
    }
  }, [draftId]);

  // Keep selectedColor in sync with dynamic product data
  useEffect(() => {
    if (availableColors.length > 0) {
      const stillValid = availableColors.some((c) => c.label === selectedColor?.label);
      if (!stillValid) {
        setSelectedColor(availableColors[0]);
      }
    }
  }, [availableColors]);

  // Initialize first size into sizeQtys
  useEffect(() => {
    if (availableSizes.length > 0 && Object.keys(sizeQtys).length === 0) {
      setSizeQtys({ [availableSizes[0]]: product?.moq || 1 });
    }
  }, [availableSizes]);

  const toggleSize = (size: string) => {
    setSizeQtys((prev) => {
      const next = { ...prev };
      if (next[size] !== undefined) {
        delete next[size];
      } else {
        next[size] = 1;
      }
      return next;
    });
  };

  const changeSizeQty = (size: string, delta: number) => {
    setSizeQtys((prev) => {
      const current = prev[size] || 1;
      const nextVal = Math.max(1, current + delta);
      return { ...prev, [size]: nextVal };
    });
  };

  const formatPrice = (val: number) => {
    return 'UGX ' + (val || 0).toLocaleString('en-US');
  };

  // Add currently selected color & sizes to the confirmed list
  const handleAddGroup = () => {
    if (!selectedColor) {
      showWarning('Color Required', 'Please select a color variant.');
      return;
    }
    const activeEntries = Object.entries(sizeQtys).filter(([_, q]) => q > 0);
    if (activeEntries.length === 0) {
      showWarning('Size Required', 'Please select at least one size with quantity > 0.');
      return;
    }

    setConfirmedGroups((prev) => {
      const existingIdx = prev.findIndex((g) => g.color.label === selectedColor.label);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existingGroup = updated[existingIdx];
        const mergedQtys = { ...existingGroup.sizeQtys };
        activeEntries.forEach(([sz, q]) => {
          mergedQtys[sz] = (mergedQtys[sz] || 0) + q;
        });
        updated[existingIdx] = {
          color: selectedColor,
          sizeQtys: mergedQtys,
        };
        return updated;
      } else {
        const newQtys: Record<string, number> = {};
        activeEntries.forEach(([sz, q]) => (newQtys[sz] = q));
        return [
          ...prev,
          {
            color: selectedColor,
            sizeQtys: newQtys,
          },
        ];
      }
    });

    showSuccess('Added to Breakdown', `Added ${selectedColor.label} variants.`);
  };

  const handleRemoveGroup = (colorLabel: string) => {
    setConfirmedGroups((prev) => prev.filter((g) => g.color.label !== colorLabel));
  };

  const handleRemoveSize = (colorLabel: string, size: string) => {
    setConfirmedGroups((prev) =>
      prev
        .map((g) => {
          if (g.color.label === colorLabel) {
            const nextQtys = { ...g.sizeQtys };
            delete nextQtys[size];
            return { ...g, sizeQtys: nextQtys };
          }
          return g;
        })
        .filter((g) => Object.keys(g.sizeQtys).length > 0)
    );
  };

  const totalUnits = confirmedGroups.reduce(
    (acc, g) => acc + Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
    0
  );

  const subtotal = totalUnits * (product?.srp || 0);

  // Save to user's saved wishlist / bulk bag with real selected colors
  const handleSaveToBag = async () => {
    if (confirmedGroups.length === 0 || !product) {
      showWarning('Configuration Needed', 'Add at least one color/size to save to your bag.');
      return;
    }
    try {
      for (const group of confirmedGroups) {
        for (const [size, qty] of Object.entries(group.sizeQtys)) {
          if (qty > 0) {
            await ProfileApiService.addSavedItem(
              product.id,
              qty,
              group.color.label,
              size,
              {
                id: product.id,
                name: product.name,
                srp: product.srp,
                brand: product.brand,
                imageUrl: product.imageUrl,
                warehouseLoc: product.warehouseLoc,
                priceTiers: product.priceTiers,
                colors: product.colors,
                sizes: product.sizes,
                moq: product.moq,
              }
            );
          }
        }
      }
      showSuccess('Saved to Bag', `Saved ${totalUnits} units of ${product.name} to your bulk order bag.`);
    } catch (e: any) {
      showError('Save Failed', e?.message || 'Could not save items to bag.');
    }
  };

  // Place Wholesale Order
  const handleConfirmOrder = async () => {
    if (confirmedGroups.length === 0 || !product || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let profile: { legalBusinessName?: string; fullName?: string; phone?: string; warehouseAddress?: string } = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {};
      }

      const orderId =
        'ORD-' +
        Date.now().toString(36).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();

      const orderPayload = {
        order_id: orderId,
        supplier_id: product.supplierId || '',
        business_name: profile.legalBusinessName || profile.fullName || '',
        business_phone: profile.phone || '',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || '',
        total_amount: subtotal,
        entries_json: confirmedGroups.map((g) => ({
          name: product.name,
          product_id: product.id,
          imageUrl: product.imageUrl,
          image_url: product.imageUrl,
          color: g.color.label,
          colorHex: g.color.color,
          size_quantities: g.sizeQtys,
          unit_price: product.srp,
          total_units: Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
        })),
      };

      await ProfileApiService.createOrder(orderPayload);
      showSuccess('Order Created', `Wholesale order for ${product.name} placed successfully!`);
      setTimeout(() => {
        router.push('/profile');
      }, 1200);
    } catch (err: any) {
      showError('Order Failed', err?.message || 'Could not place wholesale order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Name Prompt or Save Bulk Draft
  const handleSaveDraftClick = () => {
    if (confirmedGroups.length === 0 || !product || isSavingDraft) return;
    if (!bulkDraftName) {
      setBulkDraftName(`${product.name} Bulk Order`);
    }
    setShowNamingModal(true);
  };

  const handleExecuteSaveDraft = async () => {
    if (!product || isSavingDraft) return;
    const finalName = bulkDraftName.trim() || `${product.name} Bulk Order`;
    setShowNamingModal(false);
    setIsSavingDraft(true);

    try {
      let profile: { legalBusinessName?: string; fullName?: string; phone?: string; warehouseAddress?: string } = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {};
      }

      const draftIdGenerated = draftId || ('DRAFT-' + Date.now().toString(36).toUpperCase());

      const draftPayload = {
        order_id: draftIdGenerated,
        title: finalName,
        name: finalName,
        supplier_id: product.supplierId || '',
        business_name: profile.legalBusinessName || profile.fullName || '',
        business_phone: profile.phone || '',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || '',
        total_amount: subtotal,
        status: 'draft',
        entries_json: confirmedGroups.map((g) => ({
          name: product.name,
          product_id: product.id,
          imageUrl: product.imageUrl,
          image_url: product.imageUrl,
          color: g.color.label,
          colorHex: g.color.color,
          size_quantities: g.sizeQtys,
          unit_price: product.srp,
          total_units: Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
        })),
      };

      await ProfileApiService.saveDraftOrder(draftPayload);
      showSuccess('Draft Saved', `"${finalName}" is now available in your Drafts tab.`);
      setTimeout(() => {
        router.push('/profile');
      }, 1200);
    } catch (err: any) {
      showError('Save Draft Failed', err?.message || 'Could not save draft order.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.onSurface }]}>Loading order sheet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: gitBorder }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.safeGoBack('/profile')}
          style={styles.backButton}
        >
          <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Configure Wholesale Order</Text>
          <Text style={[styles.headerSubtitle, { color: gitSubtleText }]} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.safeGoBack('/profile')}
          style={styles.backButton}
        >
          <MaterialIcon name="close" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Product Overview Banner (Flat, No Box) ── */}
          <View style={[styles.productBannerRow, { borderBottomColor: gitBorder }]}>
            <Image source={{ uri: product.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.bannerDetails}>
              <Text style={[styles.bannerBrand, { color: gitSubtleText }]}>
                {product.brand ? product.brand.toUpperCase() : 'VERIFIED WHOLESALE'}
              </Text>
              <Text style={[styles.bannerName, { color: colors.onSurface }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[styles.bannerPrice, { color: colors.primary }]}>
                {formatPrice(product.srp)} <Text style={[styles.bannerPerUnit, { color: gitSubtleText }]}>/ unit</Text>
              </Text>
            </View>
          </View>

          {/* ── Main Two-Column or Stacked View ── */}
          <View style={[styles.mainLayout, isDesktop && styles.desktopMainLayout]}>
            {/* ── Left / Top: Configuration Controls (Flat, No Card Box) ── */}
            <View style={[styles.configColumn, { borderRightColor: isDesktop ? gitBorder : 'transparent' }]}>
              {/* 1. SELECT COLOUR YOU WANT (Dart 1:1 Parity) */}
              <View style={[styles.sectionGroup, { borderBottomColor: gitBorder }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>SELECT COLOUR YOU WANT</Text>
                  <Text style={[styles.sectionBadge, { color: colors.primary }]}>
                    {availableColors.length} Option{availableColors.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={[styles.sectionHelper, { color: gitSubtleText }]}>
                  tap the color you want, then tap the sizes
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorSwatchesRow}
                >
                  {availableColors.map((variant) => {
                    const isSelected = selectedColor?.label === variant.label;
                    return (
                      <TouchableOpacity
                        key={variant.label}
                        activeOpacity={0.8}
                        onPress={() => setSelectedColor(variant)}
                        style={styles.swatchWrapper}
                      >
                        <View
                          style={[
                            styles.swatchCircle,
                            { backgroundColor: variant.color },
                            isSelected && {
                              borderColor: colors.primary,
                              borderWidth: 3,
                              shadowColor: variant.color,
                              shadowOpacity: 0.5,
                              shadowRadius: 8,
                            },
                          ]}
                        >
                          {isSelected && (
                            <MaterialIcon name="check" size={18} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.swatchLabel,
                            { color: isSelected ? colors.primary : gitSubtleText },
                            isSelected && { fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {variant.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 2. SELECT SIZE / CARTON */}
              <View style={[styles.sectionGroup, { borderBottomColor: gitBorder }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>SELECT SIZE / CARTON</Text>
                  <Text style={[styles.sectionBadge, { color: colors.primary }]}>
                    {availableSizes.length} Option{availableSizes.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View style={styles.sizesPillsWrap}>
                  {availableSizes.map((size) => {
                    const isActive = sizeQtys[size] !== undefined;
                    return (
                      <TouchableOpacity
                        key={size}
                        activeOpacity={0.75}
                        onPress={() => toggleSize(size)}
                        style={[
                          styles.sizePill,
                          { borderColor: isActive ? colors.primary : gitBorder },
                          isActive
                            ? { backgroundColor: colors.primary }
                            : { backgroundColor: gitHeaderBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sizePillText,
                            { color: isActive ? '#FFFFFF' : colors.onSurface },
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quantities for selected sizes */}
                {Object.keys(sizeQtys).length > 0 && (
                  <View style={styles.qtysContainer}>
                    <Text style={[styles.qtySectionHeader, { color: gitSubtleText }]}>
                      QUANTITIES FOR {selectedColor?.label ? selectedColor.label.toUpperCase() : 'SELECTED COLOR'}
                    </Text>
                    {Object.entries(sizeQtys).map(([sz, qty]) => (
                      <View key={sz} style={[styles.qtyRow, { borderBottomColor: gitBorder }]}>
                        <Text style={[styles.qtySizeName, { color: colors.onSurface }]}>{sz}</Text>
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => changeSizeQty(sz, -1)}
                            style={[styles.stepperBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                          >
                            <MaterialIcon name="remove" size={16} color={colors.onSurface} />
                          </TouchableOpacity>
                          <Text style={[styles.stepperNumber, { color: colors.onSurface }]}>{qty}</Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => changeSizeQty(sz, 1)}
                            style={[styles.stepperBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                          >
                            <MaterialIcon name="add" size={16} color={colors.onSurface} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add to Order Breakdown CTA */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleAddGroup}
                  style={[styles.addGroupBtn, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcon name="add_shopping_cart" size={18} color="#FFFFFF" />
                  <Text style={styles.addGroupBtnText}>Add to Order Breakdown</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Right / Bottom: Order Breakdown (Flat Git-style, No Box) ── */}
            <View style={styles.breakdownColumn}>
              <View style={[styles.breakdownHeader, { borderBottomColor: gitBorder }]}>
                <Text style={[styles.breakdownTitle, { color: colors.onSurface }]}>
                  ORDER BREAKDOWN ({totalUnits} UNITS)
                </Text>
              </View>

              {confirmedGroups.length === 0 ? (
                <View style={styles.emptyBreakdown}>
                  <MaterialIcon name="playlist_add" size={38} color={gitSubtleText} />
                  <Text style={[styles.emptyBreakdownTitle, { color: colors.onSurface }]}>
                    No color & size combinations added yet
                  </Text>
                  <Text style={[styles.emptyBreakdownSub, { color: gitSubtleText }]}>
                    Select your color and size combinations on the left, then tap "Add to Order Breakdown"
                  </Text>
                </View>
              ) : (
                <View style={styles.groupsContainer}>
                  {confirmedGroups.map((group) => (
                    <View key={group.color.label} style={[styles.groupItemRow, { borderBottomColor: gitBorder }]}>
                      <View style={styles.groupColorCol}>
                        <View style={[styles.groupColorDot, { backgroundColor: group.color.color }]} />
                        <Text style={[styles.groupColorTitle, { color: colors.onSurface }]}>
                          {group.color.label}
                        </Text>
                      </View>

                      <View style={styles.groupPillsCol}>
                        {Object.entries(group.sizeQtys).map(([sz, qty]) => (
                          <View key={sz} style={[styles.confirmedSizeBadge, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}>
                            <Text style={[styles.confirmedSizeText, { color: colors.onSurface }]}>
                              {sz} <Text style={{ color: colors.primary, fontWeight: '700' }}>×{qty}</Text>
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleRemoveSize(group.color.label, sz)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <MaterialIcon name="close" size={12} color={gitSubtleText} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveGroup(group.color.label)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteGroupBtn}
                      >
                        <MaterialIcon name="delete_outline" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Pricing and Totals Breakdown */}
                  <View style={[styles.totalsBox, { borderTopColor: gitBorder }]}>
                    <View style={styles.calcRow}>
                      <Text style={[styles.calcLabel, { color: gitSubtleText }]}>Total Units</Text>
                      <Text style={[styles.calcVal, { color: colors.onSurface }]}>{totalUnits} Units</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={[styles.calcLabel, { color: gitSubtleText }]}>Unit Price</Text>
                      <Text style={[styles.calcVal, { color: colors.onSurface }]}>{formatPrice(product.srp)}</Text>
                    </View>
                    <View style={[styles.calcRow, { marginTop: 6 }]}>
                      <Text style={[styles.grandLabel, { color: colors.onSurface }]}>Estimated Value</Text>
                      <Text style={[styles.grandVal, { color: colors.primary }]}>{formatPrice(subtotal)}</Text>
                    </View>
                  </View>

                  {/* Actions: Save Draft (with Name) & Place Order */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSaveToBag}
                      style={[styles.outlineActionBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                    >
                      <MaterialIcon name="shopping_bag" size={16} color={colors.primary} />
                      <Text style={[styles.outlineActionText, { color: colors.onSurface }]}>Save to Bag</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSaveDraftClick}
                      disabled={isSavingDraft || isSubmitting}
                      style={[styles.outlineActionBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                    >
                      <MaterialIcon name="edit_note" size={16} color={colors.primary} />
                      <Text style={[styles.outlineActionText, { color: colors.onSurface }]}>
                        {isSavingDraft ? 'Saving...' : 'Save as Bulk'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleConfirmOrder}
                      disabled={isSubmitting || isSavingDraft}
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                    >
                      <MaterialIcon name="check_circle" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryActionText}>
                        {isSubmitting ? 'Submitting...' : 'Confirm Order'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Naming Bulk Modal (Dart 1:1 Parity) ── */}
      <Modal
        visible={showNamingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNamingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: gitBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Name This Bulk Order</Text>
            <Text style={[styles.modalSub, { color: gitSubtleText }]}>
              Enter a name for this wholesale configuration to save it in your Drafts tab.
            </Text>

            <TextInput
              value={bulkDraftName}
              onChangeText={setBulkDraftName}
              placeholder="e.g. folding net Wholesale Order"
              placeholderTextColor={gitSubtleText}
              style={[
                styles.modalInput,
                { color: colors.onSurface, borderColor: gitBorder, backgroundColor: gitHeaderBg },
              ]}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowNamingModal(false)}
                style={[styles.modalCancelBtn, { borderColor: gitBorder }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleExecuteSaveDraft}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSaveText}>Save Draft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  desktopScrollContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  productBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  bannerImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  bannerDetails: {
    flex: 1,
  },
  bannerBrand: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  bannerName: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginVertical: 2,
  },
  bannerPrice: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
  },
  bannerPerUnit: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  mainLayout: {
    flexDirection: 'column',
  },
  desktopMainLayout: {
    flexDirection: 'row',
  },
  configColumn: {
    flex: 1,
    borderRightWidth: 1,
  },
  breakdownColumn: {
    flex: 1,
  },
  sectionGroup: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  sectionHelper: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 14,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  swatchWrapper: {
    alignItems: 'center',
    width: 60,
  },
  swatchCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 6,
    textAlign: 'center',
  },
  sizesPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sizePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sizePillText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  qtysContainer: {
    marginTop: 18,
  },
  qtySectionHeader: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  qtySizeName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNumber: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    minWidth: 24,
    textAlign: 'center',
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  breakdownHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  breakdownTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  emptyBreakdown: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyBreakdownTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBreakdownSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  groupsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  groupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  groupColorCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
  },
  groupColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  groupColorTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  groupPillsCol: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  confirmedSizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  confirmedSizeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  deleteGroupBtn: {
    padding: 4,
  },
  totalsBox: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  calcVal: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  grandLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  grandVal: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingBottom: 24,
  },
  outlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlineActionText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  primaryActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
    marginBottom: 18,
  },
  modalInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});
