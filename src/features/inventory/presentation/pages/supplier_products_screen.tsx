import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { Product } from '../../domain/entities/product';
import { ProductApiService } from '../../data/services/product_api_service';
import { EditProductSheet } from '../widgets/edit_product_sheet';
import { useAuth } from '@/features/auth/context/auth_context';

type FilterTab = 'all' | 'active' | 'low_stock';

export function SupplierProductsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { user } = useAuth();

  // Own products state — loaded from /my-products, not global catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadMyProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const res = await ProductApiService.getMyProducts({ limit: 100 });
      setProducts(res.products);
    } catch (err: any) {
      console.warn('Failed to load my products:', err.message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadMyProducts();
  }, [loadMyProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tab filter
      if (activeTab === 'active' && p.status !== 'active') return false;
      if (activeTab === 'low_stock' && p.status !== 'low_stock') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand?.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        const matchesLoc = p.warehouseLoc?.toLowerCase().includes(q);
        return matchesName || matchesBrand || matchesSku || matchesLoc;
      }

      return true;
    });
  }, [products, activeTab, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalListings = products.length;
    const totalUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
    const lowStockCount = products.filter((p) => p.status === 'low_stock').length;
    return { totalListings, totalUnits, lowStockCount };
  }, [products]);

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setIsEditModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setIsEditModalOpen(true);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.scaffoldBackground },
      ]}
    >
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <View style={[styles.headerLeft, { flex: 1 }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backBtn}
            >
              <MaterialIcon name="arrow_back_ios_new" size={18} color={colors.onSurface} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
                Supplier Catalog
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                ]}
                numberOfLines={1}
              >
                {user?.legalBusinessName || user?.name || 'My Catalog'} • My Products
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCreateNew}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialIcon name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        {isLoadingProducts ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.onSurfaceMuted, fontFamily: 'PlusJakartaSans_500Medium' }}>
              Loading your products...
            </Text>
          </View>
        ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* KPI Metric Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiRow}
            >
              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                    borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text style={[styles.kpiLabel, { color: colors.onSurfaceMuted }]}>
                  Active Listings
                </Text>
                <Text style={[styles.kpiValue, { color: colors.onSurface }]}>
                  {stats.totalListings}
                </Text>
              </View>

              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                    borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text style={[styles.kpiLabel, { color: colors.onSurfaceMuted }]}>
                  Warehouse Stock
                </Text>
                <Text style={[styles.kpiValue, { color: colors.primary }]}>
                  {stats.totalUnits.toLocaleString()} units
                </Text>
              </View>

              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                    borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text style={[styles.kpiLabel, { color: colors.onSurfaceMuted }]}>
                  Low Stock Items
                </Text>
                <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>
                  {stats.lowStockCount}
                </Text>
              </View>
            </ScrollView>

            {/* Search and Tabs Row */}
            <View style={styles.searchAndTabsSection}>
              {/* Search Bar */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                    borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.08)',
                  },
                ]}
              >
                <MaterialIcon name="search" size={20} color={colors.onSurfaceMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search products by title, SKU, brand, or hub..."
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  style={[styles.searchInput, { color: colors.onSurface }]}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcon name="close" size={18} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsRow}
              >
                {[
                  { key: 'all' as FilterTab, label: `All (${products.length})` },
                  { key: 'active' as FilterTab, label: 'Active' },
                  { key: 'low_stock' as FilterTab, label: `Low Stock (${stats.lowStockCount})` },
                ].map((tab) => {
                  const isSelected = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      style={[
                        styles.tabChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark ? colors.cardColor : '#FFFFFF',
                          borderColor: isSelected
                            ? colors.primary
                            : isDark ? colors.borderLight : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.onSurface,
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Products Grid / List */}
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcon name="inventory_2" size={48} color={colors.onSurfaceMuted} />
                <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                  No products found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
                  Try clearing your search query or add a new wholesale listing.
                </Text>
                <TouchableOpacity
                  onPress={handleCreateNew}
                  style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.emptyActionBtnText}>+ Add New Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={isDesktop ? styles.desktopGrid : styles.mobileList}>
                {filteredProducts.map((prod) => {
                  const isLowStock = prod.status === 'low_stock';
                  const basePrice = prod.priceTiers?.[0]?.price || prod.srp;
                  const discountTier = prod.priceTiers?.[1];

                  return (
                    <TouchableOpacity
                      key={prod.id}
                      activeOpacity={0.85}
                      onPress={() => handleEditProduct(prod)}
                      style={[
                        styles.productCard,
                        isDesktop ? styles.productCardDesktop : null,
                        {
                          backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                          borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <View style={styles.productCardInner}>
                        {/* Image */}
                        <Image
                          source={{ uri: prod.imageUrl }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />

                        {/* Content */}
                        <View style={styles.cardBody}>
                          {/* Top Row: Brand & SKU */}
                          <View style={styles.cardTopRow}>
                            <View style={styles.brandSkuRow}>
                              <Text style={[styles.brandText, { color: colors.primary }]}>
                                {prod.brand || 'WHOLESALE'}
                              </Text>
                              <Text style={[styles.dotSeparator, { color: colors.onSurfaceMuted }]}>
                                •
                              </Text>
                              <Text
                                style={[
                                  styles.skuText,
                                  { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' },
                                ]}
                              >
                                {prod.sku || prod.warehouseLoc}
                              </Text>
                            </View>

                            {/* Status Pill */}
                            <View
                              style={[
                                styles.cardStatusPill,
                                {
                                  backgroundColor: isLowStock
                                    ? 'rgba(245, 158, 11, 0.12)'
                                    : 'rgba(16, 185, 129, 0.12)',
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.cardStatusDot,
                                  { backgroundColor: isLowStock ? '#F59E0B' : '#10B981' },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.cardStatusText,
                                  { color: isLowStock ? '#F59E0B' : '#10B981' },
                                ]}
                              >
                                {isLowStock
                                  ? `${prod.stockQuantity || 0} Units left`
                                  : `${(prod.stockQuantity || 100).toLocaleString()} Ready`}
                              </Text>
                            </View>
                          </View>

                          {/* Product Title */}
                          <Text
                            style={[styles.productName, { color: colors.onSurface }]}
                            numberOfLines={2}
                          >
                            {prod.name}
                          </Text>

                          {/* Pricing & Tier Breaks */}
                          <View style={styles.priceRow}>
                            <View>
                              <Text style={[styles.priceTag, { color: colors.onSurface }]}>
                                UGX {basePrice.toLocaleString()}
                                <Text
                                  style={[
                                    styles.perUnitLabel,
                                    { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' },
                                  ]}
                                >
                                  {' '}/ unit
                                </Text>
                              </Text>

                              {discountTier && (
                                <Text style={[styles.discountTierText, { color: colors.primary }]}>
                                  Bulk: {discountTier.minQuantity}+ units @ UGX {discountTier.price.toLocaleString()}
                                </Text>
                              )}
                            </View>

                            {/* Edit Action Pill */}
                            <View
                              style={[
                                styles.editPill,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(18, 187, 240, 0.08)',
                                  borderColor: isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(18, 187, 240, 0.2)',
                                },
                              ]}
                            >
                              <MaterialIcon name="edit" size={14} color={colors.primary} />
                              <Text style={[styles.editPillText, { color: colors.primary }]}>
                                Edit
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
        )}
      </View>

      {/* Edit / Update Product Bottom Modal Sheet */}
      <EditProductSheet
        visible={isEditModalOpen}
        product={selectedProduct}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => loadMyProducts()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 960,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingRight: 16,
  },
  kpiCard: {
    minWidth: 120,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
  },
  searchAndTabsSection: {
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    height: '100%',
    outlineStyle: 'none' as any,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  mobileList: {
    gap: 12,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
  },
  productCardDesktop: {
    width: 'calc(50% - 7px)' as any,
  },
  productCardInner: {
    flexDirection: 'row',
    gap: 14,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#1E1E24',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSkuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    fontSize: 10,
  },
  skuText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  cardStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  cardStatusText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
  },
  productName: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 18,
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  perUnitLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  discountTierText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 2,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  emptyActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
});
