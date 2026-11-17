import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import {
  NotificationItem,
  NotificationCategory,
} from '../models/notification_model';

interface NotificationCardProps {
  notification: NotificationItem;
  onPress?: () => void;
  onDelete?: () => void;
}

export function NotificationCard({
  notification,
  onPress,
  onDelete,
}: NotificationCardProps) {
  const { colors } = useAppTheme();
  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getCategoryDetails = (cat: NotificationCategory) => {
    switch (cat) {
      case 'orders':
        return { icon: 'shopping_bag', color: '#2196F3' };
      case 'inventory':
        return { icon: 'inventory_2', color: '#FF9800' };
      case 'logistics':
        return { icon: 'local_shipping', color: '#9C27B0' };
      case 'security':
        return { icon: 'security', color: '#F44336' };
      case 'finance':
        return { icon: 'account_balance_wallet', color: '#10B981' };
      case 'system':
        return { icon: 'sync', color: '#00BCD4' };
      case 'reminders':
        return { icon: 'alarm_on', color: '#FFC107' };
      case 'messages':
        return { icon: 'chat', color: '#2196F3' };
      default:
        return { icon: 'notifications', color: AppColors.primary };
    }
  };

  const { icon, color } = getCategoryDetails(notification.category);

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.cardColor, borderBottomColor: colors.borderLight },
        notification.isUnread && styles.unreadContainer,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Icon or Product Thumbnail */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${color}18` },
          ]}
        >
          {notification.imageUrl ? (
            <Image
              source={{ uri: notification.imageUrl }}
              style={styles.imageThumbnail}
              resizeMode="cover"
            />
          ) : (
            <MaterialIcon name={icon} size={22} color={color} />
          )}
        </View>

        {/* Center Content */}
        <View style={styles.textContainer}>
          {/* Header Row: Title + Time + Unread Dot */}
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: colors.onSurface }]} numberOfLines={1}>
              {notification.title}
            </Text>

            <View style={styles.timeWrapper}>
              <Text style={[styles.timeText, { color: colors.onSurfaceMuted }]}>
                {getTimeAgo(notification.time)}
              </Text>
              {notification.isUnread && <View style={styles.unreadDot} />}
            </View>
          </View>

          {/* Description */}
          {notification.description && (
            <Text style={[styles.descriptionText, { color: colors.onSurfaceMuted }]}>
              {notification.description}
            </Text>
          )}

          {/* Wholesale Bulk Discount Changes Box */}
          {notification.priceTierChanges && (
            <View
              style={[
                styles.tierCard,
                { backgroundColor: `${color}0D`, borderColor: `${color}25` },
              ]}
            >
              <View style={styles.tierHeader}>
                <MaterialIcon
                  name="trending_down"
                  size={15}
                  color={color}
                />
                <Text style={[styles.tierHeaderTitle, { color }]}>
                  BULK DISCOUNT UPDATES
                </Text>
              </View>

              {notification.priceTierChanges.map((tier, idx) => (
                <View key={idx} style={styles.tierRow}>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: `${color}18` },
                    ]}
                  >
                    <Text style={[styles.tierBadgeText, { color }]}>
                      {tier.minQuantity}+ units
                    </Text>
                  </View>

                  <View style={styles.tierPrices}>
                    <Text style={[styles.oldPrice, { color: colors.onSurfaceMuted }]}>
                      {formatPrice(tier.oldPrice)}
                    </Text>
                    <MaterialIcon
                      name="arrow_forward"
                      size={12}
                      color={colors.onSurfaceMuted}
                    />
                    <Text style={[styles.newPrice, { color: colors.onSurface }]}>
                      {formatPrice(tier.newPrice)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Delete / Dismiss Action */}
        {onDelete && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcon
              name="close"
              size={16}
              color={colors.onSurfaceMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  unreadContainer: {
    backgroundColor: 'rgba(18, 187, 240, 0.04)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.65)',
    marginTop: 4,
    lineHeight: 18,
  },
  tierCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tierHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  tierPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oldPrice: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.4)',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  deleteButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
