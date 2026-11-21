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
  DEFAULT_COLOR_VARIANTS,
  DEFAULT_SIZES,
} from './order_models';

export default function SpecsOrderPage() {
  const router = useAppNavigation();
  const { showSuccess, showError } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 960;
  const { getProductById } = useProducts();

  const initialProduct = id ? getProductById(id) : undefined;
  const [product, setProduct] = useState<Product | undefined>(initialProduct);

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

  // Current builder selections
  const [selectedColor, setSelectedColor] = useState<ColorVariant>(availableColors[0]);
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
  const [currentQty, setCurrentQty] = useState<number>(product?.moq || 2);

  // Keep selectedColor and selectedSize in sync with dynamic product data
  useEffect(() => {
    if (availableColors.length > 0) {
      const stillValid = availableColors.some((c) => c.label === selectedColor?.label);
      if (!stillValid) {
        setSelectedColor(availableColors[0]);
      }
    }
  }, [availableColors]);

  useEffect(() => {
    if (availableSizes.length > 0) {
      const stillValid = availableSizes.includes(selectedSize);
      if (!stillValid) {
        setSelectedSize(availableSizes[0]);
      }
    }
  }, [availableSizes]);

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  // Add currently selected color & size to the confirmed list
  const handleAddGroup = () => {
    setConfirmedGroups((prev) => {
      const existingIdx = prev.findIndex((g) => g.color.label === selectedColor.label);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existingGroup = updated[existingIdx];
        const currentSizeQty = existingGroup.sizeQtys[selectedSize] || 0;
        updated[existingIdx] = {
          ...existingGroup,
          sizeQtys: {
            ...existingGroup.sizeQtys,
            [selectedSize]: currentSizeQty + currentQty,
          },
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            color: selectedColor,
            sizeQtys: { [selectedSize]: currentQty },
          },
        ];
      }
    });
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

  const handleConfirmOrder = async () => {
    if (confirmedGroups.length === 0 || !product || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let profile: { legalBusinessName?: string; fullName?: string; phone?: string; warehouseAddress?: string } = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {
          legalBusinessName: 'Wholesale Buyer',
          phone: '',
          warehouseAddress: 'Kampala Logistics Hub',
        };
      }

      const orderId =
        'ORD-' +
        Date.now().toString(36).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();

      const orderPayload = {
        order_id: orderId,
        supplier_id: product.supplierId || undefined,
        business_name: profile.legalBusinessName || profile.fullName || 'Wholesale Buyer',
        business_phone: profile.phone || '0700000000',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || 'Kampala Logistics Hub',
        total_amount: subtotal,
        entries_json: confirmedGroups.map((g) => ({
          name: product.name,
          product_id: product.id,
          color: g.color.label,
          size_quantities: g.sizeQtys,
          unit_price: product.srp,
          total_units: Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
        })),
      };

      await ProfileApiService.createOrder(orderPayload);
      showSuccess('Order Created', `Order for ${product.name} placed successfully!`);
      setTimeout(() => {
        router.push('/profile');
      }, 1200);
    } catch (err: any) {
      showError('Order Failed', err?.message || 'Could not place wholesale order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (confirmedGroups.length === 0 || !product || isSavingDraft) return;
    setIsSavingDraft(true);
    try {
      let profile: { legalBusinessName?: string; fullName?: string; phone?: string; warehouseAddress?: string } = {};
      try {
        profile = await ProfileApiService.getProfile();
      } catch {
        profile = {
          legalBusinessName: 'Wholesale Buyer',
          phone: '',
          warehouseAddress: 'Kampala Logistics Hub',
        };
      }

      const draftId =
        'DRAFT-' +
        Date.now().toString(36).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();

      const draftPayload = {
        order_id: draftId,
        supplier_id: product.supplierId || 'supplier-main',
        business_name: profile.legalBusinessName || profile.fullName || 'Wholesale Buyer',
        business_phone: profile.phone || '0700000000',
        business_city: 'Kampala',
        business_address: profile.warehouseAddress || 'Kampala Logistics Hub',
        total_amount: subtotal,
        status: 'draft',
        entries_json: confirmedGroups.map((g) => ({
          name: product.name,
          product_id: product.id,
          color: g.color.label,
          size_quantities: g.sizeQtys,
          unit_price: product.srp,
          total_units: Object.values(g.sizeQtys).reduce((s, q) => s + q, 0),
        })),
      };

      await ProfileApiService.saveDraftOrder(draftPayload);
      showSuccess('Draft Saved', `Draft order for ${product.name} saved to your drafts.`);
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
        <View style={[styles.container, { backgroundColor: colors.scaffoldBackground, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.onSurface, fontSize: 16 }}>Product not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardColor, marginTop: 16 }]}
            onPress={() => router.safeGoBack()}
          >
            <Text style={{ color: colors.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardColor }]}
            onPress={() => router.safeGoBack()}
            activeOpacity={0.7}
          >
            <MaterialIcon name="close" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Configure Wholesale Order</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceMuted }]}>{product.name}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollLayout,
          ]}
        >
          {/* ── Left Column: Variant Selection Controls ── */}
          <View style={[styles.builderCard, isDesktop && styles.desktopBuilderCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={[styles.productBanner, { borderBottomColor: colors.borderLight }]}>
              <Image source={{ uri: product.imageUrl }} style={styles.productThumb} />
              <View style={styles.productInfo}>
                <Text style={[styles.brandTag, { color: colors.primary }]}>{product.brand}</Text>
                <Text style={[styles.productName, { color: colors.onSurface }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.unitPriceText, { color: colors.primary }]}>
                  {formatPrice(product.srp)} <Text style={[styles.perUnit, { color: colors.onSurfaceMuted }]}>/ unit</Text>
                </Text>
              </View>
            </View>

            {/* 1. SELECT COLOR */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>1. SELECT COLOR</Text>
                <Text style={[styles.sectionCountBadge, { color: colors.primary }]}>
                  {availableColors.length} Option{availableColors.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.colorVariantsGrid}>
                {availableColors.map((variant) => {
                  const isSelected = selectedColor?.label === variant.label;
                  const isLight = variant.color.toUpperCase() === '#FFFFFF' || variant.color.toUpperCase() === '#F0F0F2';
                  return (
                    <TouchableOpacity
                      key={variant.label}
                      activeOpacity={0.8}
                      style={[
                        styles.colorChip,
                        { backgroundColor: colors.cardColor, borderColor: isSelected ? colors.primary : colors.borderLight },
                        isSelected && styles.colorChipSelected,
                      ]}
                      onPress={() => setSelectedColor(variant)}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          {
                            backgroundColor: variant.color,
                            borderColor: isLight ? colors.borderLight : 'transparent',
                            borderWidth: isLight ? 1 : 0,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.colorLabel,
                          { color: isSelected ? colors.primary : colors.onSurface },
                          isSelected && styles.colorLabelSelected,
                        ]}
                      >
                        {variant.label}
                      </Text>
                      {isSelected && (
                        <MaterialIcon name="check" size={14} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. SELECT SIZE / PACK */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>2. SELECT SIZE / CARTON</Text>
                <Text style={[styles.sectionCountBadge, { color: colors.primary }]}>
                  {availableSizes.length} Option{availableSizes.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.sizesRow}>
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      activeOpacity={0.8}
                      style={[
                        styles.sizeChip,
                        { backgroundColor: isSelected ? colors.primary : colors.cardColor, borderColor: isSelected ? colors.primary : colors.borderLight },
                        isSelected && styles.sizeChipSelected,
                      ]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          { color: isSelected ? '#FFFFFF' : colors.onSurface },
                          isSelected && styles.sizeTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. QUANTITY STEPPER */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>3. QUANTITY (UNITS)</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}
                  onPress={() => setCurrentQty((q) => (q > 1 ? q - 1 : 1))}
                >
                  <MaterialIcon name="remove" size={18} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={[styles.stepperNumber, { color: colors.onSurface }]}>{currentQty}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}
                  onPress={() => setCurrentQty((q) => q + 1)}
                >
                  <MaterialIcon name="add" size={18} color={colors.onSurface} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.addBatchBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddGroup}
                >
                  <MaterialIcon name="add_shopping_cart" size={16} color="#FFFFFF" />
                  <Text style={styles.addBatchText}>Add to Order Breakdown</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Right Column: Order Breakdown & Summary ── */}
          <View style={[styles.summaryCard, isDesktop && styles.desktopSummaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.summaryTitle, { color: colors.onSurfaceMuted }]}>ORDER BREAKDOWN ({totalUnits} UNITS)</Text>

            {confirmedGroups.length === 0 ? (
              <View style={styles.emptyBreakdown}>
                <MaterialIcon name="playlist_add" size={42} color={colors.onSurfaceMuted} />
                <Text style={[styles.emptyText, { color: colors.onSurface }]}>No color & size combinations added yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.onSurfaceMuted }]}>
                  Select your variants on the left and click "Add to Order Breakdown"
                </Text>
              </View>
            ) : (
              <View style={styles.groupsList}>
                {confirmedGroups.map((group) => (
                  <View key={group.color.label} style={[styles.groupCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
                    <View style={styles.groupHeader}>
                      <View
                        style={[
                          styles.colorCircleSmall,
                          { backgroundColor: group.color.color },
                        ]}
                      />
                      <Text style={[styles.groupColorName, { color: colors.onSurface }]}>{group.color.label}</Text>
                    </View>

                    <View style={styles.sizesBreakdown}>
                      {Object.entries(group.sizeQtys).map(([size, qty]) => (
                        <View key={size} style={[styles.sizeQtyPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                          <Text style={[styles.sizePillName, { color: colors.onSurfaceMuted }]}>{size}:</Text>
                          <Text style={[styles.sizePillQty, { color: colors.onSurface }]}>{qty} units</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveSize(group.color.label, size)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialIcon name="close" size={14} color={colors.onSurfaceMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}

                {/* Subtotal & Actions */}
                <View style={[styles.calculationSection, { borderTopColor: colors.borderLight }]}>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: colors.onSurfaceMuted }]}>Total Quantity</Text>
                    <Text style={[styles.calcValue, { color: colors.onSurface }]}>{totalUnits} Units</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: colors.onSurfaceMuted }]}>Wholesale Subtotal</Text>
                    <Text style={[styles.calcTotalValue, { color: colors.primary }]}>{formatPrice(subtotal)}</Text>
                  </View>
                </View>

                {/* Actions: Save Draft & Confirm Order */}
                <View style={styles.orderActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.saveDraftBtn,
                      { borderColor: colors.borderLight, backgroundColor: colors.cardColor },
                      isSavingDraft && { opacity: 0.6 },
                    ]}
                    disabled={isSavingDraft || isSubmitting}
                    onPress={handleSaveDraft}
                  >
                    <MaterialIcon name={isSavingDraft ? 'hourglass_empty' : 'edit_note'} size={18} color={colors.primary} />
                    <Text style={[styles.saveDraftText, { color: colors.onSurface }]}>
                      {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      styles.confirmOrderBtn,
                      { backgroundColor: colors.primary, flex: 2 },
                      isSubmitting && { opacity: 0.6 },
                    ]}
                    disabled={isSubmitting || isSavingDraft}
                    onPress={handleConfirmOrder}
                  >
                    <MaterialIcon name={isSubmitting ? 'hourglass_empty' : 'check_circle'} size={18} color="#FFFFFF" />
                    <Text style={styles.confirmOrderText}>
                      {isSubmitting ? 'Submitting Order...' : 'Confirm & Place Order'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  desktopScrollLayout: {
    flexDirection: 'row',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  builderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.12)',
  },
  desktopBuilderCard: {
    flex: 6,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.08)',
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  productInfo: {
    flex: 1,
  },
  brandTag: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginTop: 2,
  },
  unitPriceText: {
    fontSize: 15,
    fontFamily: 'Outfit_900Black',
    color: AppColors.primary,
    marginTop: 2,
  },
  perUnit: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionCountBadge: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.55)',
    letterSpacing: 0.5,
  },
  colorVariantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.15)',
    backgroundColor: '#FFFFFF',
  },
  colorChipSelected: {
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(18, 187, 240, 0.06)',
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  colorLabelSelected: {
    color: AppColors.primary,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.15)',
    backgroundColor: '#FFFFFF',
  },
  sizeChipSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  sizeText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  sizeTextSelected: {
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.12)',
  },
  stepperNumber: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
    minWidth: 28,
    textAlign: 'center',
  },
  addBatchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 9,
    borderRadius: 4,
    marginLeft: 6,
  },
  addBatchText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  summaryCard: {
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
  },
  desktopSummaryCard: {
    flex: 5,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  emptyBreakdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  emptySubtext: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    maxWidth: 240,
  },
  groupsList: {
    gap: 10,
  },
  groupCard: {
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.08)',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  colorCircleSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupColorName: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
  sizesBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sizeQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  sizePillName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.6)',
  },
  sizePillQty: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  calculationSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 27, 31, 0.08)',
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.55)',
  },
  calcValue: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  calcTotalValue: {
    fontSize: 18,
    fontFamily: 'Outfit_900Black',
    color: AppColors.primary,
  },
  orderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  saveDraftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  saveDraftText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    borderRadius: 4,
  },
  confirmOrderText: {
    fontSize: 13.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
  },
});
