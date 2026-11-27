import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useAuth } from '@/features/auth/context/auth_context';
import { openNodeLegalPortal } from '@/core/constants/legal';

interface SmartSignInSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onExploreAsGuest?: () => void;
}

interface CachedGoogleAccount {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export function SmartSignInSheet({
  visible,
  onClose,
  onSuccess,
  onExploreAsGuest,
}: SmartSignInSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user, signInWithGoogle, isLoading } = useAuth();
  const [cachedAccount, setCachedAccount] = useState<CachedGoogleAccount | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@node_last_known_account');
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          if (parsed?.email) {
            setCachedAccount(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const activeAccount = user || cachedAccount;
  const displayEmail = activeAccount?.email || '';
  const displayName = activeAccount?.name || (displayEmail ? displayEmail.split('@')[0] : '');

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

  const handleExploreGuest = () => {
    onClose();
    if (onExploreAsGuest) {
      onExploreAsGuest();
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
            Sign in with Google
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' },
            ]}
          >
            Choose an account to continue to N.O.D.E. Wholesale Exchange
          </Text>

          {/* Google Account Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={[
              styles.savedAccountCard,
              {
                backgroundColor: isDark ? colors.cardColor : '#F8F9FA',
                borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {activeAccount?.avatarUrl ? (
              <Image
                source={{ uri: activeAccount.avatarUrl }}
                style={styles.accountAvatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Image
                  source={require('@/../assets/google/google-logo.png')}
                  style={styles.cardGoogleIcon}
                  resizeMode="contain"
                />
              </View>
            )}
            <View style={styles.accountInfo}>
              <Text
                style={[styles.accountName, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {displayName ? `Continue as ${displayName}` : 'Continue with Google'}
              </Text>
              <Text
                style={[
                  styles.accountEmail,
                  { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                ]}
                numberOfLines={1}
              >
                {displayEmail || 'Use your Google Account to sign in'}
              </Text>
            </View>
            <MaterialIcon
              name="chevron_right"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Image
              source={require('@/../assets/google/google-logo.png')}
              style={styles.buttonGoogleIcon}
              resizeMode="contain"
            />
            <Text style={styles.primaryButtonText}>
              {displayEmail ? `Continue as ${displayEmail}` : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 10 }} />

          {/* Explore as Guest Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExploreGuest}
            style={[
              styles.guestButton,
              {
                borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.12)',
              },
            ]}
          >
            <Text style={[styles.guestButtonText, { color: colors.onSurface }]}>
              Explore as Guest
            </Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />

          {/* Footer Terms & Privacy */}
          <Text
            style={[
              styles.footerText,
              { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' },
            ]}
          >
            By continuing, Google shares your name, email address, and profile picture with N.O.D.E. See{' '}
            <Text
              onPress={openNodeLegalPortal}
              style={{ color: colors.primary, fontWeight: '700' }}
            >
              Privacy Policy
            </Text>
            {' & '}
            <Text
              onPress={openNodeLegalPortal}
              style={{ color: colors.primary, fontWeight: '700' }}
            >
              Terms
            </Text>
            .
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
    marginTop: 6,
    marginBottom: 20,
  },
  savedAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGoogleIcon: {
    width: 24,
    height: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
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
    gap: 10,
    paddingHorizontal: 16,
  },
  buttonGoogleIcon: {
    width: 18,
    height: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  guestButton: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
});
