import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { getWholesaleUnitPrice } from '@/features/inventory/utils/wholesale_pricing';
import { useAuth } from '@/features/auth/context/auth_context';
import { useProducts } from '@/features/inventory/context/products_context';
import { buildSpecSheetPayload, makeAndOpenSpecSheetPdf } from '@/core/utils/pdf_spec_sheet';
import {
  ColorVariant,
  ColorGroup,
} from './order_models';

export default function MultiProductOrderPage() {
  const router = useAppNavigation();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const { ids, draftId } = useLocalSearchParams<{ ids?: string; draftId?: string }>();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const isDesktop = width >= 960;
  const { products: contextProducts, getProductById } = useProducts();

  // GitHub Primer flat border colors
  const gitBorder = isDark ? '#30363D' : '#D0D7DE';
  const gitHeaderBg = isDark ? '#161B22' : '#F6F8FA';
  const gitSubtleText = isDark ? '#8B949E' : '#57606A';

  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState<Product[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showingSummary, setShowingSummary] = useState(false);

  // Completed configurations for each product
  const [productConfigs, setProductConfigs] = useState<Map<string, ColorGroup[]>>(new Map());

  // Current active product step state
  const [activeColor, setActiveColor] = useState<ColorVariant | null>(null);
  const [activeSizeQtys, setActiveSizeQtys] = useState<Record<string, number>>({});
  const [currentGroups, setCurrentGroups] = useState<ColorGroup[]>([]);

  // Bulk Draft naming state
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [bulkDraftName, setBulkDraftName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Load products based on IDs passed
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadProducts = async () => {
      // Deduplicate IDs
      const rawIds = (ids || '').split(',').map((s) => s.trim()).filter(Boolean);
      const uniqueIds = Array.from(new Set(rawIds));

      if (uniqueIds.length === 0) {
        if (contextProducts.length > 0 && isMounted) {
          setProductList(contextProducts.slice(0, 3));
        }
        setLoading(false);
        return;
      }

      const fetched: Product[] = [];
      for (const pId of uniqueIds) {
        const cached = getProductById(pId);
        if (cached) {
          fetched.push(cached);
        } else {
          try {
            const p = await ProductApiService.getProductById(pId);
            if (p) fetched.push(p);
          } catch (e) {
            console.log('Error fetching product:', pId, e);
          }
        }
      }

      if (isMounted) {
        setProductList(fetched.length > 0 ? fetched : contextProducts.slice(0, 3));
        setLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [ids, contextProducts]);

  // Restore draft if draftId is supplied
  useEffect(() => {
    if (draftId && isAuthenticated) {
      ProfileApiService.getDraftOrders().then((drafts) => {
        const found = drafts.find((d) => d.id === draftId);
        if (found) {
          if (found.title) setBulkDraftName(found.title);
          const entries = found.entries || [];
          const restoredMap = new Map<string, ColorGroup[]>();
          entries.forEach((e: any) => {
            const pId = e.product_id || e.productId;
            if (pId) {
              const currentList = restoredMap.get(pId) || [];
              const colorName = e.color || e.color_name || 'Standard';
              const hex = e.colorHex || e.hex || '#1C1B1F';
              const sq = e.size_quantities || e.sizeQtys || {};
              currentList.push({
                color: { label: colorName, color: hex },
                sizeQtys: sq,
              });
              restoredMap.set(pId, currentList);
            }
          });
          if (restoredMap.size > 0) {
            setProductConfigs(restoredMap);
          }
        }
      }).catch((e) => console.log('Could not restore draft:', e));
    }
  }, [draftId]);

  const currentProduct: Product | undefined = productList[currentStepIndex];

  // Derive available colors for current product
  const availableColors: ColorVariant[] = useMemo(() => {
    if (currentProduct?.colors && currentProduct.colors.length > 0) {
      return currentProduct.colors.map((c) => ({
        label: c.name,
        color: c.hexCode || '#1C1B1F',
      }));
    }
    return [];
  }, [currentProduct?.colors]);

  // Derive available sizes for current product
  const availableSizes: string[] = useMemo(() => {
    if (currentProduct?.sizes && currentProduct.sizes.length > 0) {
      return currentProduct.sizes.map((s) => s.abbreviation || s.name);
    }
    return [];
  }, [currentProduct?.sizes]);

  // Reset active state when changing product step
  useEffect(() => {
    if (!currentProduct) return;
    const existing = productConfigs.get(currentProduct.id) || [];
    setCurrentGroups(existing);
    if (availableColors.length > 0) {
      setActiveColor(null); // Wait for user to pick color like Dart
    } else {
      setActiveColor({ label: 'Standard / As Shown', color: '#1C1B1F' });
    }
    const initialQtys: Record<string, number> = {};
    if (availableSizes.length === 0) {
      initialQtys['Standard Unit'] = currentProduct.moq || 1;
    } else {
      availableSizes.forEach((s) => (initialQtys[s] = 0));
    }
    setActiveSizeQtys(initialQtys);
  }, [currentStepIndex, currentProduct?.id, availableColors.length, availableSizes.length]);

  const handleQtyChange = (size: string, delta: number) => {
    setActiveSizeQtys((prev) => {
      const current = prev[size] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [size]: next };
    });
  };

  const handleAddColorGroup = () => {
    if (!activeColor) return;
    const sumUnits = Object.values(activeSizeQtys).reduce((a, b) => a + b, 0);
    if (sumUnits === 0) {
      showWarning('Quantity Required', 'Please enter at least 1 unit for any size.');
      return;
    }

    // Add or merge into current groups
    setCurrentGroups((prev) => {
      const existingIdx = prev.findIndex((g) => g.color.label === activeColor.label);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const mergedQtys = { ...updated[existingIdx].sizeQtys };
        Object.entries(activeSizeQtys).forEach(([size, qty]) => {
          if (qty > 0) {
            mergedQtys[size] = (mergedQtys[size] || 0) + qty;
          }
        });
        updated[existingIdx] = { color: activeColor, sizeQtys: mergedQtys };
        return updated;
      }
      const filteredQtys: Record<string, number> = {};
      Object.entries(activeSizeQtys).forEach(([s, q]) => {
        if (q > 0) filteredQtys[s] = q;
      });
      return [...prev, { color: activeColor, sizeQtys: filteredQtys }];
    });

    // Reset size inputs
    const resetQtys: Record<string, number> = {};
    availableSizes.forEach((s) => (resetQtys[s] = 0));
    setActiveSizeQtys(resetQtys);
    showSuccess('Variant Added', `Added ${sumUnits} units of ${activeColor.label}.`);
  };

  const handleRemoveGroup = (idx: number) => {
    setCurrentGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    if (!currentProduct) return;
    if (currentGroups.length === 0) {
      showWarning('Selection Required', `Please configure at least one color/size for ${currentProduct.name}.`);
      return;
    }

    // Save configuration into map
    setProductConfigs((prev) => {
      const nextMap = new Map(prev);
      nextMap.set(currentProduct.id, currentGroups);
      return nextMap;
    });

    if (currentStepIndex < productList.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setShowingSummary(true);
    }
  };

  const handlePrevious = () => {
    if (showingSummary) {
      setShowingSummary(false);
      return;
    }
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      router.safeGoBack('/profile');
    }
  };

  // Calculations for summary - DEDUPLICATED by product id
  const summaryItems = useMemo(() => {
    // Unique list of products
    const seen = new Set<string>();
    const uniqueProducts = productList.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return uniqueProducts.map((p) => {
      const groups = productConfigs.get(p.id) || [];
      const totalUnits = groups.reduce(
        (sum, g) => sum + Object.values(g.sizeQtys).reduce((a, b) => a + b, 0),
        0
      );
      const unitPrice = getWholesaleUnitPrice(p, totalUnits);
      const subtotal = totalUnits * unitPrice;
      return {
        product: p,
        groups,
        totalUnits,
        unitPrice,
        subtotal,
      };
    });
  }, [productList, productConfigs]);

  const grandTotalUnits = summaryItems.reduce((acc, item) => acc + item.totalUnits, 0);
  const grandTotalAmount = summaryItems.reduce((acc, item) => acc + item.subtotal, 0);

  const formatPrice = (val: number) => 'UGX ' + (val || 0).toLocaleString('en-US');

  // Trigger Save Draft prompt
  const handleSaveDraftClick = () => {
    if (!isAuthenticated || !user) {
      showWarning('Sign In Required', 'Please log in to save bulk drafts.');
      router.push('/login');
      return;
    }
    if (grandTotalUnits === 0) {
      showWarning('No Items', 'Configure items before saving as a draft.');
      return;
    }
    if (!bulkDraftName) {
      const defaultName = productList.length > 1
        ? `${productList[0]?.name} + ${productList.length - 1} more Bulk Order`
        : `${productList[0]?.name} Bulk Order`;
      setBulkDraftName(defaultName);
    }
    setShowNamingModal(true);
  };

  // Generate instant PDF Spec Sheet (works authenticated & unauthenticated)
  const handleDownloadPdf = async () => {
    if (grandTotalUnits === 0 || isGeneratingPdf) {
      showWarning('Selection Needed', 'Configure items before generating a PDF spec sheet.');
      return;
    }

    setIsGeneratingPdf(true);
    showSuccess('Architecting PDF', 'Compiling consolidated wholesale spec sheet...');

    try {
      let profile: any = {};
      if (isAuthenticated && user) {
        try {
          profile = await ProfileApiService.getProfile();
        } catch {
          profile = {};
        }
      }

      const payload = buildSpecSheetPayload({
        title: `Bulk Spec Sheet (${summaryItems.length} Products)`,
        items: summaryItems.map((item) => ({
          product: item.product,
          groups: item.groups,
          unitPrice: item.unitPrice,
        })),
        buyerProfile: {
          fullName: profile.fullName || user?.name,
          legalBusinessName: profile.legalBusinessName || user?.legalBusinessName,
          email: profile.email || user?.email,
          phone: profile.phone,
          warehouseAddress: profile.warehouseAddress,
        },
        isAuthenticated: Boolean(isAuthenticated && user),
      });

      await makeAndOpenSpecSheetPdf(payload);
      showSuccess('PDF Ready', 'Consolidated order spec sheet generated!');
    } catch (err: any) {
      showError('PDF Generation Failed', err?.message || 'Could not compile PDF spec sheet.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Save Consolidated Draft with custom name
  const handleExecuteSaveDraft = async () => {
    if (isSavingDraft || grandTotalUnits === 0) return;
    const finalName = bulkDraftName.trim() || `${productList[0]?.name || 'Consolidated'} Bulk Order`;
    setShowNamingModal(false);
    setIsSavingDraft(true);

    try {
      let profile: any = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {};
      }

      const draftIdGenerated = draftId || ('DRAFT-' + Date.now().toString(36).toUpperCase());

      const entries = summaryItems.flatMap((item) =>
        item.groups.map((g) => ({
          product_id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          image_url: item.product.imageUrl,
          color: g.color.label,
          colorHex: g.color.color,
          size_quantities: g.sizeQtys,
          unit_price: item.product.srp,
          total_units: Object.values(g.sizeQtys).reduce((a, b) => a + b, 0),
          supplier_id: item.product.supplierId || '',
          business_name: profile.legalBusinessName || profile.fullName || '',
        }))
      );

      const draftPayload = {
        order_id: draftIdGenerated,
        title: finalName,
        name: finalName,
        supplier_id: productList[0]?.supplierId || '',
        business_name: profile.legalBusinessName || profile.fullName || '',
        business_phone: profile.phone || '',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || '',
        total_amount: grandTotalAmount,
        status: 'draft',
        entries_json: entries,
      };

      await ProfileApiService.saveDraftOrder(draftPayload);
      showSuccess('Draft Saved', `"${finalName}" saved to your profile drafts.`);
      setTimeout(() => router.push('/profile'), 1200);
    } catch (err: any) {
      showError('Save Draft Failed', err?.message || 'Could not save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit Consolidated Wholesale Order
  const handleConfirmOrder = async () => {
    if (!isAuthenticated || !user) {
      showWarning('Sign In Required', 'Please log in to submit consolidated wholesale orders.');
      router.push('/login');
      return;
    }
    if (isSubmitting || grandTotalUnits === 0) return;
    setIsSubmitting(true);

    try {
      let profile: any = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {};
      }

      // Group items by supplier_id so each supplier receives their own order
      const itemsBySupplier = new Map<string, typeof summaryItems>();
      summaryItems.forEach((item) => {
        const sid = item.product.supplierId || productList[0]?.supplierId || 'DIRECT';
        const list = itemsBySupplier.get(sid) || [];
        list.push(item);
        itemsBySupplier.set(sid, list);
      });

      const orderIds: string[] = [];
      for (const [supplierId, supItems] of itemsBySupplier.entries()) {
        const supOrderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + (supplierId ? supplierId.slice(0, 4) : 'BULK');
        const supEntries = supItems.flatMap((item) =>
          item.groups.map((g) => ({
            product_id: item.product.id,
            name: item.product.name,
            product: {
              id: item.product.id,
              name: item.product.name,
              brand: item.product.brand,
              sku: item.product.sku,
              srp: item.product.srp,
              imageUrl: item.product.imageUrl,
              price_tiers: item.product.priceTiers,
              moq: item.product.moq,
            },
            imageUrl: item.product.imageUrl,
            image_url: item.product.imageUrl,
            color: g.color.label,
            colorHex: g.color.color,
            size_quantities: g.sizeQtys,
            confirmedGroups: [g],
            unit_price: item.unitPrice,
            total_units: Object.values(g.sizeQtys).reduce((a, b) => a + b, 0),
            subtotal: Object.values(g.sizeQtys).reduce((a, b) => a + b, 0) * item.unitPrice,
            supplier_id: supplierId || '1a47f0fe-3f4d-487f-95b5-1f7cfe27b7b7',
            business_name: profile.legalBusinessName || profile.fullName || 'Wholesale Buyer',
          }))
        );
        const supTotalAmount = supItems.reduce((acc, item) => acc + item.subtotal, 0);

        const orderPayload = {
          order_id: supOrderId,
          supplier_id: supplierId || '1a47f0fe-3f4d-487f-95b5-1f7cfe27b7b7',
          business_name: profile.legalBusinessName || profile.fullName || 'Wholesale Buyer',
          business_phone: profile.phone || '0700000000',
          business_city: 'Kampala',
          business_address: profile.warehouseAddress || 'Kampala Wholesale Hub, Uganda',
          total_amount: supTotalAmount,
          entries_json: supEntries,
        };

        await ProfileApiService.createOrder(orderPayload);
        orderIds.push(supOrderId);
      }

      showSuccess('Order Placed!', `Consolidated wholesale order (${orderIds.join(', ')}) placed successfully.`);
      setTimeout(() => router.push('/profile'), 1400);
    } catch (err: any) {
      showError('Order Failed', err?.message || 'Could not place consolidated order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.onSurface }}>Loading bulk order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productList.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerContainer}>
          <MaterialIcon name="inventory_2" size={48} color={gitSubtleText} />
          <Text style={[styles.title, { color: colors.onSurface, marginTop: 12 }]}>No Products Selected</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.primaryBtnText}>Return to Bag</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: gitBorder }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handlePrevious} style={styles.headerBackBtn}>
          <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {showingSummary ? 'Consolidated Order Review' : `Configuring Product ${currentStepIndex + 1} of ${productList.length}`}
          </Text>
          <Text style={[styles.headerSubtitle, { color: gitSubtleText }]} numberOfLines={1}>
            {showingSummary ? `${summaryItems.length} products ready for checkout` : currentProduct?.name}
          </Text>
        </View>
      </View>

      {/* ── Step Stepper Progress Bar (Dart style line indicator) ── */}
      {!showingSummary && (
        <View style={[styles.progressRow, { backgroundColor: colors.surface, borderBottomColor: gitBorder }]}>
          {productList.map((p, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <View
                key={p.id}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: isDone || isCurrent ? colors.primary : gitBorder,
                    opacity: isDone || isCurrent ? 1 : 0.4,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {showingSummary ? (
        /* ── SUMMARY VIEW (Clean Flat Git List, No Box) ── */
        <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryListContainer}>
            {summaryItems.map((item) => (
              <View key={item.product.id} style={[styles.summaryItemRow, { borderBottomColor: gitBorder }]}>
                <Image source={{ uri: item.product.imageUrl }} style={styles.summaryThumb} resizeMode="cover" />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.summaryProdTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: colors.primary }]}>
                    {item.totalUnits} units • {formatPrice(item.subtotal)}
                  </Text>

                  {/* Configured Color Groups Badges */}
                  <View style={styles.summaryBadgesWrap}>
                    {item.groups.map((g, gi) => (
                      <View key={gi} style={[styles.summaryBadge, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}>
                        <View style={[styles.summaryColorDot, { backgroundColor: g.color.color }]} />
                        <Text style={[styles.summaryBadgeText, { color: colors.onSurface }]}>
                          {g.color.label}: {Object.entries(g.sizeQtys).map(([s, q]) => `${s}×${q}`).join(', ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}

            {/* Grand Total Summary Box */}
            <View style={[styles.grandTotalRow, { borderTopColor: gitBorder, borderBottomColor: gitBorder }]}>
              <View>
                <Text style={[styles.grandLabel, { color: gitSubtleText }]}>Total Units</Text>
                <Text style={[styles.grandVal, { color: colors.onSurface }]}>{grandTotalUnits} units</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.grandLabel, { color: gitSubtleText }]}>Grand Total Amount</Text>
                <Text style={[styles.grandVal, { color: colors.primary }]}>{formatPrice(grandTotalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveDraftBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
              onPress={handleDownloadPdf}
              disabled={isGeneratingPdf || isSavingDraft || isSubmitting}
            >
              <MaterialIcon name="picture_as_pdf" size={18} color="#E53935" />
              <Text style={[styles.saveDraftText, { color: colors.onSurface }]}>
                {isGeneratingPdf ? 'Making...' : 'Make PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveDraftBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
              onPress={handleSaveDraftClick}
              disabled={isSavingDraft || isSubmitting}
            >
              <MaterialIcon name="edit_note" size={18} color={colors.primary} />
              <Text style={[styles.saveDraftText, { color: colors.onSurface }]}>
                {isSavingDraft ? 'Saving Draft...' : 'Save as Draft'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.confirmOrderBtn, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.6 }]}
              onPress={handleConfirmOrder}
              disabled={isSubmitting || isSavingDraft}
            >
              <MaterialIcon name="check_circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmOrderText}>
                {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ── STEP-BY-STEP CONFIGURATION (Clean Flat Git Style, No Box) ── */
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          {/* Active Product Row (Flat, No Box) */}
          {currentProduct && (
            <View style={[styles.productBannerRow, { borderBottomColor: gitBorder }]}>
              <Image source={{ uri: currentProduct.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.bannerBrand, { color: gitSubtleText }]}>
                  {currentProduct.brand ? currentProduct.brand.toUpperCase() : 'VERIFIED WHOLESALE'}
                </Text>
                <Text style={[styles.bannerName, { color: colors.onSurface }]} numberOfLines={2}>
                  {currentProduct.name}
                </Text>
                <Text style={[styles.bannerPrice, { color: colors.primary }]}>
                  {formatPrice(currentProduct.srp)} <Text style={[styles.bannerPerUnit, { color: gitSubtleText }]}>/ unit</Text>
                </Text>
              </View>
            </View>
          )}

          {/* 1. SELECT COLOUR YOU WANT (Dart 1:1 Parity) */}
          <View style={[styles.sectionGroup, { borderBottomColor: gitBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>SELECT COLOUR YOU WANT</Text>
              <Text style={[styles.sectionBadge, { color: colors.primary }]}>
                {availableColors.length} Option{availableColors.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={[styles.sectionHelper, { color: gitSubtleText }]}>
              tap the color you want, then enter quantities for sizes
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorSwatchesRow}>
              {availableColors.map((c) => {
                const isSelected = activeColor?.label === c.label;
                return (
                  <TouchableOpacity
                    key={c.label}
                    activeOpacity={0.8}
                    onPress={() => setActiveColor(c)}
                    style={styles.swatchWrapper}
                  >
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: c.color },
                        isSelected && {
                          borderColor: colors.primary,
                          borderWidth: 3,
                          shadowColor: c.color,
                          shadowOpacity: 0.5,
                          shadowRadius: 8,
                        },
                      ]}
                    >
                      {isSelected && <MaterialIcon name="check" size={18} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.swatchLabel,
                        { color: isSelected ? colors.primary : gitSubtleText },
                        isSelected && { fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 2. SIZES & QUANTITIES (Flat, No Box) */}
          <View style={[styles.sectionGroup, { borderBottomColor: gitBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 12 }]}>
              ENTER QUANTITIES FOR {activeColor?.label ? activeColor.label.toUpperCase() : 'SELECTED COLOR'}
            </Text>

            <View style={styles.sizesList}>
              {availableSizes.map((size) => {
                const qty = activeSizeQtys[size] || 0;
                return (
                  <View key={size} style={[styles.sizeRow, { borderBottomColor: gitBorder }]}>
                    <Text style={[styles.sizeLabel, { color: colors.onSurface }]}>{size}</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                        onPress={() => handleQtyChange(size, -5)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                        onPress={() => handleQtyChange(size, -1)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        keyboardType="numeric"
                        value={String(qty)}
                        onChangeText={(txt) => {
                          const n = parseInt(txt.replace(/[^0-9]/g, ''), 10) || 0;
                          setActiveSizeQtys((prev) => ({ ...prev, [size]: n }));
                        }}
                        style={[styles.qtyInput, { color: colors.onSurface, borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                        onPress={() => handleQtyChange(size, 1)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                        onPress={() => handleQtyChange(size, 5)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Add Color Variant Group Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.addGroupBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddColorGroup}
            >
              <MaterialIcon name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addGroupBtnText}>Add Color Variant Group</Text>
            </TouchableOpacity>
          </View>

          {/* Current Configured Groups for this Product */}
          {currentGroups.length > 0 && (
            <View style={[styles.sectionGroup, { borderBottomColor: gitBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 10 }]}>
                CURRENT CONFIGURATION ({currentGroups.reduce((acc, g) => acc + Object.values(g.sizeQtys).reduce((a, b) => a + b, 0), 0)} UNITS)
              </Text>
              {currentGroups.map((group, idx) => (
                <View key={idx} style={[styles.confirmedGroupRow, { borderBottomColor: gitBorder }]}>
                  <View style={styles.groupColorLeft}>
                    <View style={[styles.summaryColorDot, { backgroundColor: group.color.color }]} />
                    <Text style={[styles.groupColorName, { color: colors.onSurface }]}>{group.color.label}</Text>
                  </View>
                  <View style={styles.groupSizesWrap}>
                    {Object.entries(group.sizeQtys).map(([sz, q]) => (
                      <View key={sz} style={[styles.summaryBadge, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}>
                        <Text style={[styles.summaryBadgeText, { color: colors.onSurface }]}>
                          {sz} <Text style={{ color: colors.primary, fontWeight: '700' }}>×{q}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveGroup(idx)} style={{ padding: 4 }}>
                    <MaterialIcon name="close" size={16} color={gitSubtleText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Bottom Next/Finish Step Action */}
          <View style={styles.stepFooter}>
            <TouchableOpacity activeOpacity={0.88} style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentStepIndex < productList.length - 1
                  ? `Proceed to Next Product (${currentStepIndex + 2}/${productList.length})`
                  : 'Review Consolidated Order'}
              </Text>
              <MaterialIcon name="arrow_forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

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
              Enter a name for this consolidated configuration to save it in your Drafts tab.
            </Text>

            <TextInput
              value={bulkDraftName}
              onChangeText={setBulkDraftName}
              placeholder="e.g. Suite cases, 2 stand rail net Bulk"
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepContent: {
    paddingBottom: 48,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  productBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bannerImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
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
  sizesList: {
    marginBottom: 12,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sizeLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  stepBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  qtyInput: {
    width: 44,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 14,
  },
  addGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  confirmedGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  groupColorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  groupColorName: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  groupSizesWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepFooter: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  summaryContent: {
    paddingBottom: 48,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  summaryListContainer: {
    paddingHorizontal: 20,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  summaryThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  summaryProdTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  summaryMeta: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    marginVertical: 4,
  },
  summaryBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  summaryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 16,
  },
  grandLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 4,
  },
  grandVal: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  saveDraftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveDraftText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  confirmOrderBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmOrderText: {
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
});
