
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { fetchAuthorizedPdfAndOpen } from '@/core/utils/pdf_spec_sheet';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { NodeIcon } from '@/core/widgets/node_icon';
import { useToast } from '@/core/widgets/whatsapp_dialog';
import {
  MOCK_USER_PROFILE,
  MOCK_SAVED_ITEMS,
  MOCK_DRAFT_ORDERS,
  MOCK_PENDING_ORDERS,
  MOCK_SENT_ORDERS,
  MOCK_PDF_DOCUMENTS,
  SavedProductItem,
  DraftOrder,
  WholesaleOrderItem,
  PdfDocumentItem,
  UserProfile,
} from '../../domain/entities/profile_models';
import { ProfileHeader } from '../widgets/profile_header';
import { ProfileTabs, ProfileTabKey } from '../widgets/profile_tabs';
import { SavedTab } from '../widgets/saved_tab';
import { DraftsTab } from '../widgets/drafts_tab';
import { PendingOrdersTab } from '../widgets/pending_orders_tab';
import { SentOrdersTab } from '../widgets/sent_orders_tab';
import { PdfTab } from '../widgets/pdf_tab';
import { SettingsTab } from '../widgets/settings_tab';
import { BecomeSupplierSheet } from '../widgets/become_supplier_sheet';
import { useAuth } from '@/features/auth/context/auth_context';
import { ProfileApiService } from '../../data/services/profile_api_service';
import { ProfileTabShimmer } from './shimmer/profile_shimmer';

export function ProfilePage() {
  const router = useAppNavigation();
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { user, isAuthenticated, signOut, getToken } = useAuth();
  const [showBecomeSupplierModal, setShowBecomeSupplierModal] = useState(false);

  // ── GitHub Primer Design System ──
  const gitColors = {
    canvas: isDark ? '#0D1117' : '#FFFFFF',
    canvasSubtle: isDark ? '#161B22' : '#F6F8FA',
    border: isDark ? '#30363D' : '#D0D7DE',
    textPrimary: isDark ? '#E6EDF3' : '#1F2328',
    textSecondary: isDark ? '#848D97' : '#656D76',
    textLink: isDark ? '#58A6FF' : '#0969DA',
    btnBg: isDark ? '#21262D' : '#F6F8FA',
    btnBorder: isDark ? '#30363D' : '#D0D7DE',
    activeNavBg: isDark ? 'rgba(177, 186, 196, 0.12)' : '#F6F8FA',
    activeNavBorder: '#FD8C73', // GitHub signature active border indicator
    badgeBg: isDark ? '#30363D' : 'rgba(175, 184, 193, 0.2)',
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('saved');

  // State collections
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...MOCK_USER_PROFILE,
    id: user?.id || '',
    fullName: user?.name || 'Verified Member',
    legalBusinessName: user?.legalBusinessName || 'Enterprise Account',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl,
  }));
  const [savedItems, setSavedItems] = useState<SavedProductItem[]>([]);
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<WholesaleOrderItem[]>([]);
  const [sentOrders, setSentOrders] = useState<WholesaleOrderItem[]>([]);
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocumentItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const { showInfo, showSuccess, showWarning, showToast } = useToast();

  // Load real profile, saved items, drafts, and orders from database
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        id: user.id || prev.id,
        fullName: user.name || prev.fullName,
        legalBusinessName: user.legalBusinessName || prev.legalBusinessName,
        email: user.email || prev.email,
        avatarUrl: user.avatarUrl || prev.avatarUrl,
      }));
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const token = getToken();

    if (!token && !isAuthenticated) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    Promise.allSettled([
      ProfileApiService.getProfile(),
      ProfileApiService.getSavedItems(),
      ProfileApiService.getDraftOrders(),
      ProfileApiService.getSentOrders(),
    ]).then(([profileRes, savedRes, draftsRes, ordersRes]) => {
      if (!isMounted) return;

      if (profileRes.status === 'fulfilled') {
        setProfile((prev) => ({
          ...profileRes.value,
          avatarUrl: profileRes.value.avatarUrl || user?.avatarUrl || prev.avatarUrl,
        }));
      }
      if (savedRes.status === 'fulfilled') {
        setSavedItems(savedRes.value);
      }
      if (draftsRes.status === 'fulfilled') {
        setDrafts(draftsRes.value);
      }
      if (ordersRes.status === 'fulfilled') {
        setPendingOrders(ordersRes.value.pending);
        setSentOrders(ordersRes.value.sent);
        setPdfDocuments(ordersRes.value.pdfs);
      }
      setIsLoadingData(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id, isAuthenticated]);

  // Tab Handlers
  const handlePlaceOrder = (selected: SavedProductItem[]) => {
    if (selected.length === 1) {
      router.push(`/product/order/${selected[0].product.id}`);
    } else if (selected.length > 1) {
      const ids = selected.map((s) => s.product.id).join(',');
      router.push({
        pathname: '/product/multi-order' as any,
        params: { ids },
      });
    }
  };

  const handleDeleteSaved = async (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await ProfileApiService.removeSavedItem(id);
      showSuccess('Saved Item Removed', 'Item was removed from your wishlist.');
    } catch (e) {
      console.warn('Failed to delete saved item:', e);
    }
  };

  const handleDeleteMultipleSaved = async (ids: string[]) => {
    setSavedItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    try {
      await Promise.allSettled(ids.map((id) => ProfileApiService.removeSavedItem(id)));
      showSuccess('Items Removed', `${ids.length} items removed from your bag.`);
    } catch (e) {
      console.warn('Failed to delete multiple saved items:', e);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    try {
      await ProfileApiService.deleteDraftOrder(id);
      showSuccess('Draft Discarded', 'Order draft was removed.');
    } catch (e) {
      console.warn('Failed to delete draft:', e);
    }
  };

  const handleDeleteMultipleDrafts = async (ids: string[]) => {
    setDrafts((prev) => prev.filter((d) => !ids.includes(d.id)));
    try {
      await Promise.allSettled(ids.map((id) => ProfileApiService.deleteDraftOrder(id)));
      showSuccess('Drafts Removed', `${ids.length} drafts were deleted.`);
    } catch (e) {
      console.warn('Failed to delete multiple drafts:', e);
    }
  };

  const handleContinueDraft = (draft: DraftOrder) => {
    const entries = draft.entries || [];
    const productIds = Array.from(
      new Set(entries.map((e: any) => e.product_id || e.productId).filter(Boolean))
    );
    if (productIds.length > 1) {
      router.push(`/product/multi-order?ids=${productIds.join(',')}&draftId=${draft.id}` as any);
    } else if (productIds.length === 1) {
      router.push(`/product/order/${productIds[0]}?draftId=${draft.id}`);
    } else {
      router.push(`/product/order/${draft.id}?draftId=${draft.id}`);
    }
  };

  const handleOpenPdf = async (doc: any) => {
    const orderId = doc.orderNumber || doc.orderId || doc.id;
    const rawUrl = doc.downloadUrl || (orderId ? `/orders/${orderId}/pdf` : '');
    if (!rawUrl) {
      showToast({
        title: 'Document Unavailable',
        message: 'No PDF download link available for this record.',
        status: 'warning',
      });
      return;
    }

    const token = getToken();
    if (!token && !rawUrl.startsWith('http')) {
      showToast({
        title: 'Sign In Required',
        message: 'Please log in to access your official order invoices.',
        status: 'warning',
      });
      return;
    }

    showInfo('Document Downloading', `${doc.title || 'Order Spec Sheet'} is opening...`);

    try {
      await fetchAuthorizedPdfAndOpen({
        rawUrl,
        token,
        filename: `NODE_Order_${orderId || 'document'}.pdf`,
        title: doc.title || 'N.O.D.E. Order Invoice',
      });
    } catch (err: any) {
      showToast({
        title: 'Open Failed',
        message: err?.message || 'Could not open PDF viewer on your device.',
        status: 'error',
      });
    }
  };

  const handleLogout = () => {
    showToast({
      title: 'Sign Out of N.O.D.E.?',
      message: 'Tap "Log Out" below to sign out of your account.',
      status: 'warning',
      duration: 6000,
      actionLabel: 'Log Out',
      onAction: async () => {
        await signOut();
        router.replace('/');
      },
    });
  };

  // Desktop Navigation Items
  const SIDEBAR_ITEMS: { key: ProfileTabKey; label: string; icon: string; count?: number }[] = [
    { key: 'saved', label: 'Saved Items', icon: 'bookmark_border', count: savedItems.length },
    { key: 'drafts', label: 'Draft Orders', icon: 'edit_note', count: drafts.length },
    { key: 'pending', label: 'Pending Review', icon: 'hourglass_top', count: pendingOrders.length },
    { key: 'sent', label: 'Sent & Dispatched', icon: 'local_shipping', count: sentOrders.length },
    { key: 'pdf', label: 'PDF Documents', icon: 'picture_as_pdf', count: pdfDocuments.length },
    { key: 'settings', label: 'Settings & Security', icon: 'settings' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        {isDesktop ? (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* ── DESKTOP WHOLESALE DASHBOARD (2-COLUMN ARCHITECTURE) ────────── */
          /* ═══════════════════════════════════════════════════════════════════ */
          <View style={styles.desktopOuterWrapper}>
            {/* ── Top Bar with Breadcrumbs & Back to Catalog ── */}
            <View style={[styles.desktopTopNav, { borderBottomColor: gitColors.border }]}>
              {/* Breadcrumbs: plain text link style, no button box */}
              <View style={styles.desktopBreadcrumbs}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.safeGoBack('/')}>
                  <Text style={[styles.desktopBreadcrumbRoot, { color: gitColors.textLink }]}>N.O.D.E.</Text>
                </TouchableOpacity>
                <Text style={[styles.desktopBreadcrumbSeparator, { color: gitColors.textSecondary }]}>/</Text>
                <Text style={[styles.desktopBreadcrumbActive, { color: gitColors.textPrimary }]}>dashboard</Text>
              </View>
            </View>

            {/* ── Main Two-Column Layout ── */}
            <View style={styles.desktopDashboardRow}>
              {/* ── 1. LEFT SIDEBAR: PROFILE & NAVIGATION CARD ── */}
              <View style={[styles.desktopSidebarCard, { backgroundColor: colors.surface, borderColor: gitColors.border }]}>
                {/* Profile Identity — padded section */}
                <View style={[styles.sidebarProfileHeader, { padding: 16, borderBottomWidth: 1, borderBottomColor: gitColors.border }]}>
                  <View style={styles.desktopAvatarWrapper}>
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={styles.desktopAvatarImage}
                      resizeMode="cover"
                    />
                    <View style={styles.onlineStatusDot} />
                  </View>

                  <View style={styles.sidebarNameBlock}>
                    <View style={styles.sidebarNameRow}>
                      <Text style={[styles.sidebarFullName, { color: colors.onSurface }]}>{profile.fullName}</Text>
                      <MaterialIcon name="verified" size={16} color={AppColors.primary} />
                    </View>
                    <Text style={[styles.sidebarLegalName, { color: gitColors.textSecondary }]}>{profile.legalBusinessName}</Text>
                    <View style={styles.tinBadge}>
                      <Text style={styles.tinBadgeText}>{profile.taxId}</Text>
                    </View>
                  </View>
                </View>

                {/* Quick Stats Grid — flat row with dividers */}
                <View style={[styles.sidebarStatsGrid, { borderBottomWidth: 1, borderBottomColor: gitColors.border }]}>
                  <View style={styles.sidebarStatBox}>
                    <Text style={[styles.sidebarStatNum, { color: colors.onSurface }]}>{savedItems.length}</Text>
                    <Text style={[styles.sidebarStatLbl, { color: gitColors.textSecondary }]}>Saved Items</Text>
                  </View>
                  <View style={[styles.sidebarStatDivider, { backgroundColor: gitColors.border }]} />
                  <View style={styles.sidebarStatBox}>
                    <Text style={[styles.sidebarStatNum, { color: colors.onSurface }]}>{pendingOrders.length + sentOrders.length}</Text>
                    <Text style={[styles.sidebarStatLbl, { color: gitColors.textSecondary }]}>Total Orders</Text>
                  </View>
                  <View style={[styles.sidebarStatDivider, { backgroundColor: gitColors.border }]} />
                  <View style={styles.sidebarStatBox}>
                    <Text style={[styles.sidebarStatNum, { color: colors.onSurface }]}>Gold</Text>
                    <Text style={[styles.sidebarStatLbl, { color: gitColors.textSecondary }]}>Buyer Tier</Text>
                  </View>
                </View>

                {/* Sidebar Navigation Menu */}
                <View style={styles.sidebarNavList}>
                  {SIDEBAR_ITEMS.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.75}
                        style={[
                          styles.sidebarNavItem,
                          isActive && styles.sidebarNavItemActive,
                        ]}
                        onPress={() => setActiveTab(item.key)}
                      >
                        {/* Active left accent bar */}
                        {isActive && <View style={styles.sidebarNavActiveBar} />}
                        <View style={styles.sidebarNavLeft}>
                          <MaterialIcon
                            name={item.icon}
                            size={16}
                            color={isActive ? colors.primary : colors.onSurfaceMuted}
                          />
                          <Text
                            style={[
                              styles.sidebarNavLabel,
                              { color: isActive ? colors.onSurface : colors.onSurfaceMuted },
                              isActive && styles.sidebarNavLabelActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>

                        {item.count !== undefined && item.count > 0 && (
                          <View
                            style={[
                              styles.sidebarNavBadge,
                              isActive && styles.sidebarNavBadgeActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.sidebarNavBadgeText,
                                isActive && styles.sidebarNavBadgeTextActive,
                              ]}
                            >
                              {item.count}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Warehouse Location Info — flat line section */}
                <View style={[styles.sidebarLocationCard, { borderTopColor: gitColors.border, borderBottomColor: gitColors.border }]}>
                  <MaterialIcon name="warehouse" size={14} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sidebarLocTitle, { color: colors.primary }]}>Delivery Warehouse</Text>
                    <Text style={[styles.sidebarLocAddress, { color: gitColors.textSecondary }]} numberOfLines={1}>
                      {/* Strip emoji/garbage chars — show only printable ASCII + common chars */}
                      {profile.warehouseAddress
                        ? profile.warehouseAddress.replace(/[^\x20-\x7E\u00C0-\u024F,.\-\s]/g, '').trim() || 'East Africa'
                        : 'East Africa'}
                    </Text>
                  </View>
                </View>

                {/* Supplier Catalog or Become a Supplier CTA */}
                {(user?.role?.toLowerCase() === 'supplier' || user?.role?.toLowerCase() === 'admin') ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.sidebarSupplierBtn,
                      {
                        borderColor: gitColors.border,
                        borderTopWidth: 0,
                      },
                    ]}
                    onPress={() => router.push('/supplier-products')}
                  >
                    <MaterialIcon name="inventory_2" size={14} color={colors.primary} />
                    <Text style={[styles.sidebarSupplierText, { color: colors.primary }]}>
                      Supplier Catalog (Manage)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.sidebarSupplierBtn,
                      {
                        borderColor: gitColors.border,
                        borderTopWidth: 0,
                      },
                    ]}
                    onPress={() => setShowBecomeSupplierModal(true)}
                  >
                    <MaterialIcon name="storefront" size={14} color={colors.primary} />
                    <Text style={[styles.sidebarSupplierText, { color: colors.primary }]}>
                      Become a Supplier
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sign Out CTA */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.sidebarSignOutBtn, { borderTopColor: gitColors.border }]}
                  onPress={handleLogout}
                >
                  <MaterialIcon name="logout" size={14} color="#D32F2F" />
                  <Text style={styles.sidebarSignOutText}>Sign Out from N.O.D.E.</Text>
                </TouchableOpacity>
              </View>

              {/* ── 2. RIGHT CONTENT AREA: ACTIVE TAB VIEW ── */}
              <View style={[styles.desktopContentPane, { backgroundColor: colors.surface, borderColor: gitColors.border }]}>
                {/* Tab Header Banner */}
                <View style={[styles.desktopPaneHeader, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.desktopPaneTitle, { color: colors.onSurface }]}>
                    {activeTab === 'saved' && `Saved Items (${savedItems.length})`}
                    {activeTab === 'drafts' && `Draft Wholesale Orders (${drafts.length})`}
                    {activeTab === 'pending' && `Orders Pending Review (${pendingOrders.length})`}
                    {activeTab === 'sent' && `Sent & Completed Orders (${sentOrders.length})`}
                    {activeTab === 'pdf' && `Official PDF Invoices & Certificates (${pdfDocuments.length})`}
                    {activeTab === 'settings' && 'Account Settings & Trading Terms'}
                  </Text>
                  <Text style={[styles.desktopPaneSubtitle, { color: colors.onSurfaceMuted }]}>
                    {activeTab === 'saved' && 'Select items to place consolidated pallet and wholesale orders.'}
                    {activeTab === 'drafts' && 'Incomplete wholesale orders saved automatically.'}
                    {activeTab === 'pending' && 'Track orders awaiting distributor verification or escrow clearance.'}
                    {activeTab === 'sent' && 'Monitor in-transit freight, pallet tracking, and fulfilled consignments.'}
                    {activeTab === 'pdf' && 'Download certified invoices, proforma sheets, and UNBS QA documents.'}
                    {activeTab === 'settings' && 'Manage business profile, delivery points, and wholesale compliance.'}
                  </Text>
                </View>

                {/* Main Content Component with height fill */}
                <View style={styles.desktopPaneBody}>
                  {isLoadingData ? (
                    <ProfileTabShimmer />
                  ) : (
                    <>
                      {activeTab === 'saved' && (
                        <SavedTab
                          items={savedItems}
                          onPlaceOrder={handlePlaceOrder}
                          onDeleteItem={handleDeleteSaved}
                          onDeleteMultipleItems={handleDeleteMultipleSaved}
                          onProductClick={(pId) => router.push(`/product/${pId}`)}
                        />
                      )}

                      {activeTab === 'drafts' && (
                        <DraftsTab
                          drafts={drafts}
                          onContinueDraft={handleContinueDraft}
                          onDeleteDraft={handleDeleteDraft}
                          onDeleteMultipleDrafts={handleDeleteMultipleDrafts}
                        />
                      )}

                      {activeTab === 'pending' && (
                        <PendingOrdersTab
                          orders={pendingOrders}
                          onOrderPress={(o) => console.log('Pending order:', o.orderNumber)}
                          onDownloadInvoice={handleOpenPdf as any}
                        />
                      )}

                      {activeTab === 'sent' && (
                        <SentOrdersTab
                          orders={sentOrders}
                          onTrackOrder={(o) => console.log('Track order:', o.trackingNumber)}
                          onViewInvoice={handleOpenPdf as any}
                        />
                      )}

                      {activeTab === 'pdf' && (
                        <PdfTab
                          documents={pdfDocuments}
                          onOpenPdf={handleOpenPdf}
                        />
                      )}

                      {activeTab === 'settings' && (
                        <SettingsTab
                          profile={profile}
                          onUpdateProfile={setProfile}
                          onLogout={handleLogout}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* ── MOBILE LAYOUT (TOP HEADER & HORIZONTAL TABS) ────────────────── */
          /* ═══════════════════════════════════════════════════════════════════ */
          <View style={[styles.mobileOuterWrapper, { backgroundColor: colors.scaffoldBackground }]}>
            {/* Profile Header */}
            <ProfileHeader
              profile={profile}
              onBack={() => router.safeGoBack('/')}
            />

            {/* Mobile Supplier or Become Supplier Shortcut */}
            {(user?.role?.toLowerCase() === 'supplier' || user?.role?.toLowerCase() === 'admin') ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.mobileSupplierBtn,
                  {
                    backgroundColor: colors.primary + '18',
                    borderColor: colors.primary + '40',
                  },
                ]}
                onPress={() => router.push('/supplier-products')}
              >
                <View style={styles.mobileSupplierBtnLeft}>
                  <MaterialIcon name="inventory_2" size={18} color={colors.primary} />
                  <Text style={[styles.mobileSupplierBtnText, { color: colors.primary }]}>
                    Supplier Catalog (Manage Products)
                  </Text>
                </View>
                <MaterialIcon name="chevron_right" size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.mobileSupplierBtn,
                  {
                    backgroundColor: colors.primary + '18',
                    borderColor: colors.primary + '40',
                  },
                ]}
                onPress={() => setShowBecomeSupplierModal(true)}
              >
                <View style={styles.mobileSupplierBtnLeft}>
                  <MaterialIcon name="storefront" size={18} color={colors.primary} />
                  <Text style={[styles.mobileSupplierBtnText, { color: colors.primary }]}>
                    Apply to Become a Supplier
                  </Text>
                </View>
                <MaterialIcon name="chevron_right" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}

            {/* Horizontal Tabs */}
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              badgeCounts={{
                saved: savedItems.length,
                drafts: drafts.length,
                pending: pendingOrders.length,
                sent: sentOrders.length,
                pdf: pdfDocuments.length,
              }}
            />

            {/* Content View */}
            <View style={[styles.mobileTabContent, { backgroundColor: colors.scaffoldBackground }]}>
              {isLoadingData ? (
                <ProfileTabShimmer />
              ) : (
                <>
                  {activeTab === 'saved' && (
                    <SavedTab
                      items={savedItems}
                      onPlaceOrder={handlePlaceOrder}
                      onDeleteItem={handleDeleteSaved}
                      onDeleteMultipleItems={handleDeleteMultipleSaved}
                      onProductClick={(pId) => router.push(`/product/${pId}`)}
                    />
                  )}

                  {activeTab === 'drafts' && (
                    <DraftsTab
                      drafts={drafts}
                      onContinueDraft={handleContinueDraft}
                      onDeleteDraft={handleDeleteDraft}
                      onDeleteMultipleDrafts={handleDeleteMultipleDrafts}
                    />
                  )}

                  {activeTab === 'pending' && (
                    <PendingOrdersTab
                      orders={pendingOrders}
                      onOrderPress={(o) => console.log('Pending order:', o.orderNumber)}
                      onDownloadInvoice={handleOpenPdf as any}
                    />
                  )}

                  {activeTab === 'sent' && (
                    <SentOrdersTab
                      orders={sentOrders}
                      onTrackOrder={(o) => console.log('Track order:', o.trackingNumber)}
                      onViewInvoice={handleOpenPdf as any}
                    />
                  )}

                  {activeTab === 'pdf' && (
                    <PdfTab
                      documents={pdfDocuments}
                      onOpenPdf={handleOpenPdf}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsTab
                      profile={profile}
                      onUpdateProfile={setProfile}
                      onLogout={handleLogout}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </View>
      {/* Become a Supplier Application Sheet */}
      <BecomeSupplierSheet
        visible={showBecomeSupplierModal}
        onClose={() => setShowBecomeSupplierModal(false)}
        onSuccess={() => {
          setShowBecomeSupplierModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    width: '100%',
    alignItems: 'center',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
  },

  // ── DESKTOP STYLES ──────────────────────────────────────────────────────────
  desktopOuterWrapper: {
    width: '100%',
    maxWidth: 1380,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  desktopTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.15)',
  },
  desktopBackText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  desktopBreadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  desktopBreadcrumbRoot: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  desktopBreadcrumbSeparator: {
    fontSize: 13,
  },
  desktopBreadcrumbActive: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },

  desktopDashboardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    minHeight: 0,
  },
  // Desktop Left Sidebar
  desktopSidebarCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
  },
  sidebarProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },  desktopAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: AppColors.primary,
    position: 'relative',
  },
  desktopAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sidebarNameBlock: {
    flex: 1,
  },
  sidebarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sidebarFullName: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  sidebarLegalName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.6)',
    marginTop: 2,
  },
  tinBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  tinBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },

  // Stats Grid
  sidebarStatsGrid: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sidebarStatDivider: {
    width: 1,
    height: 28,
    alignSelf: 'center',
  },
  sidebarStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  sidebarStatNum: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  sidebarStatLbl: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
    marginTop: 1,
  },

  // Sidebar Nav Items
  sidebarNavList: {
    paddingVertical: 4,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 0,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  sidebarNavItemActive: {
    backgroundColor: 'rgba(18, 187, 240, 0.07)',
  },
  sidebarNavActiveBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#FD8C73',
    borderRadius: 0,
  },
  sidebarNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarNavLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(28, 27, 31, 0.7)',
  },
  sidebarNavLabelActive: {
    color: AppColors.primary,
    fontFamily: 'Outfit_800ExtraBold',
  },
  sidebarNavBadge: {
    backgroundColor: 'rgba(175, 184, 193, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.1)',
  },
  sidebarNavBadgeActive: {
    backgroundColor: AppColors.primary,
  },
  sidebarNavBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(28, 27, 31, 0.6)',
  },
  sidebarNavBadgeTextActive: {
    color: '#FFFFFF',
  },

  sidebarLocationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sidebarLocTitle: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  sidebarLocAddress: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.6)',
    marginTop: 2,
    lineHeight: 14,
  },

  sidebarSupplierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  sidebarSupplierText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  mobileSupplierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  mobileSupplierBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileSupplierBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },

  sidebarSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    backgroundColor: 'rgba(211, 47, 47, 0.04)',
  },
  sidebarSignOutText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: '#D32F2F',
  },

  // Desktop Right Content Pane
  desktopContentPane: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopPaneHeader: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.06)',
  },
  desktopPaneTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  desktopPaneSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 3,
  },
  desktopPaneBody: {
    flex: 1,
    height: '100%',
    minHeight: 0,
  },

  // ── MOBILE STYLES ───────────────────────────────────────────────────────────
  mobileOuterWrapper: {
    flex: 1,
    width: '100%',
  },
  mobileTabContent: {
    flex: 1,
  },
});
