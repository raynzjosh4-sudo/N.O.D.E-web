import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { useAppTheme } from '@/core/theme/theme_context';
import { AppColors } from '@/core/theme/app_theme';
import { MaterialIcon } from '@/core/widgets/material_icon';
import {
  NotificationItem,
  NotificationCategory,
  NOTIFICATION_CATEGORIES,
  MOCK_NOTIFICATIONS,
} from './models/notification_model';
import { NotificationCard } from './widgets/notification_card';

export function NotificationPage() {
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { colors } = useAppTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');

  const filteredNotifications = notifications.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={[styles.contentWrapper, { backgroundColor: colors.surface }]}>
          {/* ── Top Header (NodeAppBar style) ── */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
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

            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            {unreadCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleMarkAllRead}
                style={styles.markAllButton}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>

          {/* ── Horizontal Category Filter Pills ── */}
          <View style={[styles.categoryFiltersWrapper, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFiltersList}
            >
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.75}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                      !isSelected && { backgroundColor: colors.cardColor },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                        !isSelected && { color: colors.onSurfaceMuted },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Notification Feed / Empty State ── */}
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.cardColor }]}>
                <MaterialIcon
                  name="notifications_none"
                  size={42}
                  color={colors.onSurfaceMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No notifications in this category</Text>
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
                You will be notified when your wholesale orders update, tier prices drop, or shipments depart.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollList}
            >
              <View style={[styles.notificationsCard, { backgroundColor: colors.cardColor }]}>
                {filteredNotifications.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onPress={() => handleMarkAsRead(notif.id)}
                    onDelete={() => handleDelete(notif.id)}
                  />
                ))}
              </View>
            </ScrollView>
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
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: AppColors.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.05)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  categoryFiltersWrapper: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  categoryFiltersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 27, 31, 0.06)',
  },
  categoryChipSelected: {
    backgroundColor: AppColors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(28, 27, 31, 0.55)',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
  },
  scrollList: {
    paddingBottom: 40,
  },
  notificationsCard: {
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
