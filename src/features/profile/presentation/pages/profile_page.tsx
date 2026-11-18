
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
import { useAuth } from '@/features/auth/context/auth_context';
import { ProfileApiService } from '../../data/services/profile_api_service';

export function ProfilePage() {
  const router = useAppNavigation();
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { user, isAuthenticated, signOut, getToken } = useAuth();

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
        setProfile(profileRes.value);
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
    if (selected.length > 0) {
      router.push(`/product/order/${selected[0].product.id}`);
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

  const handleDeleteDraft = async (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    try {
      await ProfileApiService.deleteDraftOrder(id);
      showSuccess('Draft Discarded', 'Order draft was removed.');
    } catch (e) {
      console.warn('Failed to delete draft:', e);
    }
  };

  const handleContinueDraft = (draft: DraftOrder) => {
    router.push(`/product/order/${draft.id}`);
  };

  const handleOpenPdf = (doc: PdfDocumentItem) => {
    showInfo('Document Downloading', `${doc.title} (${doc.fileSize}) is being downloaded.`);
    if (doc.downloadUrl && Platform.OS === 'web') {
      window.open(doc.downloadUrl, '_blank');
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
            <View style={styles.desktopTopNav}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.desktopBackBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                onPress={() => router.safeGoBack('/')}
              >
                <MaterialIcon name="arrow_back" size={18} color={colors.onSurface} />
                <Text style={[styles.desktopBackText, { color: colors.onSurface }]}>Back to Catalog</Text>
              </TouchableOpacity>

              <View style={styles.desktopBreadcrumbs}>
                <Text style={styles.desktopBreadcrumbRoot}>N.O.D.E.</Text>
                <Text style={styles.desktopBreadcrumbSeparator}>/</Text>
                <Text style={styles.desktopBreadcrumbActive}>Wholesale Buyer Dashboard</Text>
              </View>
            </View>

            {/* ── Main Two-Column Layout ── */}
            <View style={styles.desktopDashboardRow}>
              {/* ── 1. LEFT SIDEBAR: PROFILE & NAVIGATION CARD ── */}
              <View style={[styles.desktopSidebarCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                {/* Profile Identity */}
                <View style={styles.sidebarProfileHeader}>
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
                    <Text style={styles.sidebarLegalName}>{profile.legalBusinessName}</Text>
                    <View style={styles.tinBadge}>
                      <Text style={styles.tinBadgeText}>{profile.taxId}</Text>
                    </View>
                  </View>
                </View>

                {/* Quick Stats Grid */}
                <View style={[styles.sidebarStatsGrid, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
                  <View style={styles.sidebarStatBox}>
                    <Text style={[styles.sidebarStatNum, { color: colors.onSurface }]}>{savedItems.length}</Text>
                    <Text style={[styles.sidebarStatLbl, { color: colors.onSurfaceMuted }]}>Saved Items</Text>
                  </View>
                  <View style={styles.sidebarStatBox}>
                    <Text style={[styles.sidebarStatNum, { color: colors.onSurface }]}>{pendingOrders.length + sentOrders.length}</Text>
                    <Text style={[styles.sidebarStatLbl, { color: colors.onSurfaceMuted }]}>Total Orders</Text>
                  </View>
                  <View style={styles.sidebarStatBox}>
                    <Text style={[styles.sidebarStatNum, { color: colors.onSurface }]}>Gold</Text>
                    <Text style={[styles.sidebarStatLbl, { color: colors.onSurfaceMuted }]}>Buyer Tier</Text>
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
                        <View style={styles.sidebarNavLeft}>
                          <MaterialIcon
                            name={item.icon}
                            size={18}
                            color={isActive ? colors.primary : colors.onSurfaceMuted}
                          />
                          <Text
                            style={[
                              styles.sidebarNavLabel,
                              { color: isActive ? colors.primary : colors.onSurfaceMuted },
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

                {/* Warehouse Location Info */}
                <View style={[styles.sidebarLocationCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                  <MaterialIcon name="warehouse" size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sidebarLocTitle, { color: colors.primary }]}>Delivery Warehouse</Text>
                    <Text style={[styles.sidebarLocAddress, { color: colors.onSurfaceMuted }]}>{profile.warehouseAddress}</Text>
                  </View>
                </View>

                {/* Supplier Products Shortcut — only for suppliers and admins */}
                {(user?.role === 'supplier' || user?.role === 'admin') && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.sidebarSupplierBtn,
                    {
                      backgroundColor: colors.primary + '18',
                      borderColor: colors.primary + '40',
                    },
                  ]}
                  onPress={() => router.push('/supplier-products')}
                >
                  <MaterialIcon name="inventory_2" size={16} color={colors.primary} />
                  <Text style={[styles.sidebarSupplierText, { color: colors.primary }]}>
                    Supplier Catalog (Manage)
                  </Text>
                </TouchableOpacity>
                )}

                {/* Sign Out CTA */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.sidebarSignOutBtn}
                  onPress={handleLogout}
                >
                  <MaterialIcon name="logout" size={16} color="#D32F2F" />
                  <Text style={styles.sidebarSignOutText}>Sign Out from N.O.D.E.</Text>
                </TouchableOpacity>
              </View>

              {/* ── 2. RIGHT CONTENT AREA: ACTIVE TAB VIEW ── */}
              <View style={[styles.desktopContentPane, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
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
                  {activeTab === 'saved' && (
                    <SavedTab
                      items={savedItems}
                      onPlaceOrder={handlePlaceOrder}
                      onDeleteItem={handleDeleteSaved}
                      onProductClick={(pId) => router.push(`/product/${pId}`)}
                    />
                  )}

                  {activeTab === 'drafts' && (
                    <DraftsTab
                      drafts={drafts}
                      onContinueDraft={handleContinueDraft}
                      onDeleteDraft={handleDeleteDraft}
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
              {activeTab === 'saved' && (
                <SavedTab
                  items={savedItems}
                  onPlaceOrder={handlePlaceOrder}
                  onDeleteItem={handleDeleteSaved}
                  onProductClick={(pId) => router.push(`/product/${pId}`)}
                />
              )}

              {activeTab === 'drafts' && (
                <DraftsTab
                  drafts={drafts}
                  onContinueDraft={handleContinueDraft}
                  onDeleteDraft={handleDeleteDraft}
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
            </View>
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.08)',
  },
  desktopBackText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  desktopBreadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopBreadcrumbRoot: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(28, 27, 31, 0.4)',
  },
  desktopBreadcrumbSeparator: {
    color: 'rgba(28, 27, 31, 0.3)',
  },
  desktopBreadcrumbActive: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
  },

  desktopDashboardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    minHeight: 0,
  },

  // Desktop Left Sidebar
  desktopSidebarCard: {
    width: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flexShrink: 0,
  },
  sidebarProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopAvatarWrapper: {
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
    backgroundColor: 'rgba(28, 27, 31, 0.03)',
    borderRadius: 12,
    padding: 10,
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
    gap: 4,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  sidebarNavItemActive: {
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
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
    backgroundColor: 'rgba(28, 27, 31, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
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
    backgroundColor: 'rgba(18, 187, 240, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(18, 187, 240, 0.1)',
    borderRadius: 10,
    padding: 10,
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
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 'auto',
    marginBottom: 8,
  },
  sidebarSupplierText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  sidebarSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(211, 47, 47, 0.06)',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
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
