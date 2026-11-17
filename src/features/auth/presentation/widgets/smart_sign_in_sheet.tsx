import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useAuth } from '@/features/auth/context/auth_context';

interface SmartSignInSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SmartSignInSheet({ visible, onClose, onSuccess }: SmartSignInSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user, signInWithGoogle, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            isDesktop && styles.sheetContainerDesktop,
            {
              backgroundColor: isDark ? '#1C1C21' : '#FFFFFF',
            },
          ]}
        >
          {/* Top Row: Google Icon & Close */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(18, 187, 240, 0.1)',
                },
              ]}
            >
              <Image
                source={require('@/../assets/google/google-logo.png')}
                style={styles.googleBadgeIcon}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcon
                name="close"
                size={22}
                color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Sign in to N.O.D.E.
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' },
            ]}
          >
            Sign in with Google to access your wholesale dashboard, manage inventory, and track orders.
          </Text>

          {/* Saved Account Card if exists */}
          {user && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              style={[
                styles.savedAccountCard,
                {
                  backgroundColor: isDark ? colors.cardColor : '#F8F9FA',
                  borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.accountAvatar}
              />
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: colors.onSurface }]}>
                  {user.name}
                </Text>
                <Text
                  style={[
                    styles.accountEmail,
                    { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                  ]}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              </View>
              <MaterialIcon
                name="chevron_right"
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}

          <View style={{ height: 16 }} />

          {/* Continue with Google Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryButtonText}>Continue with Google</Text>
            <MaterialIcon name="arrow_forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ height: 20 }} />

          {/* Footer */}
          <Text
            style={[
              styles.footerText,
              { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' },
            ]}
          >
            Secure wholesale access powered by Google Authentication.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 1,
  },
  sheetContainerDesktop: {
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 36,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBadgeIcon: {
    width: 20,
    height: 20,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  savedAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  accountEmail: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
  },
});
