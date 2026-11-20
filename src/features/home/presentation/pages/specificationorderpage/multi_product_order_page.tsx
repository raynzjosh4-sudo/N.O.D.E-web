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

interface ProductConfig {
  product: Product;
  confirmedGroups: ColorGroup[];
}

export default function MultiProductOrderPage() {
  const router = useAppNavigation();
  const { showSuccess, showError, showWarning } = useToast();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const isDesktop = width >= 960;
  const { products: contextProducts, getProductById } = useProducts();

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Load products based on IDs passed
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadProducts = async () => {
      const idArray = (ids || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (idArray.length === 0) {
        // Fallback: use first few products
        if (contextProducts.length > 0 && isMounted) {
          setProductList(contextProducts.slice(0, 3));
        }
        setLoading(false);
        return;
      }

      const fetched: Product[] = [];
      for (const pId of idArray) {
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

  const currentProduct: Product | undefined = productList[currentStepIndex];

  // Derive available colors for current product
  const availableColors: ColorVariant[] = useMemo(() => {
    if (currentProduct?.colors && currentProduct.colors.length > 0) {
      return currentProduct.colors.map((c) => ({
        label: c.name,
        color: c.hexCode || '#1C1B1F',
      }));
    }
    return [{ label: 'Standard / As Shown', color: '#1C1B1F' }];
  }, [currentProduct?.colors]);

  // Derive available sizes for current product
  const availableSizes: string[] = useMemo(() => {
    if (currentProduct?.sizes && currentProduct.sizes.length > 0) {
      return currentProduct.sizes.map((s) => s.abbreviation || s.name);
    }
    return ['Standard Unit'];
  }, [currentProduct?.sizes]);

  // Reset active state when changing product step
  useEffect(() => {
    if (!currentProduct) return;
    const existing = productConfigs.get(currentProduct.id) || [];
    setCurrentGroups(existing);
    if (availableColors.length > 0) {
      setActiveColor(availableColors[0]);
    }
    const initialQtys: Record<string, number> = {};
    availableSizes.forEach((s) => (initialQtys[s] = 0));
    setActiveSizeQtys(initialQtys);
  }, [currentStepIndex, currentProduct?.id]);

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
          mergedQtys[size] = (mergedQtys[size] || 0) + qty;
        });
        updated[existingIdx] = { color: activeColor, sizeQtys: mergedQtys };
        return updated;
      }
      return [...prev, { color: activeColor, sizeQtys: { ...activeSizeQtys } }];
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

    // Save configuration
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

  // Calculations for summary
  const summaryItems = useMemo(() => {
    return productList.map((p) => {
      const groups = productConfigs.get(p.id) || [];
      const totalUnits = groups.reduce(
        (sum, g) => sum + Object.values(g.sizeQtys).reduce((a, b) => a + b, 0),
        0
      );
      const subtotal = totalUnits * p.srp;
      return {
        product: p,
        groups,
        totalUnits,
        subtotal,
      };
    });
  }, [productList, productConfigs]);

  const grandTotalUnits = summaryItems.reduce((acc, item) => acc + item.totalUnits, 0);
  const grandTotalAmount = summaryItems.reduce((acc, item) => acc + item.subtotal, 0);

  const formatPrice = (val: number) => 'UGX ' + (val || 0).toLocaleString('en-US');

  // Save Consolidated Draft
  const handleSaveDraft = async () => {
    if (isSavingDraft || grandTotalUnits === 0) return;
    setIsSavingDraft(true);

    try {
      let profile: any = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = { legalBusinessName: 'Wholesale Buyer' };
      }

      const draftId = 'DRAFT-' + Date.now().toString(36).toUpperCase();

      const entries = summaryItems.flatMap((item) =>
        item.groups.map((g) => ({
          product_id: item.product.id,
          name: item.product.name,
          color: g.color.label,
          size_quantities: g.sizeQtys,
          unit_price: item.product.srp,
          total_units: Object.values(g.sizeQtys).reduce((a, b) => a + b, 0),
          supplier_id: item.product.supplierId || '',
          business_name: profile.legalBusinessName || 'Wholesale Buyer',
        }))
      );

      const draftPayload = {
        order_id: draftId,
        supplier_id: productList[0]?.supplierId || 'supplier-main',
        business_name: profile.legalBusinessName || 'Wholesale Buyer',
        business_phone: profile.phone || '0700000000',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || 'Kampala Logistics Hub',
        total_amount: grandTotalAmount,
        status: 'draft',
        entries_json: entries,
      };

      await ProfileApiService.saveDraftOrder(draftPayload);
      showSuccess('Draft Saved', 'Consolidated bulk order saved to your profile drafts.');
      setTimeout(() => router.push('/profile'), 1200);
    } catch (err: any) {
      showError('Save Draft Failed', err?.message || 'Could not save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit Consolidated Wholesale Order
  const handleConfirmOrder = async () => {
    if (isSubmitting || grandTotalUnits === 0) return;
    setIsSubmitting(true);

    try {
      let profile: any = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = { legalBusinessName: 'Wholesale Buyer' };
      }

      const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();

      const entries = summaryItems.flatMap((item) =>
        item.groups.map((g) => ({
          product_id: item.product.id,
          name: item.product.name,
          color: g.color.label,
          size_quantities: g.sizeQtys,
          unit_price: item.product.srp,
          total_units: Object.values(g.sizeQtys).reduce((a, b) => a + b, 0),
          supplier_id: item.product.supplierId || '',
          business_name: profile.legalBusinessName || 'Wholesale Buyer',
        }))
      );

      const orderPayload = {
        order_id: orderId,
        supplier_id: productList[0]?.supplierId || 'supplier-main',
        business_name: profile.legalBusinessName || 'Wholesale Buyer',
        business_phone: profile.phone || '0700000000',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || 'Kampala Logistics Hub',
        total_amount: grandTotalAmount,
        entries_json: entries,
      };

      await ProfileApiService.createOrder(orderPayload);
      showSuccess('Order Placed!', `Your consolidated wholesale order ${orderId} has been sent to suppliers.`);
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
          <MaterialIcon name="inventory_2" size={48} color={colors.onSurfaceMuted} />
          <Text style={[styles.title, { color: colors.onSurface, marginTop: 12 }]}>No Products Selected</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => router.push('/profile')}>
            <Text style={styles.primaryBtnText}>Return to Bag</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handlePrevious} style={styles.headerBackBtn}>
          <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {showingSummary ? 'Consolidated Order Review' : `Configuring Product ${currentStepIndex + 1} of ${productList.length}`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {showingSummary ? `${productList.length} products ready for checkout` : currentProduct?.name}
          </Text>
        </View>
      </View>

      {showingSummary ? (
        /* ── SUMMARY VIEW ── */
        <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Order Summary Breakdown</Text>
            {summaryItems.map((item, idx) => (
              <View key={item.product.id} style={[styles.summaryRow, { borderBottomColor: colors.borderLight }]}>
                <Image source={{ uri: item.product.imageUrl }} style={styles.summaryThumb} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.summaryProdTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.summaryMeta}>
                    {item.groups.map((g) => `${g.color.label} (${Object.values(g.sizeQtys).reduce((a, b) => a + b, 0)})`).join(', ')}
                  </Text>
                  <Text style={[styles.summarySubtotal, { color: colors.primary }]}>
                    {item.totalUnits} units • {formatPrice(item.subtotal)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.grandTotalRow, { backgroundColor: colors.scaffoldBackground }]}>
              <View>
                <Text style={styles.grandLabel}>Total Units</Text>
                <Text style={[styles.grandVal, { color: colors.onSurface }]}>{grandTotalUnits} units</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.grandLabel}>Grand Total Amount</Text>
                <Text style={[styles.grandVal, { color: colors.primary }]}>{formatPrice(grandTotalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveDraftBtn, { borderColor: colors.borderLight }, isSavingDraft && { opacity: 0.6 }]}
              onPress={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
            >
              <MaterialIcon name="edit_note" size={18} color={colors.primary} />
              <Text style={[styles.saveDraftText, { color: colors.onSurface }]}>
                {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.confirmOrderBtn, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.6 }]}
              onPress={handleConfirmOrder}
              disabled={isSubmitting || isSavingDraft}
            >
              <MaterialIcon name="lock" size={16} color="#FFFFFF" />
              <Text style={styles.confirmOrderText}>
                {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ── STEP-BY-STEP CONFIGURATION ── */
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          {/* Active Product Card */}
          {currentProduct && (
            <View style={[styles.productBannerCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Image source={{ uri: currentProduct.imageUrl }} style={styles.bannerImg} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.bannerBrand}>{currentProduct.brand || 'Verified Wholesale'}</Text>
                <Text style={[styles.bannerName, { color: colors.onSurface }]} numberOfLines={2}>
                  {currentProduct.name}
                </Text>
                <Text style={[styles.bannerPrice, { color: colors.primary }]}>
                  {formatPrice(currentProduct.srp)} / unit
                </Text>
              </View>
            </View>
          )}

          {/* Color Selection */}
          <View style={[styles.configCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.cardHeader, { color: colors.onSurface }]}>1. Choose Color Variant</Text>
            <View style={styles.colorsGrid}>
              {availableColors.map((c) => {
                const isSelected = activeColor?.label === c.label;
                return (
                  <TouchableOpacity
                    key={c.label}
                    activeOpacity={0.75}
                    onPress={() => setActiveColor(c)}
                    style={[
                      styles.colorPill,
                      { borderColor: isSelected ? colors.primary : colors.borderLight },
                      isSelected && { backgroundColor: 'rgba(18, 187, 240, 0.08)' },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                    <Text style={[styles.colorLabel, { color: isSelected ? colors.primary : colors.onSurface }]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Size & Quantities Inputs */}
            <Text style={[styles.cardHeader, { color: colors.onSurface, marginTop: 18 }]}>
              2. Enter Quantities for {activeColor?.label || 'Selected Variant'}
            </Text>
            <View style={styles.sizesList}>
              {availableSizes.map((size) => {
                const qty = activeSizeQtys[size] || 0;
                return (
                  <View key={size} style={[styles.sizeRow, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.sizeLabel, { color: colors.onSurface }]}>{size}</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: colors.borderLight }]}
                        onPress={() => handleQtyChange(size, -5)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: colors.borderLight }]}
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
                        style={[styles.qtyInput, { color: colors.onSurface, borderColor: colors.borderLight }]}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: colors.borderLight }]}
                        onPress={() => handleQtyChange(size, 1)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.stepBtn, { borderColor: colors.borderLight }]}
                        onPress={() => handleQtyChange(size, 5)}
                      >
                        <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.addColorBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddColorGroup}
            >
              <MaterialIcon name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addColorBtnText}>Add Color Variant Group</Text>
            </TouchableOpacity>
          </View>

          {/* Configured Groups for Current Product */}
          {currentGroups.length > 0 && (
            <View style={[styles.configCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.cardHeader, { color: colors.onSurface }]}>
                Configured Groups for this Product ({currentGroups.length})
              </Text>
              {currentGroups.map((g, idx) => {
                const totalUnits = Object.values(g.sizeQtys).reduce((a, b) => a + b, 0);
                return (
                  <View key={idx} style={[styles.groupCard, { borderColor: colors.borderLight, backgroundColor: colors.scaffoldBackground }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.colorDot, { backgroundColor: g.color.color }]} />
                        <Text style={[styles.groupColorName, { color: colors.onSurface }]}>{g.color.label}</Text>
                        <Text style={styles.groupUnitsText}>• {totalUnits} units</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveGroup(idx)}>
                        <MaterialIcon name="close" size={16} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.groupSizesBreakdown}>
                      {Object.entries(g.sizeQtys)
                        .filter(([_, q]) => q > 0)
                        .map(([sz, q]) => `${sz}: ${q}`)
                        .join(' | ')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Next / Proceed Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.nextProductBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.nextProductBtnText}>
              {currentStepIndex < productList.length - 1 ? `Proceed to Next Product (${currentStepIndex + 2}/${productList.length})` : 'Review Order Summary'}
            </Text>
            <MaterialIcon name="arrow_forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBackBtn: { padding: 4, marginRight: 12 },
  headerTitleCol: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold' },
  headerSubtitle: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: 'rgba(28, 27, 31, 0.5)' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 18, fontFamily: 'Outfit_700Bold' },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  primaryBtnText: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 14 },
  stepContent: { padding: 16, paddingBottom: 60, maxWidth: 800, width: '100%', alignSelf: 'center' },
  summaryContent: { padding: 16, paddingBottom: 60, maxWidth: 800, width: '100%', alignSelf: 'center' },
  productBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerImg: { width: 72, height: 72, borderRadius: 8 },
  bannerBrand: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: 'rgba(28, 27, 31, 0.5)' },
  bannerName: { fontSize: 14, fontFamily: 'Outfit_700Bold', marginTop: 2 },
  bannerPrice: { fontSize: 13, fontFamily: 'Outfit_800ExtraBold', marginTop: 4 },
  configCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  cardHeader: { fontSize: 14, fontFamily: 'Outfit_700Bold', marginBottom: 12 },
  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorLabel: { fontSize: 12, fontFamily: 'Outfit_600SemiBold' },
  sizesList: { marginTop: 8 },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sizeLabel: { fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stepBtnText: { fontSize: 12, fontFamily: 'Outfit_700Bold' },
  qtyInput: {
    width: 44,
    height: 32,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    borderWidth: 1,
    borderRadius: 6,
    padding: 0,
  },
  addColorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  addColorBtnText: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 13 },
  groupCard: { padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  groupColorName: { fontSize: 13, fontFamily: 'Outfit_700Bold' },
  groupUnitsText: { fontSize: 12, color: 'rgba(28, 27, 31, 0.6)' },
  groupSizesBreakdown: { fontSize: 11, color: 'rgba(28, 27, 31, 0.5)', marginTop: 4 },
  nextProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  nextProductBtnText: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 14 },
  summaryCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  summaryThumb: { width: 56, height: 56, borderRadius: 8 },
  summaryProdTitle: { fontSize: 14, fontFamily: 'Outfit_700Bold' },
  summaryMeta: { fontSize: 12, color: 'rgba(28, 27, 31, 0.5)', marginTop: 2 },
  summarySubtotal: { fontSize: 13, fontFamily: 'Outfit_700Bold', marginTop: 4 },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  grandLabel: { fontSize: 11, color: 'rgba(28, 27, 31, 0.5)', fontFamily: 'PlusJakartaSans_500Medium' },
  grandVal: { fontSize: 15, fontFamily: 'Outfit_800ExtraBold', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 12 },
  saveDraftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveDraftText: { fontSize: 13, fontFamily: 'Outfit_700Bold' },
  confirmOrderBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  confirmOrderText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit_700Bold' },
});
