import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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

  // GitHub-style borders and colors
  const gitBorder = isDark ? '#30363D' : '#D0D7DE';
  const gitHeaderBg = isDark ? '#161B22' : '#F6F8FA';
  const gitSubtleText = isDark ? '#8B949E' : '#57606A';

  // Own products state — loaded from /my-products, not global catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

  // Filtered Products by active tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === 'active' && p.status !== 'active') return false;
      if (activeTab === 'low_stock' && p.status !== 'low_stock') return false;
      return true;
    });
  }, [products, activeTab]);

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
        {/* ── Top Header Bar (Git-style with thin bottom line) ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderBottomColor: gitBorder,
            },
          ]}
        >
          <View style={[styles.headerLeft, { flex: 1 }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backBtn}
            >
              <MaterialIcon name="arrow_back_ios_new" size={16} color={colors.onSurface} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
                Supplier Catalog
              </Text>
              <Text style={[styles.headerSubtitle, { color: gitSubtleText }]} numberOfLines={1}>
                {user?.legalBusinessName || user?.name || 'My Wholesale Catalog'} • Active Inventory
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCreateNew}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialIcon name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Post Product</Text>
          </TouchableOpacity>
        </View>

        {isLoadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: gitSubtleText }]}>
              Loading supplier catalog...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentWrapper}>
              {/* ── Git-Style Flat Stats Bar (Lines instead of floating rounded boxes) ── */}
              <View style={[styles.gitStatsBar, { borderBottomColor: gitBorder }]}>
                <View style={styles.gitStatItem}>
                  <Text style={[styles.gitStatLabel, { color: gitSubtleText }]}>ACTIVE LISTINGS</Text>
                  <Text style={[styles.gitStatValue, { color: colors.onSurface }]}>
                    {stats.totalListings}
                  </Text>
                </View>

                <View style={[styles.gitStatDivider, { backgroundColor: gitBorder }]} />

                <View style={styles.gitStatItem}>
                  <Text style={[styles.gitStatLabel, { color: gitSubtleText }]}>WAREHOUSE STOCK</Text>
                  <Text style={[styles.gitStatValue, { color: colors.primary }]}>
                    {stats.totalUnits.toLocaleString()} units
                  </Text>
                </View>

                <View style={[styles.gitStatDivider, { backgroundColor: gitBorder }]} />

                <View style={styles.gitStatItem}>
                  <Text style={[styles.gitStatLabel, { color: gitSubtleText }]}>LOW STOCK</Text>
                  <Text style={[styles.gitStatValue, { color: stats.lowStockCount > 0 ? '#F59E0B' : colors.onSurface }]}>
                    {stats.lowStockCount}
                  </Text>
                </View>
              </View>

              {/* ── Filter Tabs (Clean Git Underline Style, No Boxy Pills) ── */}
              <View style={[styles.tabsBar, { borderBottomColor: gitBorder }]}>
                {[
                  { key: 'all' as FilterTab, label: `All Products (${products.length})` },
                  { key: 'active' as FilterTab, label: 'In Stock' },
                  { key: 'low_stock' as FilterTab, label: `Low Stock (${stats.lowStockCount})` },
                ].map((tab) => {
                  const isSelected = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      style={[
                        styles.gitTabItem,
                        isSelected && [styles.gitTabItemSelected, { borderBottomColor: colors.primary }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.gitTabText,
                          { color: isSelected ? colors.primary : gitSubtleText },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Products List (Pure line-separated items, no floating box cards) ── */}
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcon name="inventory_2" size={40} color={gitSubtleText} />
                  <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                    No products in this view
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: gitSubtleText }]}>
                    Post a new wholesale listing to add to your catalog.
                  </Text>
                  <TouchableOpacity
                    onPress={handleCreateNew}
                    style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.emptyActionBtnText}>+ Post New Product</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.gitListContainer}>
                  {filteredProducts.map((prod, idx) => {
                    const isLowStock = prod.status === 'low_stock';
                    const basePrice = prod.priceTiers?.[0]?.price || prod.srp;
                    const discountTier = prod.priceTiers?.[1];

                    return (
                      <TouchableOpacity
                        key={prod.id}
                        activeOpacity={0.7}
                        onPress={() => handleEditProduct(prod)}
                        style={[
                          styles.productRow,
                          {
                            borderBottomColor: gitBorder,
                            backgroundColor: isDark ? 'transparent' : '#FFFFFF',
                          },
                        ]}
                      >
                        {/* Thumbnail image with minimal 4px radius and 1px border */}
                        <Image
                          source={{ uri: prod.imageUrl }}
                          style={[styles.cardImage, { borderColor: gitBorder }]}
                          resizeMode="cover"
                        />

                        {/* Content */}
                        <View style={styles.cardBody}>
                          {/* Top Row: Brand & SKU and Status */}
                          <View style={styles.cardTopRow}>
                            <View style={styles.brandSkuRow}>
                              <Text style={[styles.brandText, { color: colors.primary }]}>
                                {prod.brand || 'WHOLESALE'}
                              </Text>
                              <Text style={[styles.dotSeparator, { color: gitSubtleText }]}>•</Text>
                              <Text style={[styles.skuText, { color: gitSubtleText }]}>
                                {prod.sku || prod.warehouseLoc || 'Standard SKU'}
                              </Text>
                            </View>

                            {/* Git-style Status Badge (flat, 4px radius) */}
                            <View
                              style={[
                                styles.cardStatusBadge,
                                {
                                  backgroundColor: isLowStock
                                    ? (isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7')
                                    : (isDark ? 'rgba(46,164,79,0.15)' : '#E6FFED'),
                                  borderColor: isLowStock ? '#F59E0B' : '#2EA44F',
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.cardStatusDot,
                                  { backgroundColor: isLowStock ? '#F59E0B' : '#2EA44F' },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.cardStatusText,
                                  { color: isLowStock ? '#F59E0B' : '#2EA44F' },
                                ]}
                              >
                                {isLowStock
                                  ? `${prod.stockQuantity || 0} left`
                                  : `${(prod.stockQuantity || 100).toLocaleString()} Ready`}
                              </Text>
                            </View>
                          </View>

                          {/* Product Title */}
                          <Text
                            style={[styles.productName, { color: colors.onSurface }]}
                            numberOfLines={1}
                          >
                            {prod.name}
                          </Text>

                          {/* Pricing & Edit Action Row */}
                          <View style={styles.priceRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.priceTag, { color: colors.onSurface }]}>
                                UGX {basePrice.toLocaleString()}
                                <Text style={[styles.perUnitLabel, { color: gitSubtleText }]}> / unit</Text>
                              </Text>

                              {discountTier && (
                                <Text style={[styles.discountTierText, { color: colors.primary }]}>
                                  Bulk: {discountTier.minQuantity}+ units @ UGX {discountTier.price.toLocaleString()}
                                </Text>
                              )}
                            </View>

                            {/* Git-style Edit Button (flat, 4px radius, 1px border) */}
                            <View
                              style={[
                                styles.gitEditBtn,
                                {
                                  backgroundColor: gitHeaderBg,
                                  borderColor: gitBorder,
                                },
                              ]}
                            >
                              <MaterialIcon name="edit" size={13} color={colors.onSurface} />
                              <Text style={[styles.gitEditBtnText, { color: colors.onSurface }]}>
                                Edit
                              </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 960,
  },
  // Git-style Flat Stats Bar
  gitStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gitStatItem: {
    flex: 1,
  },
  gitStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gitStatValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  gitStatDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  // Git Tabs
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  gitTabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  gitTabItemSelected: {
    borderBottomWidth: 2,
  },
  gitTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Product List (Line-separated)
  gitListContainer: {
    width: '100%',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#0F1117',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
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
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dotSeparator: {
    fontSize: 10,
  },
  skuText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cardStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginVertical: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  priceTag: {
    fontSize: 13,
    fontWeight: '800',
  },
  perUnitLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  discountTierText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  gitEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  gitEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 12,
  },
  emptyActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
