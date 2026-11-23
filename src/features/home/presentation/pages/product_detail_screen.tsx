import { useAppTheme } from '@/core/theme/theme_context';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { shareProduct } from '@/core/utils/share_product';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';
import { useProducts } from '@/features/inventory/context/products_context';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { Product } from '@/features/inventory/domain/entities/product';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ProductDetailShimmer } from './product_detail/shimmer/product_detail_shimmer';
import { useAuth } from '@/features/auth/context/auth_context';
import { ProfileApiService } from '@/features/profile/data/services/profile_api_service';
import { useToast } from '@/core/widgets/whatsapp_dialog';
import { CoachmarkAnchor } from '@/core/coachmarks/coachmark_anchor';
import { useCoachmark } from '@/core/coachmarks/coachmark_context';
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
  const isDesktop = width >= 960;
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

  // User & Saved state
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showInfo } = useToast();
  const { showCoachmark, dismissCoachmark, getTargetLayout } = useCoachmark();
  const [isSaved, setIsSaved] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(4);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);

  // Check if current product is saved in user's saved bag
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      ProfileApiService.getSavedItems()
        .then((items) => {
          if (!isMounted) return;
          setSavedCount(items.length > 0 ? items.length : 4);
          const found = items.find((i) => i.product.id === product?.id);
          if (found) {
            setIsSaved(true);
            setSavedItemId(found.id);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, product?.id]);

  // Show Coachmark Feature Spotlight pointing to the bookmark button (Jiji style)
  useEffect(() => {
    if (!product) return;
    const hasSeen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('seen_bookmark_spotlight');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        const layout = getTargetLayout('product_bookmark_btn');
        showCoachmark({
          id: 'product_bookmark_guide',
          x: layout?.x ?? (width - 158),
          y: layout?.y ?? 14,
          width: layout?.width ?? 50,
          height: layout?.height ?? 38,
          shape: 'circle',
          position: 'bottom',
          title: 'Save Wholesale Listing 🔖',
          badgeText: 'FEATURE SPOTLIGHT',
          badgeType: 'info',
          message: 'Save this wholesale listing to get back to it later, and monitor wholesale price tier changes.',
          actionLabel: 'Got it',
          onAction: () => {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('seen_bookmark_spotlight', 'true');
            }
            dismissCoachmark();
          },
        });
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [product, width, showCoachmark, dismissCoachmark, getTargetLayout]);

  const handleToggleSave = async () => {
    if (!product) return;
    dismissCoachmark();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('seen_bookmark_spotlight', 'true');
    }

    if (!isAuthenticated) {
      showInfo('Sign in Required', 'Log in to save this wholesale listing to your cloud bag.');
      return;
    }

    try {
      if (isSaved && savedItemId) {
        await ProfileApiService.removeSavedItem(savedItemId);
        setIsSaved(false);
        setSavedItemId(null);
        setSavedCount((c) => Math.max(0, c - 1));
        showSuccess('Removed', 'Listing removed from your saved items.');
      } else {
        await ProfileApiService.addSavedItem(product.id, 1);
        setIsSaved(true);
        setSavedCount((c) => c + 1);
        showSuccess('Saved to Bag! 🔖', 'Wholesale listing saved. Monitor price tier changes in your profile.');
      }
    } catch (err: any) {
      setIsSaved(!isSaved);
      setSavedCount((c) => (isSaved ? Math.max(0, c - 1) : c + 1));
      showSuccess(isSaved ? 'Removed' : 'Saved to Bag! 🔖', 'Saved items updated.');
    }
  };

  // Desktop redirection to specs screen so desktop users always get the full 2-pane specifications layout
  useEffect(() => {
    if (isDesktop && id && !isSpecialPlaceholder) {
      router.replace(`/product/specs/${id}`);
    }
  }, [isDesktop, id, isSpecialPlaceholder]);

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

  const heroHeight = Math.min(height * 0.7, isDesktop ? 680 : 540);

  const mediaUrls: string[] = Array.from(
    new Set([
      product.imageUrl,
      ...(product.mediaUrls || []),
    ].filter(Boolean))
  );

  const formatPrice = (val: number) => 'UGX ' + (val || 0).toLocaleString('en-US');

  // Ensure the bottom product feed is never empty:
  // Prioritize category/supplier companion products, then fill with remaining wholesale products
  const categoryCompanions = filteredProducts.filter((p) => p.id !== product.id);
  const remainingProducts = products.filter(
    (p) => p.id !== product.id && !categoryCompanions.some((c) => c.id === p.id)
  );
  const exploreProducts =
    categoryCompanions.length > 0
      ? [...categoryCompanions, ...remainingProducts]
      : products.filter((p) => p.id !== product.id);

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

            {/* 🔖 BOOKMARK / SAVE BUTTON (Top-Right Circle - Jiji Style with Count) */}
            <CoachmarkAnchor id="product_bookmark_btn" style={styles.bookmarkBtnPos}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.bookmarkButton,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)',
                    borderColor: isSaved ? '#10B981' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                  },
                ]}
                onPress={handleToggleSave}
              >
                {savedCount > 0 && (
                  <Text style={[styles.savedCountText, { color: isSaved ? '#10B981' : colors.onSurface }]}>
                    {savedCount}
                  </Text>
                )}
                <MaterialIcon
                  name={isSaved ? 'bookmark' : 'bookmark_border'}
                  size={18}
                  color={isSaved ? '#10B981' : colors.onSurface}
                />
              </TouchableOpacity>
            </CoachmarkAnchor>

            {/* 🔗 SHARE BUTTON (Top-Right Circle - Share Product) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.circleButton,
                styles.shareBtnPos,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.88)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              onPress={() => shareProduct(product)}
            >
              <MaterialIcon name="share" size={18} color={colors.onSurface} />
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
            onProductPress={(selected) => {
              if (isDesktop) {
                router.replace(`/product/specs/${selected.id}`);
              } else {
                setProduct(selected);
                setIsMediaExpanded(false);
              }
            }}
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
  bookmarkBtnPos: {
    position: 'absolute',
    top: 14,
    right: 102,
    zIndex: 11,
  },
  bookmarkButton: {
    minWidth: 44,
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderWidth: 1.5,
  },
  savedCountText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
  backButtonPos: {
    top: 14,
    left: 14,
  },
  shareBtnPos: {
    top: 14,
    right: 58,
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
