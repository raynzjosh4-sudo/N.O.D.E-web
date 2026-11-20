import { useAppTheme } from '@/core/theme/theme_context';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';
import { useProducts } from '@/features/inventory/context/products_context';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { Product } from '@/features/inventory/domain/entities/product';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ProductDetailShimmer } from './product_detail/shimmer/product_detail_shimmer';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function ProductDetailScreen() {
  const router = useAppNavigation();
  const { id, category, supplierId } = useLocalSearchParams<{
    id?: string;
    category?: string;
    supplierId?: string;
  }>();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { products, getProductById } = useProducts();

  const isSpecialPlaceholder = !id || id === 'supplier' || id === 'category' || id === 'explore';

  const [product, setProduct] = useState<Product | undefined>(() => {
    if (id && !isSpecialPlaceholder) return getProductById(id);
    return undefined;
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProduct(true);

    const loadData = async () => {
      try {
        if (supplierId) {
          // Case 1: Opened from supplier tap (Dart parity) — latest supplier product as Hero, rest below
          let listRes = await ProductApiService.getProducts({
            supplierId: supplierId,
            limit: 50,
          });

          let supplierProds = listRes.products || [];
          if (supplierProds.length === 0 && products.length > 0) {
            supplierProds = products.filter(
              (p) => p.supplierId === supplierId
            );
          }

          if (supplierProds.length > 0 && isMounted) {
            setProduct(supplierProds[0]);
            setFilteredProducts(supplierProds);
          }
        } else if (category) {
          // Case 2: Opened from category tap (Dart parity) — latest category product as Hero, rest below
          let listRes = await ProductApiService.getProducts({
            categoryId: category,
            limit: 50,
          });

          let catProds = listRes.products || [];
          if (catProds.length === 0 && products.length > 0) {
            catProds = products.filter(
              (p) =>
                p.categoryId === category ||
                (p.categoryId && p.categoryId.toLowerCase() === category.toLowerCase())
            );
          }

          if (catProds.length > 0 && isMounted) {
            setProduct(catProds[0]);
            setFilteredProducts(catProds);
          }
        } else if (id && !isSpecialPlaceholder) {
          // Case 3: Specific product ID provided
          const cached = getProductById(id);
          if (cached && isMounted) setProduct(cached);

          try {
            const fullProd = await ProductApiService.getProductById(id);
            if (fullProd && isMounted) {
              setProduct(fullProd);
              // Load companion products from same supplier or category
              const relRes = await ProductApiService.getProducts({
                supplierId: fullProd.supplierId,
                categoryId: fullProd.categoryId,
                limit: 20,
              });
              if (relRes.products && isMounted) {
                setFilteredProducts(relRes.products);
              }
            }
          } catch (e) {
            if (cached && isMounted) setProduct(cached);
          }
        } else if (products.length > 0 && isMounted) {
          setProduct(products[0]);
          setFilteredProducts(products);
        }
      } catch (err) {
        console.warn('[ProductDetailScreen] Data load error:', err);
      } finally {
        if (isMounted) setIsLoadingProduct(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, category, supplierId, isSpecialPlaceholder]);

  if (!product && isLoadingProduct) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <ProductDetailShimmer />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerContainer}>
          <MaterialIcon name="inventory_2" size={48} color={colors.onSurfaceMuted} />
          <Text style={[styles.errorText, { color: colors.onSurface, marginTop: 12 }]}>
            No products available
          </Text>
          <Text style={{ color: colors.onSurfaceMuted, fontSize: 13, marginBottom: 18, textAlign: 'center' }}>
            There are currently no products listed under this section.
          </Text>
          <TouchableOpacity
            style={[styles.backHomeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.safeGoBack('/')}
          >
            <Text style={styles.backHomeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isDesktop = width >= 960;
  const heroHeight = Math.min(height * 0.7, isDesktop ? 680 : 540);

  const mediaUrls: string[] = Array.from(
    new Set([
      product.imageUrl,
      ...(product.mediaUrls || []),
    ].filter(Boolean))
  );

  const formatPrice = (val: number) => 'UGX ' + (val || 0).toLocaleString('en-US');

  // Explore waterfall: prioritize products from current filter or global products
  const explorePool = filteredProducts.length > 0 ? filteredProducts : products;
  const exploreProducts = explorePool.filter((p) => p.id !== product.id);

  const navigateToSpecs = () => {
    router.push(`/product/specs/${product.id}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {/* 👑 IMMERSIVE CURVED HERO HEADER (Dart HeroHeaderDelegate matching) */}
        <View style={[styles.heroWrapper, { height: heroHeight, maxWidth: isDesktop ? 960 : '100%' }]}>
          <View style={styles.heroClipCard}>
            <Image
              source={{ uri: product.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />

            {/* Subtle top vignette gradient for button visibility */}
            <View style={styles.topVignette} />

            {/* 🔙 BACK BUTTON (Top-Left Circle) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.circleButton,
                styles.backButtonPos,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.88)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              onPress={() => router.safeGoBack()}
            >
              <MaterialIcon name="arrow_back_ios_new" size={16} color={colors.onSurface} />
            </TouchableOpacity>

            {/* ❌ CLOSE BUTTON (Top-Right Circle - Back to Home) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.circleButton,
                styles.closeButtonPos,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.88)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              onPress={() => router.push('/')}
            >
              <MaterialIcon name="close" size={18} color={colors.onSurface} />
            </TouchableOpacity>

            {/* 🏷️ FLOATING PRICE BADGE (Bottom-Left Pill) */}
            <View
              style={[
                styles.priceBadge,
                {
                  backgroundColor: isDark ? 'rgba(15,17,23,0.88)' : 'rgba(255,255,255,0.92)',
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text style={[styles.priceBadgeText, { color: colors.onSurface }]}>
                {formatPrice(product.srp)}
              </Text>
            </View>

            {/* ⚙️ FLOATING SPECIFICATION BUTTON (Bottom-Right Orange Pill) */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.viewSpecsButton, { backgroundColor: colors.primary }]}
              onPress={navigateToSpecs}
            >
              <Text style={styles.viewSpecsButtonText}>View Specs</Text>
              <MaterialIcon name="arrow_forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 📸 RICH MEDIA GALLERY SECTION */}
        {mediaUrls.length > 1 && (
          <View style={[styles.sectionContainer, isDesktop && styles.desktopContainer]}>
            <View style={styles.mediaHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Media</Text>
              <TouchableOpacity
                onPress={() => setIsMediaExpanded(!isMediaExpanded)}
                style={[styles.expandChevronBtn, { backgroundColor: colors.cardColor }]}
              >
                <MaterialIcon
                  name={isMediaExpanded ? 'expand_less' : 'expand_more'}
                  size={22}
                  color={colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            {!isMediaExpanded ? (
              /* Horizontal Media Strip */
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalMediaStrip}
              >
                {mediaUrls.map((uri, idx) => (
                  <TouchableOpacity
                    key={`media-thumb-${idx}`}
                    activeOpacity={0.85}
                    style={[styles.mediaThumbCard, { borderColor: colors.borderLight }]}
                    onPress={navigateToSpecs}
                  >
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              /* Expanded 2-Column Grid */
              <View style={styles.expandedMediaGrid}>
                {mediaUrls.map((uri, idx) => (
                  <TouchableOpacity
                    key={`media-exp-${idx}`}
                    activeOpacity={0.85}
                    style={[styles.expandedMediaCard, { borderColor: colors.borderLight }]}
                    onPress={navigateToSpecs}
                  >
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 🚀 MORE TO EXPLORE HEADER */}
        <View style={[styles.sectionContainer, styles.exploreHeaderRow, isDesktop && styles.desktopContainer]}>
          <Text style={[styles.exploreSectionTitle, { color: colors.onSurface }]}>More to explore</Text>
        </View>

        {/* 🧱 Masonry Waterfall Grid of other explore products */}
        <View style={[styles.exploreGridWrapper, isDesktop && styles.desktopContainer]}>
          <ProductGridSection
            products={exploreProducts}
            onProductPress={(selected) => router.push(`/product/${selected.id}`)}
          />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  heroWrapper: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroClipCard: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F1117',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  circleButton: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 10,
  },
  backButtonPos: {
    top: 14,
    left: 14,
  },
  closeButtonPos: {
    top: 14,
    right: 14,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  priceBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  viewSpecsButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  viewSpecsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionContainer: {
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  desktopContainer: {
    maxWidth: 960,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  expandChevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalMediaStrip: {
    paddingVertical: 4,
    gap: 10,
  },
  mediaThumbCard: {
    width: 130,
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E2028',
    borderWidth: 1,
  },
  expandedMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  expandedMediaCard: {
    width: '48.5%',
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E2028',
    borderWidth: 1,
  },
  exploreHeaderRow: {
    marginTop: 20,
    marginBottom: 4,
  },
  exploreSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  exploreGridWrapper: {
    width: '100%',
  },
});
