import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { MOCK_PRODUCTS, Product } from '@/features/inventory/domain/entities/product';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';

export default function ProductDetailScreen() {
  const router = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 960;

  // On desktop, this mobile detail screen should not be shown —
  // redirect immediately to the full specs page.
  useEffect(() => {
    if (isDesktop && id) {
      router.replace(`/product/specs/${id}`);
    }
  }, [isDesktop, id]);

  const product: Product =
    MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];

  const [isMediaExpanded, setIsMediaExpanded] = useState(false);

  const heroHeight = Math.min(height * 0.62, 540);
  const mediaList = product.mediaUrls || [product.imageUrl];

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  // Show nothing while redirecting on desktop
  if (isDesktop) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.maxWidthWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. HERO EXPANDABLE IMAGE HEADER */}
            <View style={[styles.heroCardContainer, { height: heroHeight }]}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              <View style={styles.heroGradient} />

              {/* Floating Back Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.floatingBackButton, { backgroundColor: colors.cardColor }]}
                onPress={() => router.safeGoBack()}
              >
                <MaterialIcon
                  name="arrow_back"
                  size={18}
                  color={colors.onSurface}
                />
              </TouchableOpacity>

              {/* Price Badge */}
              <View style={[styles.priceBadge, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.priceBadgeText, { color: colors.onSurface }]}>
                  {formatPrice(product.srp)}
                </Text>
              </View>

              {/* View Specs Button -> Navigates to Full Product Specs Screen */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.viewSpecsButton}
                onPress={() => router.push(`/product/specs/${product.id}`)}
              >
                <MaterialIcon
                  name="settings_suggest"
                  size={16}
                  color={AppColors.surfaceWhite}
                />
                <Text style={styles.viewSpecsText}>View Specs</Text>
              </TouchableOpacity>
            </View>

            {/* 2. PRODUCT INFO & DETAILS */}
            <View style={styles.infoSection}>
              <Text style={[styles.brandSubtitle, { color: colors.primary }]}>
                {product.brand} • {product.warehouseLoc}
              </Text>
              <Text style={[styles.productTitle, { color: colors.onSurface }]}>{product.name}</Text>

              {/* Wholesale Pricing Tiers */}
              <View style={[styles.tiersContainer, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <Text style={[styles.tiersHeader, { color: colors.onSurfaceMuted }]}>WHOLESALE TIERS</Text>
                <View style={styles.tiersRow}>
                  {product.priceTiers.map((tier, idx) => (
                    <View key={idx} style={[styles.tierChip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[styles.tierQty, { color: colors.primary }]}>
                        {tier.minQuantity}+ units
                      </Text>
                      <Text style={[styles.tierPrice, { color: colors.onSurface }]}>
                        {formatPrice(tier.price)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 3. PRODUCT MEDIA SECTION */}
            <View style={styles.mediaSection}>
              <View style={styles.mediaHeaderRow}>
                <Text style={[styles.mediaTitle, { color: colors.onSurface }]}>Product Media</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.mediaToggle, { backgroundColor: colors.cardColor }]}
                  onPress={() => setIsMediaExpanded(!isMediaExpanded)}
                >
                  <MaterialIcon
                    name={isMediaExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    size={20}
                    color={colors.onSurface}
                  />
                </TouchableOpacity>
              </View>

              {/* Horizontal Media Gallery */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaScroll}
              >
                {mediaList.map((url, idx) => (
                  <View key={idx} style={styles.mediaThumbnailWrapper}>
                    <Image
                      source={{ uri: url }}
                      style={styles.mediaThumbnail}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 4. MORE TO EXPLORE */}
            <View style={styles.exploreSection}>
              <Text style={[styles.exploreTitle, { color: colors.onSurface }]}>More to explore</Text>
              <ProductGridSection
                products={MOCK_PRODUCTS.filter((p) => p.id !== product.id)}
                onProductPress={(p) => router.push(`/product/${p.id}`)}
              />
            </View>
          </ScrollView>
        </View>
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
  maxWidthWrapper: {
    width: '100%',
    maxWidth: 800,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCardContainer: {
    margin: 8,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  floatingBackButton: {
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
    bottom: 20,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    color: AppColors.onSurface,
  },
  viewSpecsButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  viewSpecsText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.surfaceWhite,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  brandSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    marginTop: 4,
    lineHeight: 28,
  },
  tiersContainer: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  tiersHeader: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  tiersRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  tierQty: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: AppColors.primary,
  },
  tierPrice: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    marginTop: 2,
  },
  mediaSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediaTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  mediaToggle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(28, 27, 31, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  mediaThumbnailWrapper: {
    width: 130,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  exploreSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  exploreTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    marginBottom: 10,
  },
});
