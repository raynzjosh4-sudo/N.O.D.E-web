import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { HomeHeader } from '@/features/home/presentation/widgets/home_header';
import { HomeSearchBar } from '@/features/home/presentation/widgets/home_search_bar';
import { PromoBanners } from '@/features/home/presentation/widgets/promo_banners';
import { QuickSelectionsList } from '@/features/home/presentation/widgets/quick_selections_list';
import { FeaturedCategoryCard } from '@/features/home/presentation/widgets/featured_category_card';
import { PopularSection } from '@/features/home/presentation/widgets/popularsection/popular_section';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';
import { ProductDetailSidePanel } from '@/features/home/presentation/widgets/product_detail_side_panel';
import { SearchHistoryView } from '@/features/home/presentation/widgets/search_history_view';
import { Product } from '@/features/inventory/domain/entities/product';
import { useProducts } from '@/features/inventory/context/products_context';
import { useAuth } from '@/features/auth/context/auth_context';
import { AuthPromptSheet } from '@/features/auth/presentation/widgets/auth_prompt_sheet';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { colors } = useAppTheme();
  const { products } = useProducts();

  // Search States
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Apple iPad Air',
    'Solar Inverter',
    'Commercial Blender',
    'Lenovo ThinkPad',
  ]);

  // Selected product for desktop Pinterest-style side panel
  const [activeSideProduct, setActiveSideProduct] = useState<Product | null>(null);

  // Authentication State
  const { user, isAuthenticated } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Handle Search Submission or Selection
  const handleExecuteSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Add to recent searches (deduplicated, newest first)
    setRecentSearches((prev) => [
      trimmed,
      ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 15));

    setSearchQuery(trimmed);
    setIsSearching(false);
  };

  const handleDeleteRecent = (queryToDelete: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== queryToDelete));
  };

  const handleClearAllRecents = () => {
    setRecentSearches([]);
  };

  const handleClearActiveSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  // Filter products by active search query
  const filteredProducts = searchQuery
    ? products.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.warehouseLoc?.toLowerCase().includes(q)
        );
      })
    : products;

  // Handle product click: on desktop open side panel; on mobile navigate full screen
  const handleProductTap = (product: Product) => {
    if (isDesktop) {
      setActiveSideProduct(product);
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        {/* Main Content Layout (Flex Row on Desktop when item is selected) */}
        <View style={styles.mainLayoutRow}>
          {/* ── Left / Center Waterfall Feed ── */}
          <View style={[styles.contentWrapper, activeSideProduct ? styles.contentWithPanel : null]}>
            {/* 1. Header */}
            <View style={styles.sectionHeader}>
              <HomeHeader
                displayName={user?.name ?? 'Guest'}
                isAuthenticated={isAuthenticated}
                profilePicUrl={user?.avatarUrl}
                hasUnreadNotifications={true}
                onProfilePress={() => {
                  if (isAuthenticated) {
                    router.push('/profile');
                  } else {
                    setShowAuthPrompt(true);
                  }
                }}
                onNotificationPress={() => router.push('/notifications')}
              />
            </View>

            {/* 2. Search Bar */}
            <View style={styles.sectionSearch}>
              <HomeSearchBar
                value={searchQuery}
                onSearchPress={() => setIsSearching(true)}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text) {
                    setIsSearching(true);
                  }
                }}
                onSubmitEditing={handleExecuteSearch}
                onFilterPress={() => router.push('/explore')}
                onCartPress={() => console.log('Cart pressed')}
              />
            </View>

            {/* ── 3. SEARCH MODE / RESULTS / NORMAL HOME FEED ── */}
            {isSearching ? (
              /* Search History & Trending Suggestions View */
              <SearchHistoryView
                recentSearches={recentSearches}
                onSelect={handleExecuteSearch}
                onDelete={handleDeleteRecent}
                onClearAll={handleClearAllRecents}
                onCancel={() => setIsSearching(false)}
              />
            ) : searchQuery.length > 0 ? (
              /* Active Search Results Feed */
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Back to Explore / Search Indicator Banner */}
                <View style={[styles.searchStatusHeader, { borderBottomColor: colors.borderLight }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.backToExplorePill}
                    onPress={handleClearActiveSearch}
                  >
                    <MaterialIcon
                      name="arrow_back"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.backToExploreText, { color: colors.primary }]}>Back to Explore</Text>
                  </TouchableOpacity>

                  <Text style={[styles.searchResultCount, { color: colors.onSurfaceMuted }]}>
                    {filteredProducts.length}{' '}
                    {filteredProducts.length === 1 ? 'item' : 'items'} found for "
                    <Text style={[styles.searchQueryHighlight, { color: colors.onSurface }]}>{searchQuery}</Text>"
                  </Text>
                </View>

                {/* Filtered Masonry Waterfall */}
                {filteredProducts.length > 0 ? (
                  <ProductGridSection
                    products={filteredProducts}
                    onProductPress={handleProductTap}
                  />
                ) : (
                  <View style={styles.noResultsBox}>
                    <MaterialIcon
                      name="search_off"
                      size={48}
                      color={colors.onSurfaceMuted}
                    />
                    <Text style={[styles.noResultsTitle, { color: colors.onSurface }]}>No Wholesale Items Found</Text>
                    <Text style={[styles.noResultsSubtitle, { color: colors.onSurfaceMuted }]}>
                      No verified supplier catalog matches "{searchQuery}". Try searching for brands, SKU, or broader keywords.
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.resetSearchButton, { backgroundColor: colors.primary }]}
                      onPress={handleClearActiveSearch}
                    >
                      <Text style={styles.resetSearchText}>Clear Search & Browse Feed</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : (
              /* Standard Full Home Feed */
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 3. Promo Banners */}
                <PromoBanners
                  onPromoPress={(id) => console.log('Promo tapped:', id)}
                  onPostProductPress={() => router.push('/supplier-products')}
                />

                {/* 4. Quick Selections List (Suppliers) */}
                <QuickSelectionsList
                  onSeeMorePress={() => router.push('/suppliers')}
                  onSupplierPress={(supplier) => router.push('/suppliers')}
                />

                {/* 5. Featured Category Cards Carousel */}
                <FeaturedCategoryCard
                  onCategoryPress={() => router.push('/explore')}
                  onExplorePress={() => router.push('/explore')}
                />

                {/* 6. Popular Mini-Cards */}
                <PopularSection
                  onProductPress={handleProductTap}
                  onCartPress={(p) => console.log('Add popular to cart:', p.name)}
                />

                {/* 7. Product Masonry Waterfall Grid */}
                <ProductGridSection
                  products={products}
                  onProductPress={handleProductTap}
                />
              </ScrollView>
            )}
          </View>

          {/* ── Right Pinterest-style Sticky Side Drawer (Desktop Only) ── */}
          {isDesktop && activeSideProduct && (
            <ProductDetailSidePanel
              product={activeSideProduct}
              onClose={() => setActiveSideProduct(null)}
              onViewSpecs={(p) => router.push(`/product/specs/${p.id}`)}
            />
          )}
        </View>
      </View>

      {/* Auth Prompt Modal Sheet */}
      <AuthPromptSheet
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surfaceWhite,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.surfaceWhite,
    width: '100%',
    alignItems: 'center',
  },
  mainLayoutRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1400,
    flex: 1,
  },
  contentWithPanel: {
    maxWidth: 1000,
  },
  sectionHeader: {
    width: '100%',
  },
  sectionSearch: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    marginBottom: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.06)',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  backToExplorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  backToExploreText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  searchResultCount: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.6)',
  },
  searchQueryHighlight: {
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  noResultsTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginTop: 14,
    marginBottom: 6,
  },
  noResultsSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.5)',
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 20,
    marginBottom: 20,
  },
  resetSearchButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetSearchText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.surfaceWhite,
  },
});
