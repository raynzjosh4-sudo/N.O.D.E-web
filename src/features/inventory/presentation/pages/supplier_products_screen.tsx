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
  Linking,
  TextInput,
  Modal,
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
import { buildSpecSheetPayload, makeAndOpenSpecSheetPdf } from '@/core/utils/pdf_spec_sheet';

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
      if (inspectedOrder && inspectedOrder.order_id === orderId) {
        setInspectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      // If completed, automatically deduct local inventory counts for immediate dashboard consistency
      if (newStatus.toLowerCase() === 'completed') {
        const completedOrder = incomingOrders.find((o) => o.order_id === orderId);
        if (completedOrder) {
          const entries = Array.isArray(completedOrder.entries_json) ? completedOrder.entries_json : [];
          setProducts((prev) =>
            prev.map((p) => {
              const matchedEntry = entries.find(
                (e: any) =>
                  (e.product_id && String(e.product_id) === String(p.id)) ||
                  (e.id && String(e.id) === String(p.id)) ||
                  (e.product?.id && String(e.product.id) === String(p.id))
              );
              if (matchedEntry) {
                const qtyDeducted = Number(matchedEntry.total_units || matchedEntry.quantity || 1);
                const currentStock = p.stockQuantity ?? 100;
                const newStock = Math.max(0, currentStock - qtyDeducted);
                return {
                  ...p,
                  stockQuantity: newStock,
                  status: newStock <= 10 ? 'low_stock' : p.status,
                };
              }
              return p;
            })
          );
        }
      }
    } catch (err: any) {
      console.warn('Update order status failed:', err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ── Enhanced Order Management Suite State ──
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'new' | 'processing' | 'completed' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [inspectedOrder, setInspectedOrder] = useState<any | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Compute status counts for incoming orders
  const orderCounts = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let cancelled = 0;
    incomingOrders.forEach((o) => {
      const s = (o.status || 'new').toLowerCase();
      if (s === 'new' || s === 'seen' || s === 'draft') pending++;
      else if (s === 'processing') processing++;
      else if (s === 'completed') completed++;
      else if (s === 'cancelled') cancelled++;
    });
    return { all: incomingOrders.length, pending, processing, completed, cancelled };
  }, [incomingOrders]);

  // Filtered incoming orders based on sub-tabs & search query
  const filteredIncomingOrders = useMemo(() => {
    return incomingOrders.filter((ord) => {
      const s = (ord.status || 'new').toLowerCase();
      if (orderStatusFilter === 'new') {
        if (s !== 'new' && s !== 'seen' && s !== 'draft') return false;
      } else if (orderStatusFilter === 'processing') {
        if (s !== 'processing') return false;
      } else if (orderStatusFilter === 'completed') {
        if (s !== 'completed') return false;
      } else if (orderStatusFilter === 'cancelled') {
        if (s !== 'cancelled') return false;
      }

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const idMatch = (ord.order_id || '').toLowerCase().includes(q);
        const nameMatch = (ord.business_name || '').toLowerCase().includes(q);
        const phoneMatch = (ord.business_phone || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [incomingOrders, orderStatusFilter, orderSearchQuery]);

  const handleCallBuyer = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };

  const handleWhatsAppBuyer = (phone: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${clean}`);
  };

  const handleViewOrderPdf = async (ord: any) => {
    setIsGeneratingPdf(true);
    try {
      const entries = Array.isArray(ord.entries_json) ? ord.entries_json : [];
      const payload = buildSpecSheetPayload({
        orderId: ord.order_id,
        title: `Order ${ord.order_id} Spec Sheet`,
        items: entries.map((item: any) => ({
          product: {
            id: item.product_id || item.id || 'N/A',
            name: item.name || item.product_name || 'Wholesale Product',
            brand: item.brand || 'N.O.D.E.',
            sku: item.sku || 'SKU-N/A',
            srp: item.unit_price || 0,
            imageUrl: item.imageUrl || item.image_url,
            supplierName: user?.legalBusinessName || user?.name || 'Verified Supplier',
            supplierPhone: (user as any)?.phone || '+256 700 000 000',
            warehouseLoc: 'Uganda Fulfillment Depot',
          } as unknown as Product,
          groups: item.confirmedGroups || [{
            color: { label: item.color || 'Standard', color: item.colorHex || '#12BBF0' },
            sizeQtys: item.size_quantities || { 'Std': item.total_units || 1 },
          }],
          unitPrice: item.unit_price || 0,
        })),
        buyerProfile: {
          fullName: ord.business_name || 'Wholesale Buyer',
          phone: ord.business_phone || '',
          warehouseAddress: ord.business_address || ord.business_city || 'Kampala Wholesale Hub',
        },
        isAuthenticated: true,
      });

      await makeAndOpenSpecSheetPdf(payload);
    } catch (e: any) {
      console.warn('PDF export error:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleVerifyCodeSubmit = async () => {
    const raw = verifyCodeInput.trim().toUpperCase();
    if (!raw) return;

    const matched = incomingOrders.find((o) => {
      const id = (o.order_id || '').toUpperCase();
      return id === raw || id.replace(/[^A-Z0-9]/g, '') === raw.replace(/[^A-Z0-9]/g, '');
    });

    if (matched) {
      await handleUpdateStatus(matched.order_id, 'completed');
      setVerifyFeedback({
        success: true,
        message: `Order #${matched.order_id} cleared & verified successfully!`,
      });
      setTimeout(() => {
        setIsVerifyModalOpen(false);
        setVerifyCodeInput('');
        setVerifyFeedback(null);
      }, 1500);
    } else {
      setVerifyFeedback({
        success: false,
        message: `No active order found matching clearance token "${raw}".`,
      });
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
                  <View style={{ width: '100%' }}>
                    {/* 1. Order Suite Search & Verify Code Bar */}
                    <View
                      style={[
                        styles.orderToolbar,
                        {
                          backgroundColor: gitColors.canvasSubtle,
                          borderBottomWidth: 1,
                          borderBottomColor: gitColors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.orderSearchBox,
                          {
                            backgroundColor: gitColors.canvas,
                            borderColor: gitColors.border,
                          },
                        ]}
                      >
                        <MaterialIcon name="search" size={16} color={gitColors.textSecondary} />
                        <TextInput
                          value={orderSearchQuery}
                          onChangeText={setOrderSearchQuery}
                          placeholder="Search orders by ID, buyer name, or phone..."
                          placeholderTextColor={gitColors.textSecondary}
                          style={[styles.orderSearchInput, { color: gitColors.textPrimary }]}
                        />
                        {orderSearchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setOrderSearchQuery('')}>
                            <MaterialIcon name="close" size={16} color={gitColors.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setVerifyCodeInput('');
                          setVerifyFeedback(null);
                          setIsVerifyModalOpen(true);
                        }}
                        style={[
                          styles.verifyTokenBtn,
                          {
                            backgroundColor: gitColors.greenBtn,
                            borderColor: gitColors.border,
                          },
                        ]}
                      >
                        <MaterialIcon name="qr_code_scanner" size={15} color="#FFFFFF" />
                        <Text style={styles.verifyTokenBtnText}>Verify Clearance Code</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 2. Order Pipeline Filter Tabs */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.pipelineTabsScroll}
                    >
                      {[
                        { key: 'all', label: 'All Orders', count: incomingOrders.length },
                        {
                          key: 'new',
                          label: 'Pending / New',
                          count: incomingOrders.filter((o) =>
                            ['new', 'seen', 'pending', 'submitted'].includes((o.status || '').toLowerCase())
                          ).length,
                        },
                        {
                          key: 'processing',
                          label: 'Processing',
                          count: incomingOrders.filter(
                            (o) => (o.status || '').toLowerCase() === 'processing'
                          ).length,
                        },
                        {
                          key: 'completed',
                          label: 'Delivered & Cleared',
                          count: incomingOrders.filter(
                            (o) => (o.status || '').toLowerCase() === 'completed'
                          ).length,
                        },
                        {
                          key: 'cancelled',
                          label: 'Declined',
                          count: incomingOrders.filter(
                            (o) => (o.status || '').toLowerCase() === 'cancelled'
                          ).length,
                        },
                      ].map((tab) => {
                        const isSelected = orderStatusFilter === tab.key;
                        return (
                          <TouchableOpacity
                            key={tab.key}
                            onPress={() => setOrderStatusFilter(tab.key as any)}
                            activeOpacity={0.7}
                            style={[
                              styles.pipelineTabPill,
                              {
                                backgroundColor: isSelected ? gitColors.btnBg : 'transparent',
                                borderColor: isSelected ? gitColors.border : 'transparent',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pipelineTabText,
                                {
                                  color: isSelected ? gitColors.textPrimary : gitColors.textSecondary,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                            >
                              {tab.label}
                            </Text>
                            <View
                              style={[
                                styles.pipelineCountBadge,
                                {
                                  backgroundColor: isSelected
                                    ? gitColors.canvasSubtle
                                    : gitColors.borderMuted,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pipelineCountText,
                                  { color: isSelected ? gitColors.textLink : gitColors.textSecondary },
                                ]}
                              >
                                {tab.count}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* 3. Orders List or Empty / Loading */}
                    {isLoadingOrders ? (
                      <View style={{ padding: 16, gap: 12 }}>
                        {[1, 2, 3, 4].map((k) => (
                          <View
                            key={k}
                            style={{
                              height: 100,
                              borderRadius: 6,
                              backgroundColor: gitColors.canvasSubtle,
                              borderWidth: 1,
                              borderColor: gitColors.border,
                              opacity: 0.6,
                            }}
                          />
                        ))}
                      </View>
                    ) : filteredIncomingOrders.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <MaterialIcon name="inbox" size={48} color={gitColors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: gitColors.textPrimary }]}>
                          No wholesale orders found.
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: gitColors.textSecondary }]}>
                          {orderSearchQuery || orderStatusFilter !== 'all'
                            ? 'No incoming orders matched your search or status filter.'
                            : 'Orders placed by verified retail buyers for your products will appear here for processing and fulfillment.'}
                        </Text>
                        {(orderSearchQuery || orderStatusFilter !== 'all') && (
                          <TouchableOpacity
                            onPress={() => {
                              setOrderSearchQuery('');
                              setOrderStatusFilter('all');
                            }}
                            style={[
                              styles.actionBtn,
                              {
                                borderColor: gitColors.border,
                                backgroundColor: gitColors.btnBg,
                                marginTop: 12,
                              },
                            ]}
                          >
                            <Text style={[styles.actionBtnText, { color: gitColors.textLink }]}>
                              Clear Filter &amp; Search
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      filteredIncomingOrders.map((ord, idx) => {
                        const isLast = idx === filteredIncomingOrders.length - 1;
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

                        const totalUnits = entries.reduce((acc: number, item: any) => {
                          const u = Number(item.total_units || item.quantity || 1);
                          return acc + u;
                        }, 0);

                        return (
                          <View
                            key={ord.order_id || idx}
                            style={[
                              styles.gitOrderRow,
                              !isLast && { borderBottomWidth: 1, borderBottomColor: gitColors.border },
                              { backgroundColor: gitColors.canvas },
                            ]}
                          >
                            {/* Card Top: Order ID + Status + Date */}
                            <View style={styles.orderHeaderRow}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Text style={[styles.orderIdText, { color: gitColors.textLink }]}>
                                  #{ord.order_id}
                                </Text>
                                <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                  <Text style={[styles.statusPillText, { color: statusColor }]}>
                                    {status.toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.orderDateText, { color: gitColors.textSecondary }]}>
                                {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : ''}
                              </Text>
                            </View>

                            {/* Buyer Contact Card with Instant Call & WhatsApp */}
                            <View
                              style={[
                                styles.buyerCard,
                                {
                                  backgroundColor: gitColors.canvasSubtle,
                                  borderColor: gitColors.border,
                                },
                              ]}
                            >
                              <View style={{ flex: 1, minWidth: 180 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcon name="storefront" size={16} color={gitColors.textLink} />
                                  <Text style={[styles.buyerNameText, { color: gitColors.textPrimary }]}>
                                    {ord.business_name || 'Wholesale Buyer'}
                                  </Text>
                                </View>
                                <Text style={[styles.buyerMetaText, { color: gitColors.textSecondary, marginTop: 2 }]}>
                                  📍 {ord.business_address || ord.business_city || 'Kampala Wholesale Hub'}
                                  {ord.business_phone ? ` • 📞 ${ord.business_phone}` : ''}
                                </Text>
                              </View>

                              {ord.business_phone ? (
                                <View style={styles.buyerActionGroup}>
                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => handleCallBuyer(ord.business_phone)}
                                    style={[
                                      styles.buyerQuickBtn,
                                      {
                                        backgroundColor: gitColors.btnBg,
                                        borderColor: gitColors.border,
                                      },
                                    ]}
                                  >
                                    <MaterialIcon name="call" size={13} color={gitColors.textPrimary} />
                                    <Text style={[styles.buyerQuickBtnText, { color: gitColors.textPrimary }]}>
                                      Call
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => handleWhatsAppBuyer(ord.business_phone)}
                                    style={[
                                      styles.buyerQuickBtn,
                                      {
                                        backgroundColor: '#25D36622',
                                        borderColor: '#25D36666',
                                      },
                                    ]}
                                  >
                                    <MaterialIcon name="chat" size={13} color="#25D366" />
                                    <Text style={[styles.buyerQuickBtnText, { color: '#25D366' }]}>
                                      WhatsApp
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ) : null}
                            </View>

                            {/* Line Items Table with Thumbnails & Color Swatches */}
                            {entries.length > 0 && (
                              <View
                                style={[
                                  styles.entriesList,
                                  {
                                    backgroundColor: gitColors.canvasSubtle,
                                    borderColor: gitColors.border,
                                  },
                                ]}
                              >
                                {entries.map((item: any, eIdx: number) => {
                                  const imgUrl = item.imageUrl || item.image_url;
                                  const cHex = item.colorHex || (item.color?.color) || '#12BBF0';
                                  const cName = item.colorName || (item.color?.label) || item.color || 'Standard';
                                  const itemUnits = item.total_units || item.quantity || 1;
                                  const itemPrice = item.unit_price || 0;

                                  return (
                                    <View
                                      key={eIdx}
                                      style={[
                                        styles.entryLine,
                                        eIdx < entries.length - 1 && {
                                          borderBottomWidth: 1,
                                          borderBottomColor: gitColors.borderMuted,
                                        },
                                      ]}
                                    >
                                      {/* Thumbnail */}
                                      <View
                                        style={[
                                          styles.entryThumbWrap,
                                          {
                                            backgroundColor: gitColors.canvas,
                                            borderColor: gitColors.border,
                                          },
                                        ]}
                                      >
                                        {imgUrl ? (
                                          <Image
                                            source={{ uri: imgUrl }}
                                            style={styles.entryThumbImage}
                                            resizeMode="cover"
                                          />
                                        ) : (
                                          <MaterialIcon name="inventory_2" size={16} color={gitColors.textSecondary} />
                                        )}
                                      </View>

                                      {/* Info */}
                                      <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text
                                          style={[styles.entryName, { color: gitColors.textPrimary }]}
                                          numberOfLines={1}
                                        >
                                          {item.name || item.product_name || 'Wholesale Product'}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                          <View
                                            style={[
                                              styles.entryColorSwatch,
                                              { backgroundColor: cHex },
                                            ]}
                                          />
                                          <Text style={[styles.entryColorLabel, { color: gitColors.textSecondary }]}>
                                            {cName}
                                          </Text>
                                        </View>
                                      </View>

                                      {/* Quantities & Price */}
                                      <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.entryQtyBold, { color: gitColors.textPrimary }]}>
                                          {itemUnits.toLocaleString()} units
                                        </Text>
                                        {itemPrice > 0 && (
                                          <Text style={[styles.entrySubPrice, { color: gitColors.textSecondary }]}>
                                            @ UGX {itemPrice.toLocaleString()}
                                          </Text>
                                        )}
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            )}

                            {/* Card Footer: Totals & Wholesale Action Pipeline */}
                            <View style={styles.orderFooterRow}>
                              <View>
                                <Text style={[styles.orderTotalText, { color: gitColors.textPrimary }]}>
                                  Total:{' '}
                                  <Text style={{ color: gitColors.textLink, fontWeight: '700', fontSize: 14 }}>
                                    UGX {(ord.total_amount || 0).toLocaleString()}
                                  </Text>
                                </Text>
                                <Text style={[styles.orderUnitsSummary, { color: gitColors.textSecondary }]}>
                                  {totalUnits} units total across {entries.length} items
                                </Text>
                              </View>

                              <View style={styles.orderActionsRow}>
                                {/* Download / View PDF Spec Sheet */}
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => handleViewOrderPdf(ord)}
                                  disabled={isGeneratingPdf}
                                  style={[
                                    styles.actionBtn,
                                    {
                                      borderColor: gitColors.border,
                                      backgroundColor: gitColors.btnBg,
                                    },
                                  ]}
                                >
                                  <MaterialIcon name="picture_as_pdf" size={14} color="#E056FD" />
                                  <Text style={[styles.actionBtnText, { color: gitColors.textPrimary }]}>
                                    PDF
                                  </Text>
                                </TouchableOpacity>

                                {/* Inspect Order Details */}
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => setInspectedOrder(ord)}
                                  style={[
                                    styles.actionBtn,
                                    {
                                      borderColor: gitColors.border,
                                      backgroundColor: gitColors.btnBg,
                                    },
                                  ]}
                                >
                                  <MaterialIcon name="visibility" size={14} color={gitColors.textLink} />
                                  <Text style={[styles.actionBtnText, { color: gitColors.textLink }]}>
                                    Inspect
                                  </Text>
                                </TouchableOpacity>

                                {/* Pipeline status controls */}
                                {status === 'new' && (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    disabled={isUpdating}
                                    onPress={() => handleUpdateStatus(ord.order_id, 'seen')}
                                    style={[
                                      styles.actionBtn,
                                      {
                                        borderColor: gitColors.border,
                                        backgroundColor: gitColors.btnBg,
                                      },
                                    ]}
                                  >
                                    <MaterialIcon name="check" size={14} color={gitColors.textLink} />
                                    <Text style={[styles.actionBtnText, { color: gitColors.textLink }]}>
                                      Mark Seen
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                {(status === 'new' || status === 'seen') && (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    disabled={isUpdating}
                                    onPress={() => handleUpdateStatus(ord.order_id, 'processing')}
                                    style={[
                                      styles.actionBtn,
                                      {
                                        borderColor: gitColors.border,
                                        backgroundColor: gitColors.btnBg,
                                      },
                                    ]}
                                  >
                                    <MaterialIcon name="conveyor_belt" size={14} color={gitColors.labelYellowText} />
                                    <Text style={[styles.actionBtnText, { color: gitColors.labelYellowText }]}>
                                      Process
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                {status === 'processing' && (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    disabled={isUpdating}
                                    onPress={() => handleUpdateStatus(ord.order_id, 'completed')}
                                    style={[
                                      styles.actionBtn,
                                      {
                                        borderColor: gitColors.border,
                                        backgroundColor: gitColors.greenBtn,
                                      },
                                    ]}
                                  >
                                    <MaterialIcon name="check_circle" size={14} color="#FFFFFF" />
                                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                                      Complete
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                {status !== 'completed' && status !== 'cancelled' && (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    disabled={isUpdating}
                                    onPress={() => handleUpdateStatus(ord.order_id, 'cancelled')}
                                    style={[
                                      styles.actionBtn,
                                      {
                                        borderColor: gitColors.border,
                                        backgroundColor: gitColors.btnBg,
                                      },
                                    ]}
                                  >
                                    <MaterialIcon name="close" size={14} color="#D32F2F" />
                                    <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>
                                      Decline
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
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

      {/* ── Order Inspection Modal ── */}
      <Modal
        visible={!!inspectedOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: gitColors.canvas, borderColor: gitColors.border }]}>
            {inspectedOrder && (
              <>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: gitColors.border }]}>
                  <View>
                    <Text style={[styles.modalHeaderTitle, { color: gitColors.textPrimary }]}>
                      Order #{inspectedOrder.order_id}
                    </Text>
                    <Text style={[styles.modalHeaderSub, { color: gitColors.textSecondary }]}>
                      Received on {inspectedOrder.created_at ? new Date(inspectedOrder.created_at).toLocaleString() : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setInspectedOrder(null)}
                    style={[styles.modalCloseBtn, { backgroundColor: gitColors.canvasSubtle }]}
                  >
                    <MaterialIcon name="close" size={18} color={gitColors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Modal Body */}
                <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
                  {/* Buyer Section */}
                  <View style={[styles.modalSectionBox, { backgroundColor: gitColors.canvasSubtle, borderColor: gitColors.border }]}>
                    <Text style={[styles.modalSectionLabel, { color: gitColors.textSecondary }]}>
                      RETAIL BUYER PROFILE
                    </Text>
                    <Text style={[styles.modalBuyerName, { color: gitColors.textPrimary }]}>
                      {inspectedOrder.business_name || 'Wholesale Buyer'}
                    </Text>
                    <Text style={[styles.modalBuyerMeta, { color: gitColors.textSecondary }]}>
                      📍 {inspectedOrder.business_address || inspectedOrder.business_city || 'Kampala Wholesale Hub'}
                    </Text>
                    {inspectedOrder.business_phone ? (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleCallBuyer(inspectedOrder.business_phone)}
                          style={[styles.modalActionPill, { backgroundColor: gitColors.btnBg, borderColor: gitColors.border }]}
                        >
                          <MaterialIcon name="call" size={14} color={gitColors.textPrimary} />
                          <Text style={[styles.modalActionPillText, { color: gitColors.textPrimary }]}>
                            {inspectedOrder.business_phone}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleWhatsAppBuyer(inspectedOrder.business_phone)}
                          style={[styles.modalActionPill, { backgroundColor: '#25D36622', borderColor: '#25D36666' }]}
                        >
                          <MaterialIcon name="chat" size={14} color="#25D366" />
                          <Text style={[styles.modalActionPillText, { color: '#25D366' }]}>
                            WhatsApp
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>

                  {/* Line Items */}
                  <View>
                    <Text style={[styles.modalSectionLabel, { color: gitColors.textSecondary, marginBottom: 8 }]}>
                      ORDER SPECIFICATIONS &amp; QUANTITIES
                    </Text>
                    {(Array.isArray(inspectedOrder.entries_json) ? inspectedOrder.entries_json : []).map((item: any, iIdx: number) => {
                      const img = item.imageUrl || item.image_url;
                      const cHex = item.colorHex || (item.color?.color) || '#12BBF0';
                      const cName = item.colorName || (item.color?.label) || item.color || 'Standard';
                      const units = item.total_units || item.quantity || 1;
                      const price = item.unit_price || 0;

                      return (
                        <View
                          key={iIdx}
                          style={[
                            styles.modalItemRow,
                            { backgroundColor: gitColors.canvasSubtle, borderColor: gitColors.border },
                          ]}
                        >
                          {img ? (
                            <Image source={{ uri: img }} style={styles.modalItemThumb} resizeMode="cover" />
                          ) : (
                            <View style={[styles.modalItemThumb, { backgroundColor: gitColors.canvas, alignItems: 'center', justifyContent: 'center' }]}>
                              <MaterialIcon name="inventory_2" size={18} color={gitColors.textSecondary} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.modalItemTitle, { color: gitColors.textPrimary }]}>
                              {item.name || item.product_name || 'Wholesale Product'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <View style={[styles.entryColorSwatch, { backgroundColor: cHex }]} />
                              <Text style={[styles.entryColorLabel, { color: gitColors.textSecondary }]}>
                                {cName}
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.entryQtyBold, { color: gitColors.textPrimary }]}>
                              {units.toLocaleString()} units
                            </Text>
                            {price > 0 && (
                              <Text style={[styles.entrySubPrice, { color: gitColors.textSecondary }]}>
                                UGX {(units * price).toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Total Amount */}
                  <View style={[styles.modalTotalBox, { backgroundColor: gitColors.canvasSubtle, borderColor: gitColors.border }]}>
                    <Text style={[styles.modalTotalLabel, { color: gitColors.textSecondary }]}>
                      TOTAL WHOLESALE SETTLEMENT:
                    </Text>
                    <Text style={[styles.modalTotalVal, { color: gitColors.textLink }]}>
                      UGX {(inspectedOrder.total_amount || 0).toLocaleString()}
                    </Text>
                  </View>
                </ScrollView>

                {/* Modal Footer Actions */}
                <View style={[styles.modalFooter, { borderTopColor: gitColors.border }]}>
                  <TouchableOpacity
                    onPress={() => handleViewOrderPdf(inspectedOrder)}
                    disabled={isGeneratingPdf}
                    style={[styles.modalFooterBtn, { backgroundColor: gitColors.btnBg, borderColor: gitColors.border }]}
                  >
                    <MaterialIcon name="picture_as_pdf" size={16} color="#E056FD" />
                    <Text style={[styles.modalFooterBtnText, { color: gitColors.textPrimary }]}>
                      Download Official Spec Sheet PDF
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {inspectedOrder.status !== 'completed' && inspectedOrder.status !== 'cancelled' && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(inspectedOrder.order_id, 'completed')}
                        style={[styles.modalFooterBtn, { flex: 1, backgroundColor: gitColors.greenBtn, borderColor: gitColors.border }]}
                      >
                        <MaterialIcon name="check_circle" size={15} color="#FFFFFF" />
                        <Text style={[styles.modalFooterBtnText, { color: '#FFFFFF' }]}>
                          Fulfill &amp; Complete Order
                        </Text>
                      </TouchableOpacity>
                    )}
                    {inspectedOrder.status !== 'cancelled' && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(inspectedOrder.order_id, 'cancelled')}
                        style={[styles.modalFooterBtn, { backgroundColor: gitColors.btnBg, borderColor: '#D32F2F55' }]}
                      >
                        <MaterialIcon name="close" size={15} color="#D32F2F" />
                        <Text style={[styles.modalFooterBtnText, { color: '#D32F2F' }]}>
                          Decline
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Verify Clearance Code Modal ── */}
      <Modal
        visible={isVerifyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVerifyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { maxWidth: 440, backgroundColor: gitColors.canvas, borderColor: gitColors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: gitColors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcon name="verified" size={20} color={gitColors.greenBtn} />
                <Text style={[styles.modalHeaderTitle, { color: gitColors.textPrimary }]}>
                  Verify Order Clearance Code
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsVerifyModalOpen(false)}
                style={[styles.modalCloseBtn, { backgroundColor: gitColors.canvasSubtle }]}
              >
                <MaterialIcon name="close" size={18} color={gitColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18, gap: 14 }}>
              <Text style={[styles.verifyDescription, { color: gitColors.textSecondary }]}>
                Enter the clearance token or Order ID from the buyer’s official N.O.D.E. PDF Spec Sheet to instantly verify, release goods, and mark order as completed.
              </Text>

              <View style={[styles.verifyInputWrap, { backgroundColor: gitColors.canvasSubtle, borderColor: gitColors.border }]}>
                <MaterialIcon name="qr_code" size={18} color={gitColors.textSecondary} />
                <TextInput
                  value={verifyCodeInput}
                  onChangeText={setVerifyCodeInput}
                  placeholder="e.g. ORD-20261126-7890"
                  placeholderTextColor={gitColors.textSecondary}
                  style={[styles.verifyInput, { color: gitColors.textPrimary }]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              {verifyFeedback && (
                <View
                  style={[
                    styles.verifyFeedbackBox,
                    {
                      backgroundColor: verifyFeedback.success ? 'rgba(46, 160, 67, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                      borderColor: verifyFeedback.success ? gitColors.labelGreenText : '#D32F2F',
                    },
                  ]}
                >
                  <MaterialIcon
                    name={verifyFeedback.success ? 'check_circle' : 'error'}
                    size={16}
                    color={verifyFeedback.success ? gitColors.labelGreenText : '#D32F2F'}
                  />
                  <Text
                    style={[
                      styles.verifyFeedbackText,
                      { color: verifyFeedback.success ? gitColors.labelGreenText : '#D32F2F' },
                    ]}
                  >
                    {verifyFeedback.message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleVerifyCodeSubmit}
                style={[styles.verifySubmitBtn, { backgroundColor: gitColors.greenBtn }]}
              >
                <MaterialIcon name="check" size={16} color="#FFFFFF" />
                <Text style={styles.verifySubmitBtnText}>Verify &amp; Clear Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 14,
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
    marginRight: 8,
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
    flexShrink: 0,
  },
  gitPriceWrap: {
    alignItems: 'flex-end',
    minWidth: 80,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  // ── Incoming Wholesale Orders Suite Styles ──
  orderToolbar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  orderSearchBox: {
    flex: 1,
    minWidth: 220,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  orderSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  verifyTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifyTokenBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pipelineTabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  pipelineTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pipelineTabText: {
    fontSize: 12,
  },
  pipelineCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pipelineCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gitOrderRow: {
    padding: 16,
    gap: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderDateText: {
    fontSize: 11,
  },
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  buyerNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  buyerMetaText: {
    fontSize: 11,
  },
  buyerActionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  buyerQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  buyerQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entriesList: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  entryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  entryThumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryThumbImage: {
    width: '100%',
    height: '100%',
  },
  entryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryColorSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  entryColorLabel: {
    fontSize: 11,
  },
  entryQtyBold: {
    fontSize: 12,
    fontWeight: '700',
  },
  entrySubPrice: {
    fontSize: 10,
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
  orderUnitsSummary: {
    fontSize: 11,
    marginTop: 1,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
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
  // ── Modals: Inspection & Code Verification ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalHeaderSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionBox: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalBuyerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalBuyerMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  modalActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalActionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  modalItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  modalItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalTotalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalTotalVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
  },
  modalFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  verifyDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  verifyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
  },
  verifyInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: 0,
  },
  verifyFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifyFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  verifySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 6,
  },
  verifySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
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
