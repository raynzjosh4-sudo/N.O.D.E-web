import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { useAppTheme } from '@/core/theme/theme_context';
import { AppColors } from '@/core/theme/app_theme';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { HomeSearchBar } from '@/features/home/presentation/widgets/home_search_bar';
import { SearchHistoryView } from '@/features/home/presentation/widgets/search_history_view';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';
import { ProductDetailSidePanel } from '@/features/home/presentation/widgets/product_detail_side_panel';
import { Product } from '@/features/inventory/domain/entities/product';
import { useProducts } from '@/features/inventory/context/products_context';

export default function SearchPage() {
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { colors } = useAppTheme();
  const { products } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Apple iPad Air',
    'Solar Inverter',
    'Commercial Blender',
    'Lenovo ThinkPad',
    'Wholesale Rice',
  ]);

  const [activeSideProduct, setActiveSideProduct] = useState<Product | null>(null);

  const handleExecuteSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => [
      trimmed,
      ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 15));

    setSearchQuery(trimmed);
    setIsHistoryVisible(false);
  };

  const filteredProducts = searchQuery
    ? products.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.warehouseLoc?.toLowerCase().includes(q)
        );
      })
    : [];

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
        <View style={styles.mainLayoutRow}>
          <View
            style={[
              styles.contentWrapper,
              activeSideProduct ? styles.contentWithPanel : null,
            ]}
          >
            {/* Top Bar with Back Button */}
            <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.backButton}
                onPress={() => router.safeGoBack('/')}
              >
                <MaterialIcon
                  name="arrow_back"
                  size={20}
                  color={colors.onSurface}
                />
              </TouchableOpacity>
              <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>Search Catalog</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarWrapper}>
              <HomeSearchBar
                value={searchQuery}
                onSearchPress={() => setIsHistoryVisible(true)}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text) {
                    setIsHistoryVisible(true);
                  }
                }}
                onSubmitEditing={handleExecuteSearch}
                onFilterPress={() => router.push('/explore')}
              />
            </View>

            {/* Body */}
            {isHistoryVisible || !searchQuery ? (
              <SearchHistoryView
                recentSearches={recentSearches}
                onSelect={handleExecuteSearch}
                onDelete={(q) =>
                  setRecentSearches((prev) => prev.filter((item) => item !== q))
                }
                onClearAll={() => setRecentSearches([])}
                onCancel={() => router.safeGoBack('/')}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={[styles.resultsHeader, { borderBottomColor: colors.borderLight }]}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={styles.clearSearchChip}
                    onPress={() => {
                      setSearchQuery('');
                      setIsHistoryVisible(true);
                    }}
                  >
                    <MaterialIcon
                      name="arrow_back"
                      size={15}
                      color={colors.primary}
                    />
                    <Text style={[styles.clearSearchText, { color: colors.primary }]}>Back to Recent Searches</Text>
                  </TouchableOpacity>

                  <Text style={[styles.resultsCount, { color: colors.onSurfaceMuted }]}>
                    {filteredProducts.length}{' '}
                    {filteredProducts.length === 1 ? 'match' : 'matches'} for "{searchQuery}"
                  </Text>
                </View>

                {filteredProducts.length > 0 ? (
                  <ProductGridSection
                    products={filteredProducts}
                    onProductPress={handleProductTap}
                  />
                ) : (
                  <View style={styles.noResultsBox}>
                    <MaterialIcon
                      name="search_off"
                      size={44}
                      color={colors.onSurfaceMuted}
                    />
                    <Text style={[styles.noResultsTitle, { color: colors.onSurface }]}>No Wholesale Products Found</Text>
                    <Text style={[styles.noResultsSubtitle, { color: colors.onSurfaceMuted }]}>
                      Try checking your spelling, using more general terms, or explore wholesale categories.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>

          {/* Pinterest-style Desktop Side Drawer */}
          {isDesktop && activeSideProduct && (
            <ProductDetailSidePanel
              product={activeSideProduct}
              onClose={() => setActiveSideProduct(null)}
              onViewSpecs={(p) => router.push(`/product/specs/${p.id}`)}
            />
          )}
        </View>
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  searchBarWrapper: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    marginBottom: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  resultsHeader: {
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
  clearSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  clearSearchText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.6)',
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  noResultsTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginTop: 12,
    marginBottom: 6,
  },
  noResultsSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.5)',
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
  },
});
