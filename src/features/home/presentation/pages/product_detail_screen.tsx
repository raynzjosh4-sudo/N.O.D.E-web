import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useProducts } from '@/features/inventory/context/products_context';
import { Product } from '@/features/inventory/domain/entities/product';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';

export default function ProductDetailScreen() {
  const router = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const isDesktop = width >= 960;
  const { products, getProductById } = useProducts();

  const product: Product = getProductById(id as string) || products[0];

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);

  const heroHeight = Math.min(height * 0.52, 480);
  const mediaList = product.mediaUrls?.length ? product.mediaUrls : [product.imageUrl];
  const activeImage = mediaList[selectedMediaIdx] || product.imageUrl;

  const formatPrice = (val: number) => 'UGX ' + val.toLocaleString('en-US');

  // On desktop → redirect to full specs screen
  if (isDesktop) {
    router.replace(`/product/specs/${product.id}`);
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── 1. Hero Image ── */}
          <View style={[styles.heroCard, { height: heroHeight }]}>
            <Image
              source={{ uri: activeImage }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

            {/* Back button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.floatingBack, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)' }]}
              onPress={() => router.safeGoBack()}
            >
              <MaterialIcon name="arrow_back" size={18} color={colors.onSurface} />
            </TouchableOpacity>

            {/* Price badge */}
            <View style={[styles.priceBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)', borderColor: colors.borderLight }]}>
              <Text style={[styles.priceBadgeText, { color: colors.onSurface }]}>
                {formatPrice(product.srp)}
              </Text>
            </View>

            {/* View Specs CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.specsButton}
              onPress={() => router.push(`/product/specs/${product.id}`)}
            >
              <MaterialIcon name="settings_suggest" size={14} color="#FFFFFF" />
              <Text style={styles.specsButtonText}>Full Specs</Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. Media Thumbnails Row ── */}
          {mediaList.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsRow}
            >
              {mediaList.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMediaIdx(idx)}
                  style={[
                    styles.thumbWrapper,
                    {
                      borderColor: idx === selectedMediaIdx ? colors.primary : colors.borderLight,
                      borderWidth: idx === selectedMediaIdx ? 2 : 1,
                    },
                  ]}
                >
                  <Image source={{ uri: url }} style={styles.thumbImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.bodyPad}>
            {/* ── 3. Identity ── */}
            <Text style={[styles.brandLabel, { color: colors.primary }]}>
              {product.brand} • {product.warehouseLoc}
            </Text>
            <Text style={[styles.productTitle, { color: colors.onSurface }]} numberOfLines={3}>
              {product.name}
            </Text>
            {product.description ? (
              <Text style={[styles.descriptionText, { color: colors.onSurfaceMuted }]}>
                {product.description}
              </Text>
            ) : null}

            {/* ── 4. Colors ── */}
            {product.colors && product.colors.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>AVAILABLE COLORS</Text>
                <View style={styles.colorsRow}>
                  {product.colors.map((c, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setSelectedColorIdx(idx)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.hexCode },
                        idx === selectedColorIdx && styles.colorSwatchSelected,
                        c.hexCode === '#FFFFFF' || c.hexCode === '#F0F0F2' || c.hexCode === '#E5E5EA'
                          ? { borderColor: colors.borderLight }
                          : { borderColor: 'transparent' },
                      ]}
                    >
                      {idx === selectedColorIdx && (
                        <MaterialIcon
                          name="check"
                          size={12}
                          color={
                            c.hexCode === '#FFFFFF' || c.hexCode === '#F0F0F2'
                              ? '#000'
                              : '#FFF'
                          }
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                {product.colors[selectedColorIdx] && (
                  <Text style={[styles.colorNameLabel, { color: colors.onSurface }]}>
                    {product.colors[selectedColorIdx].name}
                  </Text>
                )}
              </View>
            )}

            {/* ── 5. Sizes ── */}
            {product.sizes && product.sizes.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>AVAILABLE SIZES</Text>
                <View style={styles.sizesRow}>
                  {product.sizes.map((s, idx) => {
                    const isSelected = idx === selectedSizeIdx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => setSelectedSizeIdx(idx)}
                        style={[
                          styles.sizeChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.borderLight,
                          },
                        ]}
                      >
                        <Text style={[styles.sizeChipText, { color: isSelected ? '#FFF' : colors.onSurface }]}>
                          {s.abbreviation}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {product.sizes[selectedSizeIdx] && (
                  <Text style={[styles.sizeNameLabel, { color: colors.onSurfaceMuted }]}>
                    {product.sizes[selectedSizeIdx].name}
                  </Text>
                )}
              </View>
            )}

            {/* ── 6. Wholesale Pricing Tiers ── */}
            {product.priceTiers && product.priceTiers.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>WHOLESALE TIERS</Text>
                <View style={styles.tiersGrid}>
                  {product.priceTiers.map((tier, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tierItem,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                        idx === 0 && { borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.tierQty, { color: colors.primary }]}>
                        {tier.minQuantity}+ units
                      </Text>
                      <Text style={[styles.tierPrice, { color: colors.onSurface }]}>
                        {formatPrice(tier.price)}
                      </Text>
                      {idx === 0 && (
                        <Text style={[styles.tierBestLabel, { color: colors.primary }]}>Best Price</Text>
                      )}
                    </View>
                  ))}
                </View>
                {product.moq && (
                  <View style={styles.moqRow}>
                    <MaterialIcon name="inventory" size={14} color={colors.onSurfaceMuted} />
                    <Text style={[styles.moqText, { color: colors.onSurfaceMuted }]}>
                      Minimum Order Quantity: <Text style={{ color: colors.onSurface, fontFamily: 'Outfit_700Bold' }}>{product.moq} units</Text>
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ── 7. Product Attributes (Material, Packaging, Weight) ── */}
            {(product.material || product.packaging || product.weight || product.warranty || product.compliance) && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>PRODUCT DETAILS</Text>
                {[
                  product.material && { icon: 'texture', label: 'Material', value: product.material },
                  product.packaging && { icon: 'package_2', label: 'Packaging', value: product.packaging },
                  product.weight && { icon: 'scale', label: 'Weight', value: product.weight },
                  product.warranty && { icon: 'verified_user', label: 'Warranty', value: product.warranty },
                  product.compliance && { icon: 'fact_check', label: 'Compliance', value: product.compliance },
                ]
                  .filter(Boolean)
                  .map((item: any, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.attrRow,
                        idx < 4 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                      ]}
                    >
                      <View style={[styles.attrIconWrap, { backgroundColor: colors.surface }]}>
                        <MaterialIcon name={item.icon} size={16} color={colors.primary} />
                      </View>
                      <View style={styles.attrContent}>
                        <Text style={[styles.attrLabel, { color: colors.onSurfaceMuted }]}>{item.label}</Text>
                        <Text style={[styles.attrValue, { color: colors.onSurface }]}>{item.value}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* ── 8. Support Contact ── */}
            {(product.supportPhone || product.supportWhatsapp) && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>SUPPLIER SUPPORT</Text>
                <Text style={[styles.supportSubtitle, { color: colors.onSurfaceMuted }]}>
                  Contact your verified wholesaler directly for bulk orders
                </Text>
                <View style={styles.supportButtons}>
                  {product.supportPhone && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.supportBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() => Linking.openURL(`tel:${product.supportPhone}`)}
                    >
                      <View style={[styles.supportBtnIcon, { backgroundColor: 'rgba(18, 187, 240, 0.1)' }]}>
                        <MaterialIcon name="call" size={18} color={colors.primary} />
                      </View>
                      <View style={styles.supportBtnText}>
                        <Text style={[styles.supportBtnLabel, { color: colors.onSurfaceMuted }]}>Call Supplier</Text>
                        <Text style={[styles.supportBtnValue, { color: colors.onSurface }]}>{product.supportPhone}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {product.supportWhatsapp && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.supportBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${product.supportWhatsapp?.replace(/[^0-9]/g, '')}?text=Hi, I found your product on N.O.D.E - ${product.name}`
                        )
                      }
                    >
                      <View style={[styles.supportBtnIcon, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]}>
                        <MaterialIcon name="chat" size={18} color="#25D366" />
                      </View>
                      <View style={styles.supportBtnText}>
                        <Text style={[styles.supportBtnLabel, { color: colors.onSurfaceMuted }]}>WhatsApp</Text>
                        <Text style={[styles.supportBtnValue, { color: colors.onSurface }]}>{product.supportWhatsapp}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ── 9. Order CTA Strip ── */}
            <View style={[styles.ctaStrip, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
              <View style={styles.ctaLeft}>
                <Text style={[styles.ctaLabel, { color: colors.onSurfaceMuted }]}>Starting at</Text>
                <Text style={[styles.ctaPrice, { color: colors.onSurface }]}>
                  {formatPrice(product.priceTiers?.[0]?.price || product.srp)}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/product/specs/${product.id}`)}
              >
                <MaterialIcon name="shopping_cart" size={16} color="#FFF" />
                <Text style={styles.ctaButtonText}>Place Wholesale Order</Text>
              </TouchableOpacity>
            </View>

            {/* ── 10. More to Explore ── */}
            <View style={styles.exploreSection}>
              <Text style={[styles.exploreTitle, { color: colors.onSurface }]}>More to Explore</Text>
              <ProductGridSection
                products={products.filter((p) => p.id !== product.id).slice(0, 6)}
                onProductPress={(p) => router.push(`/product/${p.id}`)}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Hero
  heroCard: {
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  floatingBack: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  priceBadgeText: {
    fontSize: 14,
    fontFamily: 'Outfit_900Black',
  },
  specsButton: {
    position: 'absolute',
    bottom: 18,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  specsButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
  },

  // Thumbnails
  thumbsRow: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbWrapper: {
    width: 60,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },

  // Body
  bodyPad: {
    paddingHorizontal: 16,
  },
  brandLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  productTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 4,
    lineHeight: 29,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 4,
  },

  // Section cards
  sectionCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Colors
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  colorSwatchSelected: {
    borderColor: AppColors.primary,
    shadowOpacity: 0.3,
    shadowColor: AppColors.primary,
  },
  colorNameLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 10,
  },

  // Sizes
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeChipText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  sizeNameLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 8,
  },

  // Pricing Tiers
  tiersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierItem: {
    flex: 1,
    minWidth: 90,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  tierQty: {
    fontSize: 9,
    fontFamily: 'Outfit_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tierPrice: {
    fontSize: 13,
    fontFamily: 'Outfit_900Black',
    marginTop: 4,
  },
  tierBestLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 4,
  },
  moqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  moqText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  // Attributes
  attrRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  attrIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  attrContent: {
    flex: 1,
  },
  attrLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  attrValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 1,
    lineHeight: 18,
  },

  // Support
  supportSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginBottom: 12,
    lineHeight: 17,
  },
  supportButtons: {
    gap: 10,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  supportBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  supportBtnText: {
    flex: 1,
  },
  supportBtnLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  supportBtnValue: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    marginTop: 1,
  },

  // CTA strip
  ctaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  ctaLeft: {
    gap: 2,
  },
  ctaLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ctaPrice: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
  },

  // More to explore
  exploreSection: {
    marginTop: 24,
  },
  exploreTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 10,
  },
});
