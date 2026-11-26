import { useAppTheme } from '@/core/theme/theme_context';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useToast } from '@/core/widgets/whatsapp_dialog';
import { useAuth } from '@/features/auth/context/auth_context';
import { useProducts } from '@/features/inventory/context/products_context';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { Product } from '@/features/inventory/domain/entities/product';
import { getActiveWholesaleTier, getWholesaleUnitPrice } from '@/features/inventory/utils/wholesale_pricing';
import { ProfileApiService } from '@/features/profile/data/services/profile_api_service';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import {
  ColorGroup,
  ColorVariant,
} from './order_models';

export default function SpecsOrderPage() {
  const router = useAppNavigation();
  const { user, isAuthenticated } = useAuth();
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
    return [];
  }, [product?.colors]);

  // Dynamically derive the product's actual sizes from database
  const availableSizes: string[] = useMemo(() => {
    if (product?.sizes && product.sizes.length > 0) {
      return product.sizes.map((s) => s.abbreviation || s.name);
    }
    return [];
  }, [product?.sizes]);

  // Confirmed color/size groupings
  const [confirmedGroups, setConfirmedGroups] = useState<ColorGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Bulk Draft naming state
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [bulkDraftName, setBulkDraftName] = useState('');

  // Current builder selections
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
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

  // Keep selectedColor in sync with dynamic product data:
  // If product has no colors, default to Standard Unit color
  useEffect(() => {
    if (availableColors.length > 0) {
      if (!selectedColor || !availableColors.some((c) => c.label === selectedColor.label)) {
        setSelectedColor(null); // User must tap a color first, just like Dart
      }
    } else {
      // Product has no colors defined -> use Standard / As Shown
      setSelectedColor({ label: 'Standard / As Shown', color: '#1C1B1F' });
    }
  }, [availableColors]);

  // Keep sizeQtys empty initially until color & size are chosen (like Dart)
  useEffect(() => {
    if (availableSizes.length === 0 && selectedColor && Object.keys(sizeQtys).length === 0) {
      // No explicit sizes in product -> single quantity row for the color
      setSizeQtys({ 'Standard Unit': product?.moq || 1 });
    }
  }, [availableSizes, selectedColor, product?.moq]);

  const toggleSize = (size: string) => {
    if (!selectedColor && availableColors.length > 0) {
      showWarning('Select Color First', 'Please tap a color variant before selecting sizes.');
      return;
    }
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
      showWarning('Color Required', 'Please select a color variant first.');
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

    // Reset current builder selection so user can pick the next color, matching Dart!
    if (availableColors.length > 0) {
      setSelectedColor(null);
    }
    setSizeQtys({});

    showSuccess('Added to Breakdown', `Added ${selectedColor.label} to order breakdown.`);
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

  // Currently configured units in active size picker:
  const activePickerUnits = Object.values(sizeQtys).reduce((sum, q) => sum + (q || 0), 0);

  // Confirmed units from breakdown:
  const confirmedUnits = confirmedGroups.reduce(
    (acc, g) => acc + Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
    0
  );

  // Effective total units for this wholesale order:
  // If the user has confirmed groups in their breakdown, order ONLY reflects the confirmed breakdown.
  // Otherwise, if they configured in the active picker, they can add it directly.
  const totalUnits = confirmedUnits > 0 ? confirmedUnits : activePickerUnits;

  // Wholesale tiered pricing calculation based on totalUnits:
  const currentUnitPrice = useMemo(() => {
    return getWholesaleUnitPrice(product, totalUnits);
  }, [product, totalUnits]);

  const activeTier = useMemo(() => {
    return getActiveWholesaleTier(product, totalUnits);
  }, [product, totalUnits]);

  const subtotal = totalUnits * currentUnitPrice;
  const retailSubtotal = totalUnits * (product?.srp || 0);
  const totalSavings = Math.max(0, retailSubtotal - subtotal);
  const moq = product?.moq || 1;
  const meetsMoq = totalUnits >= moq;

  // Save to user's saved wishlist / bulk bag with real selected colors
  const handleSaveToBag = async () => {
    let groupsToSave = [...confirmedGroups];
    if (groupsToSave.length === 0 && selectedColor) {
      const activeEntries = Object.entries(sizeQtys).filter(([_, q]) => q > 0);
      if (activeEntries.length > 0) {
        const mapped: Record<string, number> = {};
        activeEntries.forEach(([sz, q]) => (mapped[sz] = q));
        groupsToSave = [{ color: selectedColor, sizeQtys: mapped }];
      }
    }

    if (groupsToSave.length === 0 || !product) {
      showWarning('Configuration Needed', 'Select at least one color/size with quantity > 0.');
      return;
    }
    try {
      for (const group of groupsToSave) {
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
                srp: currentUnitPrice,
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
    if (!product || isSubmitting) return;

    if (!isAuthenticated || !user) {
      showWarning('Sign In Required', 'Please log in to your wholesale account to place orders.');
      router.push('/login');
      return;
    }

    // Determine groups to submit (take breakdown if populated, else active picker)
    let groupsToSubmit = [...confirmedGroups];
    if (groupsToSubmit.length === 0 && selectedColor) {
      const activeEntries = Object.entries(sizeQtys).filter(([_, q]) => q > 0);
      if (activeEntries.length > 0) {
        const mapped: Record<string, number> = {};
        activeEntries.forEach(([sz, q]) => (mapped[sz] = q));
        groupsToSubmit = [{ color: selectedColor, sizeQtys: mapped }];
      }
    }

    if (groupsToSubmit.length === 0) {
      showWarning('Quantity Required', 'Please configure at least one size with quantity > 0.');
      return;
    }

    const orderUnits = groupsToSubmit.reduce(
      (acc, g) => acc + Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
      0
    );

    if (orderUnits < moq) {
      showWarning(
        'Minimum Order Quantity',
        `The MOQ for ${product.name} is ${moq} units. You currently have ${orderUnits} units.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let profile: { legalBusinessName?: string; fullName?: string; phone?: string; warehouseAddress?: string } = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {};
      }

      const buyerPhone = profile.phone || (user as any).phone || (user as any).phoneNumber;
      const buyerName = profile.legalBusinessName || profile.fullName || user.name || user.email?.split('@')[0];
      const buyerAddress = profile.warehouseAddress;

      // In Dart, identity & logistics are mandatory to ensure supplier can dispatch
      if (!buyerPhone || buyerPhone.trim().length < 5) {
        showWarning('Phone Number Required', 'Please provide a contact phone number in Profile so the supplier can coordinate wholesale delivery.');
        router.push('/profile');
        setIsSubmitting(false);
        return;
      }

      const orderId =
        'ORD-' +
        Date.now().toString(36).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();

      const unitPriceForOrder = getWholesaleUnitPrice(product, orderUnits);
      const totalOrderAmount = orderUnits * unitPriceForOrder;

      const orderPayload = {
        order_id: orderId,
        supplier_id: product.supplierId || '1a47f0fe-3f4d-487f-95b5-1f7cfe27b7b7',
        business_name: buyerName || 'Wholesale Buyer',
        business_phone: buyerPhone,
        business_city: 'Kampala',
        business_address: buyerAddress || 'Kampala Wholesale Hub, Uganda',
        total_amount: totalOrderAmount,
        entries_json: groupsToSubmit.map((g) => {
          const groupUnits = Object.values(g.sizeQtys).reduce((s, q) => s + q, 0);
          return {
            name: product.name,
            product_id: product.id,
            product: {
              id: product.id,
              name: product.name,
              brand: product.brand,
              sku: product.sku,
              srp: product.srp,
              imageUrl: product.imageUrl,
              price_tiers: product.priceTiers,
              moq: product.moq,
            },
            color: g.color.label,
            colorHex: g.color.color,
            size_quantities: g.sizeQtys,
            confirmedGroups: [g],
            unit_price: unitPriceForOrder,
            total_units: groupUnits,
            subtotal: groupUnits * unitPriceForOrder,
          };
        }),
      };

      await ProfileApiService.createOrder(orderPayload);
      showSuccess('Order Placed! 🎉', `Wholesale order for ${product.name} submitted successfully!`);
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Text style={[styles.bannerPrice, { color: '#00E5FF' }]}>
                  {formatPrice(currentUnitPrice)} <Text style={[styles.bannerPerUnit, { color: gitSubtleText }]}>/ unit (Wholesale)</Text>
                </Text>
                {product.srp > currentUnitPrice && (
                  <Text style={{ fontSize: 11, color: gitSubtleText, textDecorationLine: 'line-through' }}>
                    {formatPrice(product.srp)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ── Wholesale Price Tiers Overview Bar ── */}
          {product.priceTiers && product.priceTiers.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: gitBorder, backgroundColor: gitHeaderBg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcon name="price_change" size={16} color="#00E5FF" />
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: colors.onSurface }}>
                    WHOLESALE VOLUME TIERS
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: gitSubtleText }}>
                  MOQ: <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{moq} units</Text>
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {product.priceTiers.map((tier, idx) => {
                  const isTierActive = activeTier?.minQuantity === tier.minQuantity;
                  return (
                    <View
                      key={idx}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: isTierActive ? '#10B981' : gitBorder,
                        backgroundColor: isTierActive ? 'rgba(16, 185, 129, 0.15)' : (isDark ? '#161B22' : '#FFFFFF'),
                        minWidth: 110,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Outfit_700Bold', color: isTierActive ? '#10B981' : colors.onSurface }}>
                          {tier.minQuantity}+ Units
                        </Text>
                        {isTierActive && (
                          <View style={{ backgroundColor: '#10B981', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                            <Text style={{ fontSize: 8.5, fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF' }}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12.5, fontFamily: 'Outfit_800ExtraBold', color: isTierActive ? '#10B981' : colors.onSurface }}>
                        {formatPrice(tier.price)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Main Two-Column or Stacked View ── */}
          <View style={[styles.mainLayout, isDesktop && styles.desktopMainLayout]}>
            {/* ── Left / Top: Configuration Controls (Flat, No Card Box) ── */}
            <View
              style={[
                styles.configColumn,
                isDesktop && styles.desktopConfigColumn,
                { borderRightColor: isDesktop ? gitBorder : 'transparent' },
              ]}
            >
              {/* 1. SELECT COLOUR YOU WANT (Dart 1:1 Parity) */}
              {availableColors.length > 0 && (
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
                      const isAlreadyAdded = confirmedGroups.some((g) => g.color.label === variant.label);
                      return (
                        <TouchableOpacity
                          key={variant.label}
                          activeOpacity={0.8}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedColor(null);
                              setSizeQtys({});
                            } else {
                              setSelectedColor(variant);
                              setSizeQtys({});
                            }
                          }}
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
                            {isSelected ? (
                              <MaterialIcon name="check" size={18} color="#FFFFFF" />
                            ) : isAlreadyAdded ? (
                              <MaterialIcon name="check_circle" size={14} color="rgba(255,255,255,0.7)" />
                            ) : null}
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
              )}

              {/* 2. SELECT SIZE / CARTON (Available when color is selected or no colors exist) */}
              {(selectedColor || availableColors.length === 0) && (
                <View style={[styles.sectionGroup, { borderBottomColor: gitBorder }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                      SELECT {availableSizes.length > 0 ? 'SIZE / CARTON' : 'QUANTITY'}
                    </Text>
                    {availableSizes.length > 0 && (
                      <Text style={[styles.sectionBadge, { color: colors.primary }]}>
                        {availableSizes.length} Option{availableSizes.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>

                  {availableSizes.length > 0 ? (
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
                  ) : null}

                  {/* Quantities for selected sizes */}
                  {Object.keys(sizeQtys).length > 0 ? (
                    <View style={styles.qtysContainer}>
                      <Text style={[styles.qtySectionHeader, { color: gitSubtleText }]}>
                        QUANTITIES FOR {selectedColor?.label ? selectedColor.label.toUpperCase() : 'STANDARD UNIT'}
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
                  ) : (
                    <Text style={{ fontSize: 12, color: gitSubtleText, marginTop: 8 }}>
                      Tap one or more sizes above to specify quantities.
                    </Text>
                  )}

                  {/* Add to Order Breakdown CTA */}
                  {Object.keys(sizeQtys).length > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleAddGroup}
                      style={[styles.addGroupBtn, { backgroundColor: colors.primary }]}
                    >
                      <MaterialIcon name="add_shopping_cart" size={18} color="#FFFFFF" />
                      <Text style={styles.addGroupBtnText}>
                        Add {selectedColor?.label ? `"${selectedColor.label}"` : 'Items'} to Order Breakdown
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ── Right / Bottom: Order Breakdown (Flat Git-style, No Box) ── */}
            <View style={[styles.breakdownColumn, isDesktop && styles.desktopBreakdownColumn]}>
              <View style={[styles.breakdownHeader, { borderBottomColor: gitBorder }]}>
                <Text style={[styles.breakdownTitle, { color: colors.onSurface }]}>
                  ORDER SUMMARY ({totalUnits} UNITS)
                </Text>
                {totalUnits > 0 && (
                  <View style={{ backgroundColor: meetsMoq ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: meetsMoq ? '#10B981' : '#EF4444', fontSize: 10.5, fontFamily: 'Outfit_700Bold' }}>
                      {meetsMoq ? 'MOQ MET ✓' : `NEEDS ${moq - totalUnits} MORE`}
                    </Text>
                  </View>
                )}
              </View>

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

                {confirmedGroups.length === 0 && totalUnits > 0 && selectedColor && (
                  <View style={{ padding: 12, borderRadius: 8, backgroundColor: gitHeaderBg, marginBottom: 12, borderWidth: 1, borderColor: gitBorder }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Outfit_700Bold', color: colors.onSurface, marginBottom: 4 }}>
                      CONFIGURED VARIANT ({selectedColor.label})
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(sizeQtys).filter(([_, q]) => q > 0).map(([sz, qty]) => (
                        <View key={sz} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: isDark ? '#21262D' : '#F1F5F9' }}>
                          <Text style={{ fontSize: 11, color: colors.onSurface }}>
                            {sz}: <Text style={{ color: '#00E5FF', fontWeight: '700' }}>{qty} pcs</Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {confirmedGroups.length === 0 && totalUnits === 0 && (
                  <View style={styles.emptyBreakdown}>
                    <MaterialIcon name="playlist_add" size={38} color={gitSubtleText} />
                    <Text style={[styles.emptyBreakdownTitle, { color: colors.onSurface }]}>
                      No sizes selected yet
                    </Text>
                    <Text style={[styles.emptyBreakdownSub, { color: gitSubtleText }]}>
                      Pick your color and choose quantities for sizes on the left to begin your wholesale order.
                    </Text>
                  </View>
                )}

                {/* Pricing and Totals Breakdown */}
                <View style={[styles.totalsBox, { borderTopColor: gitBorder }]}>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: gitSubtleText }]}>Total Units</Text>
                    <Text style={[styles.calcVal, { color: colors.onSurface }]}>{totalUnits} Units</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: gitSubtleText }]}>Tiered Wholesale Price</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.calcVal, { color: '#00E5FF', fontFamily: 'Outfit_700Bold' }]}>
                        {formatPrice(currentUnitPrice)} / pc
                      </Text>
                      {totalSavings > 0 && (
                        <Text style={{ color: '#10B981', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                          Saving {formatPrice(totalSavings)} vs SRP!
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.calcRow, { marginTop: 6 }]}>
                    <Text style={[styles.grandLabel, { color: colors.onSurface }]}>Estimated Total Value</Text>
                    <Text style={[styles.grandVal, { color: colors.primary }]}>{formatPrice(subtotal)}</Text>
                  </View>
                </View>

                {/* Actions: Save Draft & Place Order */}
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
                    style={[styles.primaryActionBtn, { backgroundColor: meetsMoq ? colors.primary : '#64748B' }]}
                  >
                    <MaterialIcon name="check_circle" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>
                      {isSubmitting ? 'Submitting...' : 'Confirm Order'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    width: '100%',
  },
  desktopConfigColumn: {
    flex: 1,
    borderRightWidth: 1,
  },
  breakdownColumn: {
    width: '100%',
  },
  desktopBreakdownColumn: {
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
