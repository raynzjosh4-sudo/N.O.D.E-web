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
  const { products, getProductById } = useProducts();

  const product: Product | undefined = (id ? getProductById(id) : undefined) || products[0];

  const [isMediaExpanded, setIsMediaExpanded] = useState(false);

  // Height matching Flutter's MediaQuery.of(context).size.height * 0.7
  const isDesktop = width >= 960;
  const heroHeight = isDesktop ? Math.min(height * 0.65, 560) : Math.min(height * 0.68, 500);

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.onSurface }]}>Product not found.</Text>
          <TouchableOpacity
            style={[styles.backHomeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backHomeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mediaUrls: string[] = Array.from(
    new Set([
      product.imageUrl,
      ...(product.mediaUrls || []),
    ].filter(Boolean))
  );

  const formatPrice = (val: number) => 'UGX ' + val.toLocaleString('en-US');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopContainer,
          ]}
        >
          {/* ══════════════════════════════════════════════════════════
              1. 👑 IMMERSIVE CURVED HERO HEADER (Matching Flutter)
             ══════════════════════════════════════════════════════════ */}
          <View style={[styles.heroWrapper, { height: heroHeight }]}>
            <View style={styles.heroClipCard}>
              <Image
                source={{ uri: product.imageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />

              {/* Top subtle dark gradient overlay for button visibility */}
              <View style={styles.topVignette} />

              {/* 🔙 BACK BUTTON (Top-Left Circle) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.circleButton,
                  styles.backButtonPos,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  },
                ]}
                onPress={() => router.safeGoBack()}
              >
                <MaterialIcon name="arrow_back_ios_new" size={16} color={colors.onSurface} />
              </TouchableOpacity>

              {/* ❌ CLOSE BUTTON (Top-Right Circle - to Home) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.circleButton,
                  styles.closeButtonPos,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  },
                ]}
                onPress={() => router.push('/')}
              >
                <MaterialIcon name="close" size={18} color={colors.onSurface} />
              </TouchableOpacity>

              {/* ── PRICE BADGE (Bottom-Left) ── */}
              <View
                style={[
                  styles.priceBadge,
                  {
                    backgroundColor: isDark ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.92)',
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  },
                ]}
              >
                <Text style={[styles.priceBadgeText, { color: colors.onSurface }]}>
                  {formatPrice(product.srp)}
                </Text>
              </View>

              {/* ── VIEW SPECS BUTTON (Bottom-Right CTA) ── */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.specsButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/product/specs/${product.id}`)}
              >
                <MaterialIcon name="settings_suggest" size={16} color="#FFFFFF" />
                <Text style={styles.specsButtonText}>View Specs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════
              2. 🏷️ PRODUCT MEDIA SECTION (Matching Flutter)
             ══════════════════════════════════════════════════════════ */}
          {mediaUrls.length > 0 && (
            <View style={styles.mediaSection}>
              {/* Header with expand/collapse arrow */}
              <View style={styles.mediaHeaderRow}>
                <Text style={[styles.mediaSectionTitle, { color: colors.onSurface }]}>
                  Product Media
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.expandArrowBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                  ]}
                  onPress={() => setIsMediaExpanded((prev) => !prev)}
                >
                  <MaterialIcon
                    name={isMediaExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    size={20}
                    color={colors.onSurface}
                  />
                </TouchableOpacity>
              </View>

              {/* Media Carousel / Grid */}
              {!isMediaExpanded ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalMediaScroll}
                >
                  {mediaUrls.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      style={styles.mediaCardWrapper}
                      onPress={() => router.push(`/product/specs/${product.id}`)}
                    >
                      <Image source={{ uri: url }} style={styles.mediaCardImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.mediaExpandedGrid}>
                  {mediaUrls.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      style={styles.mediaGridItem}
                      onPress={() => router.push(`/product/specs/${product.id}`)}
                    >
                      <Image source={{ uri: url }} style={styles.mediaGridImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════
              3. 🚀 MORE TO EXPLORE HEADER & MASONRY GRID
             ══════════════════════════════════════════════════════════ */}
          <View style={styles.exploreSection}>
            <Text style={[styles.exploreHeaderTitle, { color: colors.onSurface }]}>
              More to explore
            </Text>

            <ProductGridSection
              products={products.filter((p) => p.id !== product.id)}
              onProductPress={(p) => router.push(`/product/${p.id}`)}
            />
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
  },
  scrollContent: {
    paddingBottom: 48,
  },
  desktopContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },

  /* ── 1. Hero Header Styles ── */
  heroWrapper: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroClipCard: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  circleButton: {
    position: 'absolute',
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  backButtonPos: {
    left: 16,
  },
  closeButtonPos: {
    right: 16,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  priceBadgeText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.5,
  },
  specsButton: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  specsButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
  },

  /* ── 2. Product Media Section Styles ── */
  mediaSection: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  mediaSectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
  },
  expandArrowBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  horizontalMediaScroll: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 12,
  },
  mediaCardWrapper: {
    width: 130,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  mediaCardImage: {
    width: '100%',
    height: '100%',
  },
  mediaExpandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  mediaGridItem: {
    width: '48.5%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
  },

  /* ── 3. More to Explore Styles ── */
  exploreSection: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  exploreHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
});
