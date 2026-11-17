import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { ProductGridCard } from '@/features/home/presentation/widgets/product_grid_card';
import { ProductDetailSidePanel } from '@/features/home/presentation/widgets/product_detail_side_panel';
import { MOCK_PRODUCTS, Product } from '@/features/inventory/domain/entities/product';
import {
  CategoryItem,
  MOCK_CATEGORIES,
} from './models/category_model';

export function CategoriesPage() {
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 960;

  // Desktop active path: [MainCategory, SubCategory?, ChildCategory?]
  const [activePath, setActivePath] = useState<CategoryItem[]>([MOCK_CATEGORIES[0]]);

  // Selected product for desktop Pinterest-style side panel
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Mobile navigation stack
  const [mobileStack, setMobileStack] = useState<CategoryItem[]>([]);

  // Product tap handler (Adaptive desktop vs mobile)
  const handleProductTap = (product: Product) => {
    if (isDesktop) {
      setSelectedProduct(product);
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  // -------------------------------------------------------------
  // DESKTOP DRILLDOWN & PRODUCT PREVIEW
  // -------------------------------------------------------------
  if (isDesktop) {
    const currentCategory = activePath[activePath.length - 1];
    const subCategories = currentCategory.subCategories || [];
    const isLeaf = subCategories.length === 0;

    const handleDesktopDrillIn = (cat: CategoryItem) => {
      setActivePath((prev) => [...prev, cat]);
      setSelectedProduct(null); // Reset side panel when changing category level
    };

    const handleBreadcrumbClick = (index: number) => {
      setActivePath((prev) => prev.slice(0, index + 1));
      setSelectedProduct(null);
    };

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
          <View style={styles.desktopOuterLayout}>
            {/* ── Left / Center Categories & Products Area ── */}
            <View style={styles.desktopMainFlow}>
              {/* Top Bar with Back Button & Breadcrumbs */}
              <View style={[styles.desktopTopNav, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity
                  onPress={() => router.safeGoBack()}
                  style={[styles.backButton, { backgroundColor: colors.cardColor }]}
                  activeOpacity={0.7}
                >
                  <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
                </TouchableOpacity>

                <View style={styles.breadcrumbsContainer}>
                  <Text style={[styles.desktopPageTitle, { color: colors.onSurface }]}>Explore Catalog</Text>

                  {/* Interactive Dynamic Breadcrumb Trail */}
                  <View style={styles.breadcrumbTrail}>
                    {activePath.map((item, idx) => {
                      const isLast = idx === activePath.length - 1;
                      return (
                        <View key={item.id} style={styles.breadcrumbItem}>
                          {idx > 0 && (
                            <MaterialIcon
                              name="chevron_right"
                              size={16}
                              color={colors.onSurfaceMuted}
                            />
                          )}
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleBreadcrumbClick(idx)}
                            disabled={isLast}
                          >
                            <Text
                              style={[
                                styles.breadcrumbText,
                                { color: isLast ? colors.onSurface : colors.onSurfaceMuted },
                                isLast && styles.breadcrumbActive,
                              ]}
                            >
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Split Megamenu Content */}
              <View style={styles.megamenuContainer}>
                {/* Left Sidebar: Root Categories */}
                <View style={[styles.leftSidebar, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                  <Text style={[styles.sidebarHeader, { color: colors.onSurfaceMuted }]}>ALL DEPARTMENTS</Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {MOCK_CATEGORIES.map((cat) => {
                      const isSelected = activePath[0].id === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          activeOpacity={0.8}
                          style={[
                            styles.sidebarItem,
                            isSelected && [styles.sidebarItemSelected, { backgroundColor: colors.surface }],
                          ]}
                          onPress={() => {
                            setActivePath([cat]);
                            setSelectedProduct(null);
                          }}
                        >
                          <Image source={{ uri: cat.imageUrl }} style={styles.sidebarThumbnail} />
                          <Text
                            style={[
                              styles.sidebarItemText,
                              { color: isSelected ? colors.primary : colors.onSurface },
                              isSelected && styles.sidebarItemTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                          <MaterialIcon
                            name="chevron_right"
                            size={18}
                            color={isSelected ? colors.primary : colors.onSurfaceMuted}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Right Content Area */}
                <View style={[styles.rightContentArea, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  {/* Active Category Header */}
                  <View style={[styles.categoryHeroHeader, { borderBottomColor: colors.borderLight }]}>
                    <Image source={{ uri: currentCategory.imageUrl }} style={styles.heroThumbnail} />
                    <View style={styles.heroTextWrapper}>
                      <Text style={[styles.heroCategoryTitle, { color: colors.onSurface }]}>{currentCategory.name}</Text>
                      <Text style={[styles.heroCategorySubtitle, { color: colors.onSurfaceMuted }]}>
                        {!isLeaf
                          ? `${subCategories.length} Sub-Categories available • Click any to explore deeper`
                          : `${currentCategory.itemCount} Verified wholesale products available in this section`}
                      </Text>
                    </View>

                    {activePath.length > 1 && (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.upLevelButton}
                        onPress={() => {
                          setActivePath((prev) => prev.slice(0, prev.length - 1));
                          setSelectedProduct(null);
                        }}
                      >
                        <MaterialIcon name="arrow_upward" size={15} color={AppColors.primary} />
                        <Text style={styles.upLevelText}>Up one level</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 1. Sub-Categories Cards */}
                  {!isLeaf ? (
                    <ScrollView
                      contentContainerStyle={styles.subCategoryGrid}
                      showsVerticalScrollIndicator={false}
                    >
                      {subCategories.map((sub) => {
                        const hasDeeper = sub.subCategories && sub.subCategories.length > 0;
                        return (
                          <TouchableOpacity
                            key={sub.id}
                            style={[styles.subCategoryCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
                            activeOpacity={0.85}
                            onPress={() => handleDesktopDrillIn(sub)}
                          >
                            <Image source={{ uri: sub.imageUrl }} style={styles.subCardImage} />
                            <View style={styles.subCardContent}>
                              <Text style={[styles.subCardTitle, { color: colors.onSurface }]} numberOfLines={1}>
                                {sub.name}
                              </Text>
                              <Text style={[styles.subCardCount, { color: colors.onSurfaceMuted }]}>
                                {hasDeeper
                                  ? `${sub.subCategories?.length} Nested Categories`
                                  : `${sub.itemCount} Products Available`}
                              </Text>
                              <View style={styles.viewProductsRow}>
                                <Text style={[styles.viewProductsText, { color: colors.primary }]}>
                                  {hasDeeper ? 'Open Sub-Categories' : 'View Products'}
                                </Text>
                                <MaterialIcon
                                  name="arrow_forward"
                                  size={14}
                                  color={colors.primary}
                                />
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    /* 2. Exact Product Cards from Home Page (Tap opens side panel) */
                    <ScrollView
                      contentContainerStyle={styles.productGridContainer}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.productCardsGrid}>
                        {MOCK_PRODUCTS.map((prod) => (
                          <View
                            key={prod.id}
                            style={[
                              styles.productCardCell,
                              selectedProduct ? styles.productCardCellNarrow : null,
                            ]}
                          >
                            <ProductGridCard
                              product={prod}
                              aspectRatio={0.85}
                              onPress={() => handleProductTap(prod)}
                            />
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              </View>
            </View>

            {/* ── Right Side Panel (When product is clicked in Explore) ── */}
            {selectedProduct && (
              <ProductDetailSidePanel
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onViewSpecs={(p) => router.push(`/product/specs/${p.id}`)}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // MOBILE LAYOUT: Clean Vertical Drilldown with Breadcrumbs
  // -------------------------------------------------------------
  const currentCategories: CategoryItem[] =
    mobileStack.length === 0
      ? MOCK_CATEGORIES
      : mobileStack[mobileStack.length - 1].subCategories || [];

  const handleMobileCategoryTap = (category: CategoryItem) => {
    if (category.subCategories && category.subCategories.length > 0) {
      setMobileStack((prev) => [...prev, category]);
    } else {
      console.log('Selected Category leaf:', category.name);
    }
  };

  const handleMobileGoBack = () => {
    if (mobileStack.length > 0) {
      setMobileStack((prev) => prev.slice(0, prev.length - 1));
    } else {
      router.safeGoBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.maxWidthWrapper}>
          {/* Mobile Header */}
          <View style={[styles.mobileHeaderContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
            <View style={styles.mobileHeaderTopRow}>
              <TouchableOpacity
                onPress={handleMobileGoBack}
                style={[styles.backButton, { backgroundColor: colors.cardColor }]}
                activeOpacity={0.7}
              >
                <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.mobileHeaderTitle, { color: colors.onSurface }]}>Explore</Text>
            </View>

            {mobileStack.length > 0 && (
              <View style={styles.mobileBreadcrumbRow}>
                <TouchableOpacity onPress={() => setMobileStack([])} activeOpacity={0.7}>
                  <Text style={[styles.mobileBreadcrumbLink, { color: colors.primary }]}>All</Text>
                </TouchableOpacity>

                {mobileStack.map((item, idx) => (
                  <View key={item.id} style={styles.breadcrumbItem}>
                    <MaterialIcon name="chevron_right" size={16} color={colors.onSurfaceMuted} />
                    <TouchableOpacity
                      onPress={() => setMobileStack((prev) => prev.slice(0, idx + 1))}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.mobileBreadcrumbLink,
                          { color: colors.primary },
                          idx === mobileStack.length - 1 && styles.breadcrumbActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Mobile Category List */}
          <FlatList
            data={currentCategories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />}
            renderItem={({ item }) => {
              const isLeaf = !item.subCategories || item.subCategories.length === 0;
              const subtitle = isLeaf
                ? `${item.itemCount} Items available`
                : 'Tap to explore sub-categories';

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.categoryItem, { backgroundColor: colors.surface }]}
                  onPress={() => handleMobileCategoryTap(item)}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} />
                  <View style={styles.categoryTextWrapper}>
                    <Text style={[styles.categoryName, { color: colors.onSurface }]}>{item.name}</Text>
                    <Text style={[styles.categorySubtitle, { color: colors.onSurfaceMuted }]}>{subtitle}</Text>
                  </View>
                  <MaterialIcon name="chevron_right" size={20} color={colors.onSurfaceMuted} />
                </TouchableOpacity>
              );
            }}
          />
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

  // Desktop Megamenu Styles
  desktopOuterLayout: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
  },
  desktopMainFlow: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  desktopTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.08)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
  },
  breadcrumbsContainer: {
    flex: 1,
  },
  desktopPageTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
  },
  breadcrumbTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
    paddingHorizontal: 4,
  },
  breadcrumbActive: {
    color: AppColors.onSurface,
  },
  megamenuContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  leftSidebar: {
    width: 270,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.06)',
  },
  sidebarHeader: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.45)',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  sidebarItemSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sidebarThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  sidebarItemText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(28, 27, 31, 0.7)',
    marginLeft: 10,
  },
  sidebarItemTextSelected: {
    color: AppColors.primary,
  },
  rightContentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.06)',
  },
  categoryHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.06)',
    marginBottom: 18,
  },
  heroThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroCategoryTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
  },
  heroCategorySubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 2,
  },
  upLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  upLevelText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  subCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  subCategoryCard: {
    width: '31%',
    minWidth: 200,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.06)',
    overflow: 'hidden',
  },
  subCardImage: {
    width: '100%',
    height: 120,
  },
  subCardContent: {
    padding: 12,
  },
  subCardTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  subCardCount: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 2,
  },
  viewProductsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  viewProductsText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  productGridContainer: {
    paddingBottom: 20,
  },
  productCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  productCardCell: {
    width: '31%',
    minWidth: 190,
  },
  productCardCellNarrow: {
    width: '46%',
  },

  // Mobile Styles
  mobileHeaderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.05)',
  },
  mobileHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileHeaderTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  mobileBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
  },
  mobileBreadcrumbLink: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: AppColors.primary,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    marginLeft: 74,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  categoryTextWrapper: {
    flex: 1,
    marginLeft: 14,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  categorySubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 2,
  },
});
