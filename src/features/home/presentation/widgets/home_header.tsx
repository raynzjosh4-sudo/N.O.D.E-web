import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { NodeIcon } from '@/core/widgets/node_icon';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { forceAppReload } from '@/core/widgets/web_update_reloader';

interface HomeHeaderProps {
  isAuthenticated?: boolean;
  displayName?: string;
  profilePicUrl?: string;
  hasUnreadNotifications?: boolean;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

export function HomeHeader({
  isAuthenticated = false,
  displayName = 'Guest',
  profilePicUrl,
  hasUnreadNotifications = true,
  onProfilePress,
  onNotificationPress,
}: HomeHeaderProps) {
  const { colors } = useAppTheme();
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [profilePicUrl]);

  const showAvatarImage = Boolean(isAuthenticated && profilePicUrl && !imgError);

  return (
    <View style={styles.container}>
      {/* Profile Avatar & Greeting */}
      <TouchableOpacity
        style={styles.profileSection}
        activeOpacity={0.7}
        onPress={onProfilePress}
      >
        <View style={[styles.avatarContainer, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
          {showAvatarImage ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <MaterialIcon
              name="person_outline"
              size={20}
              color={colors.onSurface}
            />
          )}
        </View>

        <View style={styles.greetingTextContainer}>
          <Text style={[styles.helloText, { color: colors.onSurfaceMuted }]}>Hello,</Text>
          <Text style={[styles.displayNameText, { color: colors.onSurface }]} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Brand Logo */}
      <View style={styles.brandContainer}>
        <NodeIcon size={22} />
        <Text style={[styles.brandTitle, { color: colors.onSurface }]}>N.O.D.E.</Text>
      </View>

      {/* Actions (Reload on Web + Notification Bell) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.7}
            onPress={() => forceAppReload()}
            accessibilityLabel="Refresh app & sync latest updates"
          >
            <View style={[styles.bellIconWrapper, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
              <MaterialIcon
                name="refresh"
                size={18}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.notificationButton}
          activeOpacity={0.7}
          onPress={onNotificationPress}
        >
          <View style={[styles.bellIconWrapper, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <MaterialIcon
              name="notifications_none"
              size={18}
              color={colors.onSurface}
            />
          </View>
          {hasUnreadNotifications && <View style={styles.unreadBadge} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '40%',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  greetingTextContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  helloText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.4)',
    lineHeight: 14,
  },
  displayNameText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    lineHeight: 18,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    letterSpacing: 1,
  },
  notificationButton: {
    position: 'relative',
  },
  bellIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.errorRed,
  },
});
