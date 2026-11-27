import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/core/theme/theme_context';
import { NodeIcon } from '@/core/widgets/node_icon';
import { FashionImageCollage } from '../widgets/fashion_image_collage';
import { GoogleSignInButton } from '../widgets/google_sign_in_button';
import { useAuth } from '@/features/auth/context/auth_context';
import { openNodeLegalPortal } from '@/core/constants/legal';

export function WelcomeScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const { signInWithGoogle, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        router.replace('/');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetStarted = () => {
    router.replace('/');
  };

  const handleGoLogin = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      {/* 1. Background Collage */}
      <FashionImageCollage />

      {/* 2. Top Dark Gradient Layer */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.95)',
          'rgba(0,0,0,0.65)',
          'rgba(0,0,0,0.1)',
          isDark ? 'rgba(18,18,22,0.95)' : 'rgba(255,255,255,0.05)',
        ]}
        locations={[0, 0.2, 0.5, 0.95]}
        style={StyleSheet.absoluteFill}
      />

      {/* 3. Top Mini Logo Branding */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.topBranding}>
          <View style={styles.brandingRow}>
            <NodeIcon size={20} />
            <Text style={styles.brandTitle}>N.O.D.E.</Text>
          </View>
          <Text style={styles.brandSubtitle}>
            National Order & Distribution Exchange
          </Text>
        </View>
      </SafeAreaView>

      {/* 4. Bottom Flush Action Card */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
          },
        ]}
      >
        {/* Welcome Header */}
        <Text style={[styles.welcomeTitle, { color: colors.onSurface }]}>
          Welcome to Node
        </Text>

        <View style={styles.wholesaleRow}>
          <View style={styles.wholesalePillContainer}>
            <Text style={[styles.wholesaleText, { color: colors.primary }]}>
              Wholesale
            </Text>
            <View
              style={[styles.wholesaleUnderline, { backgroundColor: colors.primary }]}
            />
          </View>
          <Text style={[styles.styleText, { color: colors.onSurface }]}>
            exchange
          </Text>
        </View>

        <Text
          style={[
            styles.description,
            { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' },
          ]}
        >
          Node is an innovative and open trade-sharing network. We are dedicated to creating growth for our wholesale and retail partners.
        </Text>

        <View style={{ height: 20 }} />

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGetStarted}
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />

        {/* Google Sign In Button */}
        <GoogleSignInButton
          onPress={handleGoogleSignIn}
          isLoading={isLoading}
          label="Continue with Google"
        />

        <View style={{ height: 16 }} />

        {/* Login Link */}
        <View style={styles.loginLinkRow}>
          <Text
            style={[
              styles.hasAccountText,
              { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
            ]}
          >
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleGoLogin}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 12 }} />

        {/* Legal Disclaimer */}
        <Text
          style={[
            styles.legalText,
            { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' },
          ]}
        >
          By continuing, you agree to our{' '}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topSafeArea: {
    zIndex: 10,
    alignItems: 'center',
  },
  topBranding: {
    alignItems: 'center',
    paddingTop: 16,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  wholesaleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  wholesalePillContainer: {
    alignItems: 'center',
  },
  wholesaleText: {
    fontSize: 26,
    fontFamily: 'Outfit_800ExtraBold',
  },
  wholesaleUnderline: {
    height: 3,
    width: 90,
    borderRadius: 2,
    marginTop: 1,
  },
  styleText: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
  },
  description: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  getStartedButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasAccountText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  loginLink: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  legalText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 20,
  },
});
