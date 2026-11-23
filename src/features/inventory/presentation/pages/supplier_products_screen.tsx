import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { Product } from '../../domain/entities/product';
import { ProductApiService } from '../../data/services/product_api_service';
import { EditProductSheet } from '../widgets/edit_product_sheet';
import { useAuth } from '@/features/auth/context/auth_context';
import { ProfileApiService } from '@/features/profile/data/services/profile_api_service';
import { SupplierProductsShimmer } from './shimmer/supplier_products_shimmer';

type FilterTab = 'all' | 'active' | 'low_stock' | 'incoming_orders';

export function SupplierProductsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { user } = useAuth();

  // ── Authentic GitHub Primer Color Palette ──
  const gitColors = {
    canvas: isDark ? '#0D1117' : '#FFFFFF',
    canvasSubtle: isDark ? '#161B22' : '#F6F8FA',
    border: isDark ? '#30363D' : '#D0D7DE',
    borderMuted: isDark ? '#21262D' : '#EAECEF',
    textPrimary: isDark ? '#E6EDF3' : '#1F2328',
    textSecondary: isDark ? '#848D97' : '#656D76',
    textLink: isDark ? '#58A6FF' : '#0969DA',
    greenBtn: isDark ? '#238636' : '#1F883D',
    greenBtnHover: isDark ? '#2EA043' : '#1A7F37',
    labelGreenBg: isDark ? 'rgba(35, 134, 54, 0.2)' : '#DAFBE8',
    labelGreenText: isDark ? '#3FB950' : '#1A7F37',
    labelGreenBorder: isDark ? 'rgba(63, 185, 80, 0.4)' : '#4AC26B',
    labelYellowBg: isDark ? 'rgba(187, 128, 9, 0.2)' : '#FFF8C5',
    labelYellowText: isDark ? '#D29922' : '#9A6700',
    labelYellowBorder: isDark ? 'rgba(210, 153, 34, 0.4)' : '#E3B341',
    btnBg: isDark ? '#21262D' : '#F6F8FA',
    btnBorder: isDark ? '#30363D' : '#D0D7DE',
    pillBg: isDark ? 'rgba(110, 119, 129, 0.3)' : 'rgba(175, 184, 193, 0.2)',
    tabIndicator: '#FD8C73', // GitHub's signature orange tab underline
  };

  // Own products state — loaded from /my-products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Incoming wholesale orders state
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadMyProducts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1 && !append) {
      setIsLoadingProducts(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const res = await ProductApiService.getMyProducts({ page: pageNum, limit: 15 });
      if (append) {
        setProducts((prev) => {
          const map = new Map<string, Product>();
          prev.forEach((p) => map.set(p.id, p));
          res.products.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      } else {
        setProducts(res.products);
      }
      setPage(pageNum);
      setHasMore(res.products.length >= 15);
    } catch (err: any) {
      console.warn('Failed to load my products:', err.message);
      if (!append) setProducts([]);
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoadingProducts) return;
    loadMyProducts(page + 1, true);
  }, [isLoadingMore, hasMore, isLoadingProducts, page, loadMyProducts]);

  const loadIncomingOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await ProfileApiService.getSupplierIncomingOrders({ limit: 100 });
      setIncomingOrders(res.orders || []);
    } catch (err: any) {
      console.warn('Failed to load incoming orders:', err.message);
      setIncomingOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadMyProducts(1, false),
        loadIncomingOrders(),
      ]);
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadMyProducts, loadIncomingOrders]);

  useEffect(() => {
    loadMyProducts(1, false);
    loadIncomingOrders();
  }, [loadMyProducts, loadIncomingOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await ProfileApiService.updateOrderStatus(orderId, newStatus);
      setIncomingOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      console.warn('Update order status failed:', err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
    const activeCount = products.filter((p) => p.status === 'active').length;
    const totalUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
    const lowStockCount = products.filter((p) => p.status === 'low_stock').length;
    return { totalListings, activeCount, totalUnits, lowStockCount };
  }, [products]);

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setIsEditModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setIsEditModalOpen(true);
  };

  const orgName = user?.legalBusinessName || user?.name || 'supplier';
  const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: gitColors.canvas }]}>
      <View style={[styles.container, { backgroundColor: gitColors.canvas }]}>
        {/* ── 1. GITHUB TOP REPO HEADER / BREADCRUMB BAR ── */}
        <View style={[styles.gitHeader, { backgroundColor: gitColors.canvasSubtle, borderBottomColor: gitColors.border }]}>
          <View style={styles.gitHeaderContent}>
            {/* Left: Back button + Breadcrumb */}
            <View style={styles.gitBreadcrumbRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.gitBackBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcon name="arrow_back" size={18} color={gitColors.textPrimary} />
              </TouchableOpacity>

              <MaterialIcon name="inventory_2" size={18} color={gitColors.textSecondary} />

              <View style={styles.gitBreadcrumbs}>
                <Text style={[styles.gitOrgText, { color: gitColors.textLink }]}>{orgSlug}</Text>
                <Text style={[styles.gitSlash, { color: gitColors.textSecondary }]}>/</Text>
                <Text style={[styles.gitRepoText, { color: gitColors.textPrimary }]}>catalog</Text>
              </View>

              <View style={[styles.gitPublicBadge, { borderColor: gitColors.border, backgroundColor: gitColors.canvas }]}>
                <Text style={[styles.gitPublicBadgeText, { color: gitColors.textSecondary }]}>Wholesale</Text>
              </View>
            </View>

            {/* Right: GitHub Green "New Product" Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateNew}
              style={[styles.gitGreenBtn, { backgroundColor: gitColors.greenBtn }]}
            >
              <MaterialIcon name="add" size={16} color="#FFFFFF" />
              <Text style={styles.gitGreenBtnText}>New product</Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. GITHUB UNDERLINE NAVIGATION TABS ── */}
          <View style={[styles.gitTabsBar, { borderBottomColor: gitColors.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gitTabsScroll}
            >
              {[
                { key: 'all' as FilterTab, label: 'All Products', count: stats.totalListings, icon: 'list_alt' },
                { key: 'active' as FilterTab, label: 'In Stock', count: stats.activeCount, icon: 'check_circle' },
                { key: 'low_stock' as FilterTab, label: 'Low Stock', count: stats.lowStockCount, icon: 'warning' },
                { key: 'incoming_orders' as FilterTab, label: 'Incoming Orders', count: incomingOrders.length, icon: 'inbox' },
              ].map((tab) => {
                const isSelected = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.7}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.gitTabItem,
                      isSelected && [styles.gitTabItemSelected, { borderBottomColor: gitColors.tabIndicator }],
                    ]}
                  >
                    <MaterialIcon
                      name={tab.icon}
                      size={16}
                      color={isSelected ? gitColors.textPrimary : gitColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.gitTabLabel,
                        { color: isSelected ? gitColors.textPrimary : gitColors.textSecondary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    <View style={[styles.gitCountPill, { backgroundColor: gitColors.pillBg }]}>
                      <Text style={[styles.gitCountPillText, { color: isSelected ? gitColors.textPrimary : gitColors.textSecondary }]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ── 3. BODY: GITHUB TABLE LIST VIEW ── */}
        {isLoadingProducts ? (
          <SupplierProductsShimmer />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={gitColors.greenBtn}
                colors={[gitColors.greenBtn]}
              />
            }
            onScroll={({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150;
              if (isCloseToBottom) {
                loadMore();
              }
            }}
            scrollEventThrottle={300}
          >
            <View style={styles.contentWrapper}>
              {/* GitHub Table Box Container with 6px radius and 1px border */}
              <View style={[styles.gitTableBox, { borderColor: gitColors.border, backgroundColor: gitColors.canvas }]}>
                {/* ── Table Header Row (Like GitHub commit/issue header) ── */}
                <View style={[styles.gitTableHeader, { backgroundColor: gitColors.canvasSubtle, borderBottomColor: gitColors.border }]}>
                  <View style={styles.gitTableHeaderLeft}>
                    <MaterialIcon
                      name={activeTab === 'incoming_orders' ? 'inbox' : 'check_circle_outline'}
                      size={16}
                      color={activeTab === 'incoming_orders' ? gitColors.textLink : gitColors.labelGreenText}
                    />
                    <Text style={[styles.gitTableHeaderTitle, { color: gitColors.textPrimary }]}>
                      {activeTab === 'incoming_orders'
                        ? `${incomingOrders.length} incoming wholesale orders`
                        : `${filteredProducts.length} ${activeTab === 'all' ? 'total listings' : activeTab === 'active' ? 'in stock' : 'low stock'}`}
                    </Text>
                    {activeTab !== 'incoming_orders' && (
                      <Text style={[styles.gitTableHeaderSub, { color: gitColors.textSecondary }]}>
                        • {stats.totalUnits.toLocaleString()} units total in warehouse
                      </Text>
                    )}
                  </View>

                  <View style={styles.gitTableHeaderRight}>
                    <Text style={[styles.gitSortLabel, { color: gitColors.textSecondary }]}>
                      Sort: Most recent
                    </Text>
                  </View>
                </View>

                {/* ── Table Items: INCOMING ORDERS vs PRODUCTS ── */}
                {activeTab === 'incoming_orders' ? (
                  isLoadingOrders ? (
                    <View style={{ padding: 16, gap: 12 }}>
                      {[1, 2, 3, 4].map((k) => (
                        <View
                          key={k}
                          style={{
                            height: 80,
                            borderRadius: 6,
                            backgroundColor: gitColors.canvasSubtle,
                            borderWidth: 1,
                            borderColor: gitColors.border,
                            opacity: 0.6,
                          }}
                        />
                      ))}
                    </View>
                  ) : incomingOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <MaterialIcon name="inbox" size={48} color={gitColors.textSecondary} />
                      <Text style={[styles.emptyTitle, { color: gitColors.textPrimary }]}>
                        No incoming wholesale orders yet.
                      </Text>
                      <Text style={[styles.emptySubtitle, { color: gitColors.textSecondary }]}>
                        Orders placed by verified retail buyers for your products will appear here for processing and fulfillment.
                      </Text>
                    </View>
                  ) : (
                    incomingOrders.map((ord, idx) => {
                      const isLast = idx === incomingOrders.length - 1;
                      const isUpdating = updatingOrderId === ord.order_id;
                      const entries = Array.isArray(ord.entries_json) ? ord.entries_json : [];
                      const status = (ord.status || 'new').toLowerCase();

                      const statusColor =
                        status === 'completed'
                          ? gitColors.labelGreenText
                          : status === 'processing'
                          ? gitColors.labelYellowText
                          : status === 'seen'
                          ? gitColors.textLink
                          : status === 'cancelled'
                          ? '#D32F2F'
                          : gitColors.labelGreenText;

                      const statusBg =
                        status === 'completed'
                          ? gitColors.labelGreenBg
                          : status === 'processing'
                          ? gitColors.labelYellowBg
                          : status === 'seen'
                          ? 'rgba(88, 166, 255, 0.15)'
                          : status === 'cancelled'
                          ? 'rgba(211, 47, 47, 0.15)'
                          : gitColors.labelGreenBg;

                      return (
                        <View
                          key={ord.order_id || idx}
                          style={[
                            styles.gitOrderRow,
                            !isLast && { borderBottomWidth: 1, borderBottomColor: gitColors.border },
                            { backgroundColor: gitColors.canvas },
                          ]}
                        >
                          <View style={styles.orderHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.orderIdText, { color: gitColors.textLink }]}>
                                #{ord.order_id}
                              </Text>
                              <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                                <Text style={[styles.statusPillText, { color: statusColor }]}>
                                  {status.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.orderDateText, { color: gitColors.textSecondary }]}>
                              {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : ''}
                            </Text>
                          </View>

                          <View style={styles.buyerInfoRow}>
                            <MaterialIcon name="store" size={14} color={gitColors.textSecondary} />
                            <Text style={[styles.buyerNameText, { color: gitColors.textPrimary }]}>
                              {ord.business_name || 'Wholesale Buyer'}
                            </Text>
                            {ord.business_phone ? (
                              <Text style={[styles.buyerPhoneText, { color: gitColors.textSecondary }]}>
                                • {ord.business_phone}
                              </Text>
                            ) : null}
                            {ord.business_city ? (
                              <Text style={[styles.buyerCityText, { color: gitColors.textSecondary }]}>
                                • {ord.business_city}
                              </Text>
                            ) : null}
                          </View>

                          {entries.length > 0 && (
                            <View style={[styles.entriesList, { backgroundColor: gitColors.canvasSubtle, borderColor: gitColors.border }]}>
                              {entries.map((item: any, eIdx: number) => (
                                <View key={eIdx} style={styles.entryLine}>
                                  <Text style={[styles.entryName, { color: gitColors.textPrimary }]} numberOfLines={1}>
                                    {item.name || item.product_name || 'Product Item'}
                                  </Text>
                                  <Text style={[styles.entryQty, { color: gitColors.textSecondary }]}>
                                    {item.color ? `${item.color} • ` : ''}
                                    {item.total_units || item.quantity || 1} units
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}

                          <View style={styles.orderFooterRow}>
                            <Text style={[styles.orderTotalText, { color: gitColors.textPrimary }]}>
                              Total:{' '}
                              <Text style={{ color: gitColors.textLink, fontWeight: '700' }}>
                                UGX {(ord.total_amount || 0).toLocaleString()}
                              </Text>
                            </Text>

                            <View style={styles.orderActionsRow}>
                              {status === 'new' && (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  disabled={isUpdating}
                                  onPress={() => handleUpdateStatus(ord.order_id, 'seen')}
                                  style={[styles.actionBtn, { borderColor: gitColors.border, backgroundColor: gitColors.btnBg }]}
                                >
                                  <MaterialIcon name="visibility" size={14} color={gitColors.textLink} />
                                  <Text style={[styles.actionBtnText, { color: gitColors.textLink }]}>Mark Seen</Text>
                                </TouchableOpacity>
                              )}

                              {(status === 'new' || status === 'seen') && (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  disabled={isUpdating}
                                  onPress={() => handleUpdateStatus(ord.order_id, 'processing')}
                                  style={[styles.actionBtn, { borderColor: gitColors.border, backgroundColor: gitColors.btnBg }]}
                                >
                                  <MaterialIcon name="conveyor_belt" size={14} color={gitColors.labelYellowText} />
                                  <Text style={[styles.actionBtnText, { color: gitColors.labelYellowText }]}>Process</Text>
                                </TouchableOpacity>
                              )}

                              {status === 'processing' && (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  disabled={isUpdating}
                                  onPress={() => handleUpdateStatus(ord.order_id, 'completed')}
                                  style={[styles.actionBtn, { borderColor: gitColors.border, backgroundColor: gitColors.greenBtn }]}
                                >
                                  <MaterialIcon name="check" size={14} color="#FFFFFF" />
                                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Complete</Text>
                                </TouchableOpacity>
                              )}

                              {status !== 'completed' && status !== 'cancelled' && (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  disabled={isUpdating}
                                  onPress={() => handleUpdateStatus(ord.order_id, 'cancelled')}
                                  style={[styles.actionBtn, { borderColor: gitColors.border, backgroundColor: gitColors.btnBg }]}
                                >
                                  <MaterialIcon name="close" size={14} color="#D32F2F" />
                                  <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Decline</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )
                ) : (
                  /* ── Products List ── */
                  filteredProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcon name="inventory_2" size={48} color={gitColors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: gitColors.textPrimary }]}>
                      There aren’t any {activeTab === 'low_stock' ? 'low stock products' : 'products'} here.
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: gitColors.textSecondary }]}>
                      Add products to your wholesale inventory to showcase them across N.O.D.E.
                    </Text>
                    <TouchableOpacity
                      onPress={handleCreateNew}
                      style={[styles.gitGreenBtn, { backgroundColor: gitColors.greenBtn, marginTop: 12 }]}
                    >
                      <MaterialIcon name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.gitGreenBtnText}>New product</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredProducts.map((prod, idx) => {
                    const isLast = idx === filteredProducts.length - 1;
                    const isLowStock = prod.status === 'low_stock';
                    const basePrice = prod.priceTiers?.[0]?.price || prod.srp;
                    const discountTier = prod.priceTiers?.[1];

                    return (
                      <TouchableOpacity
                        key={prod.id}
                        activeOpacity={0.7}
                        onPress={() => handleEditProduct(prod)}
                        style={[
                          styles.gitTableRow,
                          !isLast && { borderBottomWidth: 1, borderBottomColor: gitColors.border },
                          { backgroundColor: gitColors.canvas },
                        ]}
                      >
                        {/* Thumbnail with 4px border radius and 1px border */}
                        <Image
                          source={{ uri: prod.imageUrl }}
                          style={[styles.gitThumb, { borderColor: gitColors.border }]}
                          resizeMode="cover"
                        />

                        {/* Main Item Column */}
                        <View style={styles.gitItemBody}>
                          {/* Title + Status Labels Row */}
                          <View style={styles.gitTitleRow}>
                            <Text
                              style={[styles.gitProductTitle, { color: gitColors.textLink }]}
                              numberOfLines={1}
                            >
                              {prod.name}
                            </Text>

                            {/* GitHub Status Label */}
                            <View
                              style={[
                                styles.gitStatusLabel,
                                isLowStock
                                  ? {
                                      backgroundColor: gitColors.labelYellowBg,
                                      borderColor: gitColors.labelYellowBorder,
                                    }
                                  : {
                                      backgroundColor: gitColors.labelGreenBg,
                                      borderColor: gitColors.labelGreenBorder,
                                    },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.gitStatusLabelText,
                                  { color: isLowStock ? gitColors.labelYellowText : gitColors.labelGreenText },
                                ]}
                              >
                                {isLowStock ? `low stock: ${prod.stockQuantity || 0}` : 'in stock'}
                              </Text>
                            </View>
                          </View>

                          {/* GitHub Metadata Subtitle (SKU · Brand · Warehouse · Stock) */}
                          <View style={styles.gitMetaRow}>
                            <Text style={[styles.gitMetaCode, { color: gitColors.textSecondary }]}>
                              #{prod.sku || `ND-${prod.id.slice(0, 6).toUpperCase()}`}
                            </Text>
                            <Text style={[styles.gitDot, { color: gitColors.textSecondary }]}>•</Text>
                            <Text style={[styles.gitMetaText, { color: gitColors.textSecondary }]}>
                              {prod.brand || 'Verified Brand'}
                            </Text>
                            <Text style={[styles.gitDot, { color: gitColors.textSecondary }]}>•</Text>
                            <Text style={[styles.gitMetaText, { color: gitColors.textSecondary }]}>
                              📍 {prod.warehouseLoc || 'Uganda Central'}
                            </Text>
                            <Text style={[styles.gitDot, { color: gitColors.textSecondary }]}>•</Text>
                            <Text style={[styles.gitMetaText, { color: gitColors.textSecondary }]}>
                              {(prod.stockQuantity || 100).toLocaleString()} units ready
                            </Text>
                          </View>
                        </View>

                        {/* Right: Price & GitHub Edit Action Button */}
                        <View style={styles.gitPriceActionCol}>
                          <View style={styles.gitPriceWrap}>
                            <Text style={[styles.gitPriceText, { color: gitColors.textPrimary }]}>
                              UGX {basePrice.toLocaleString()}
                              <Text style={[styles.gitUnitSub, { color: gitColors.textSecondary }]}> / unit</Text>
                            </Text>
                            {discountTier && (
                              <Text style={[styles.gitBulkText, { color: gitColors.textSecondary }]}>
                                {discountTier.minQuantity}+ @ UGX {discountTier.price.toLocaleString()}
                              </Text>
                            )}
                          </View>

                          {/* GitHub Action Button */}
                          <View
                            style={[
                              styles.gitEditButton,
                              { backgroundColor: gitColors.btnBg, borderColor: gitColors.btnBorder },
                            ]}
                          >
                            <MaterialIcon name="edit" size={13} color={gitColors.textPrimary} />
                            <Text style={[styles.gitEditButtonText, { color: gitColors.textPrimary }]}>Edit</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ))}
              </View>

              {/* ── Pagination Footer & Load More ── */}
              {activeTab !== 'incoming_orders' && (
                <View style={styles.paginationFooter}>
                  {isLoadingMore ? (
                    <View style={styles.loadingMoreRow}>
                      <ActivityIndicator size="small" color={gitColors.greenBtn} />
                      <Text style={[styles.loadingMoreText, { color: gitColors.textSecondary }]}>
                        Loading more wholesale listings...
                      </Text>
                    </View>
                  ) : hasMore && filteredProducts.length >= 15 ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.loadMoreBtn, { backgroundColor: gitColors.btnBg, borderColor: gitColors.btnBorder }]}
                      onPress={loadMore}
                    >
                      <MaterialIcon name="expand_more" size={16} color={gitColors.textPrimary} />
                      <Text style={[styles.loadMoreBtnText, { color: gitColors.textPrimary }]}>
                        Load More Products ({filteredProducts.length} loaded)
                      </Text>
                    </TouchableOpacity>
                  ) : filteredProducts.length > 0 ? (
                    <View style={styles.endOfFeedRow}>
                      <View style={[styles.endOfFeedLine, { backgroundColor: gitColors.borderMuted }]} />
                      <Text style={[styles.endOfFeedText, { color: gitColors.textSecondary }]}>
                        All {filteredProducts.length} listings loaded
                      </Text>
                      <View style={[styles.endOfFeedLine, { backgroundColor: gitColors.borderMuted }]} />
                    </View>
                  ) : null}
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
  // ── GitHub Top Header ──
  gitHeader: {
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  gitHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  gitBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  gitBackBtn: {
    marginRight: 2,
    padding: 2,
  },
  gitBreadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gitOrgText: {
    fontSize: 15,
    fontWeight: '400',
  },
  gitSlash: {
    fontSize: 15,
    fontWeight: '300',
  },
  gitRepoText: {
    fontSize: 15,
    fontWeight: '700',
  },
  gitPublicBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 4,
  },
  gitPublicBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  gitGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  gitGreenBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // ── GitHub Underline Tabs Bar ──
  gitTabsBar: {
    borderBottomWidth: 1,
  },
  gitTabsScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
  },
  gitTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1, // Sits right on the bottom line
  },
  gitTabItemSelected: {
    borderBottomWidth: 2,
  },
  gitTabLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  gitCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  gitCountPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // ── Loading ──
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  // ── Scroll & Table Box ──
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1080,
  },
  gitTableBox: {
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gitTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  gitTableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  gitTableHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  gitTableHeaderSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  gitTableHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gitSortLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // ── Table Rows ──
  gitTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  gitThumb: {
    width: 52,
    height: 52,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#0D1117',
  },
  gitItemBody: {
    flex: 1,
    justifyContent: 'center',
  },
  gitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  gitProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  gitStatusLabel: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 12,
    borderWidth: 1,
  },
  gitStatusLabelText: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  gitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  gitMetaCode: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gitDot: {
    fontSize: 11,
  },
  gitMetaText: {
    fontSize: 12,
    fontWeight: '400',
  },
  gitPriceActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gitPriceWrap: {
    alignItems: 'flex-end',
  },
  gitPriceText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  gitUnitSub: {
    fontSize: 11,
    fontWeight: '400',
  },
  gitBulkText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  gitEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  gitEditButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Empty State ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 360,
  },
  // ── Incoming Orders Styles ──
  gitOrderRow: {
    padding: 16,
    gap: 10,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderDateText: {
    fontSize: 11,
  },
  buyerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  buyerNameText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buyerPhoneText: {
    fontSize: 12,
  },
  buyerCityText: {
    fontSize: 12,
  },
  entriesList: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  entryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  entryQty: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  orderTotalText: {
    fontSize: 13,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paginationFooter: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingMoreText: {
    fontSize: 13,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  endOfFeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  endOfFeedLine: {
    flex: 1,
    height: 1,
  },
  endOfFeedText: {
    fontSize: 12,
  },
});
