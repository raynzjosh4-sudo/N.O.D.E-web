import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/core/theme/theme_context';
import { GoogleSignInButton } from './google_sign_in_button';
import { useAuth } from '@/features/auth/context/auth_context';
import { openNodeLegalPortal } from '@/core/constants/legal';

interface AuthPromptSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthPromptSheet({ visible, onClose, onSuccess }: AuthPromptSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const { signInWithGoogle, isLoading } = useAuth();

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

  const handleGoSignup = () => {
    onClose();
    router.push('/signup');
  };

  const handleGoLogin = () => {
    onClose();
    router.push('/login');
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
          {/* Handlebar (Mobile only) */}
          {!isDesktop && (
            <View
              style={[
                styles.handlebar,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            />
          )}

          {/* Title */}
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Log in is required
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' },
            ]}
          >
            Keep your orders and account safe
          </Text>

          <View style={{ height: 20 }} />

          {/* Continue with Google */}
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            isLoading={isLoading}
            label="Continue with Google"
          />

          <View style={{ height: 14 }} />

          {/* Clickable Terms & Privacy */}
          <Text
            style={[
              styles.termsText,
              { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)' },
            ]}
          >
            By continuing you agree to Node's{' '}
            <Text
              onPress={openNodeLegalPortal}
              style={{ color: colors.primary, fontWeight: '700' }}
            >
              Terms of Service
            </Text>
            {' & '}
            <Text
              onPress={openNodeLegalPortal}
              style={{ color: colors.primary, fontWeight: '700' }}
            >
              Privacy Policy
            </Text>
          </Text>

          <View style={{ height: 22 }} />

          {/* Bottom Actions */}
          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={handleGoLogin} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.actionLink, { color: colors.primary }]}>
                Try log in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGoSignup} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.actionBold, { color: colors.onSurface }]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 12,
    paddingBottom: 32,
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
    paddingTop: 24,
    paddingBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
  },
  handlebar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    marginTop: 4,
  },
  termsText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionLink: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  actionBold: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
