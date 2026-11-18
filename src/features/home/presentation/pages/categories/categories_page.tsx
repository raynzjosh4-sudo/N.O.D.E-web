import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { ProductGridCard } from '@/features/home/presentation/widgets/product_grid_card';
import { ProductDetailSidePanel } from '@/features/home/presentation/widgets/product_detail_side_panel';
import { Product } from '@/features/inventory/domain/entities/product';
import { CategoryItem } from './models/category_model';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { useProducts } from '@/features/inventory/context/products_context';
import { styles } from './categorystyle';

export function CategoriesPage() {
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 960;
  const { products } = useProducts();

  const [categoriesTree, setCategoriesTree] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Desktop active path: [MainCategory, SubCategory?, ChildCategory?]
  const [activePath, setActivePath] = useState<CategoryItem[]>([]);

  // Selected product for desktop Pinterest-style side panel
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Mobile navigation stack
  const [mobileStack, setMobileStack] = useState<CategoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    ProductApiService.getCategories()
      .then((cats) => {
        if (!isMounted) return;

        // Build hierarchical tree from flat CategoryDto list
        const catMap = new Map<string, CategoryItem>();
        (cats || []).forEach((c) => {
          catMap.set(c.id, {
            id: c.id,
            name: c.name,
            imageUrl:
              c.image_url ||
              'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
            itemCount: 0,
            subCategories: [],
          });
        });

        const roots: CategoryItem[] = [];
        (cats || []).forEach((c) => {
          const item = catMap.get(c.id);
          if (!item) return;

          if (!c.parent_id || c.level === 0 || !catMap.has(c.parent_id)) {
            roots.push(item);
          } else {
            const parent = catMap.get(c.parent_id);
            if (parent) {
              parent.subCategories = parent.subCategories || [];
              parent.subCategories.push(item);
            } else {
              roots.push(item);
            }
          }
        });

        setCategoriesTree(roots);
        if (roots.length > 0) {
          setActivePath([roots[0]]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch categories:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (isLoading) {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.onSurfaceMuted }}>Loading wholesale categories...</Text>
          </View>
        </SafeAreaView>
      );
    }

    if (categoriesTree.length === 0) {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: colors.onSurface, fontSize: 16 }}>No categories available</Text>
          </View>
        </SafeAreaView>
      );
    }

    const currentCategory = activePath.length > 0 ? activePath[activePath.length - 1] : categoriesTree[0];
    const subCategories = currentCategory?.subCategories || [];
    const isLeaf = subCategories.length === 0;

    // Filter products matching current category leaf
    const categoryProducts = products.filter(
      (p) => p.categoryId === currentCategory.id || p.categoryName === currentCategory.name
    );
    const displayProducts = categoryProducts.length > 0 ? categoryProducts : products;

    const handleDesktopDrillIn = (cat: CategoryItem) => {
      setActivePath((prev) => [...prev, cat]);
      setSelectedProduct(null);
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
                    {categoriesTree.map((cat) => {
                      const isSelected = activePath[0]?.id === cat.id;
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
                          : `${displayProducts.length} Verified wholesale products available in this section`}
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
                                  : 'Tap to view products'}
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
                    /* 2. Exact Product Cards from Catalog */
                    <ScrollView
                      contentContainerStyle={styles.productGridContainer}
                      showsVerticalScrollIndicator={false}
                    >
                      {displayProducts.length > 0 ? (
                        <View style={styles.productCardsGrid}>
                          {displayProducts.map((prod) => (
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
                      ) : (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <MaterialIcon name="inventory_2" size={48} color={colors.onSurfaceMuted} />
                          <Text style={{ marginTop: 12, color: colors.onSurface, fontSize: 16, fontWeight: '600' }}>
                            No products in this category yet
                          </Text>
                        </View>
                      )}
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
      ? categoriesTree
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.onSurfaceMuted }}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
