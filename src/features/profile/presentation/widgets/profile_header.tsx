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
import { UserProfile } from '../../domain/entities/profile_models';

interface ProfileHeaderProps {
  profile: UserProfile;
  onBack: () => void;
  onActionPress?: () => void;
  actionIcon?: string;
}

export function ProfileHeader({
  profile,
  onBack,
  onActionPress,
  actionIcon = 'close',
}: ProfileHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
      {/* ── Left: Avatar ── */}
      <View style={[styles.avatarWrapper, { borderColor: colors.primary, backgroundColor: colors.cardColor }]}>
        {profile.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcon
              name="person"
              size={22}
              color={colors.onSurfaceMuted}
            />
          </View>
        )}
      </View>

      {/* ── Center: User / Business Details ── */}
      <View style={styles.centerDetails}>
        <View style={styles.nameRow}>
          <Text style={[styles.fullNameText, { color: colors.onSurface }]} numberOfLines={1}>
            {profile.fullName}
          </Text>
          {profile.isVerified && (
            <View style={styles.verifiedShieldBadge}>
              <MaterialIcon
                name="verified"
                size={16}
                color={colors.primary}
              />
            </View>
          )}
        </View>

        <Text style={[styles.legalNameText, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
          {profile.legalBusinessName}
        </Text>
        <Text style={[styles.taxIdText, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
          {profile.taxId} • {profile.warehouseAddress.split(',')[1]?.trim() || 'Kampala'}
        </Text>
      </View>

      {/* ── Right: Close / Action Button ── */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.actionButton, { backgroundColor: colors.cardColor }]}
        onPress={onActionPress || onBack}
      >
        <MaterialIcon
          name={actionIcon}
          size={20}
          color={colors.onSurface}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    gap: 14,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: AppColors.primary,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fullNameText: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  verifiedShieldBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalNameText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.65)',
    marginTop: 2,
  },
  taxIdText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
    marginTop: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
