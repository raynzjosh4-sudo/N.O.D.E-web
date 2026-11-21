import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/features/auth/context/auth_context';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface GoogleOneTapPromptProps {
  accountName?: string;
  accountEmail?: string;
  avatarUrl?: string;
  onSuccess?: () => void;
}

export function GoogleOneTapPrompt({
  accountName = 'Jeff City',
  accountEmail = 'cityjeff83@gmail.com',
  avatarUrl,
  onSuccess,
}: GoogleOneTapPromptProps) {
  const { user, isAuthenticated, signInWithGoogle } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-16)).current;

  // Attempt Google Identity Services (GSI) on web if available
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !isAuthenticated && !user) {
      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          try {
            const google = (window as any).google;
            if (google?.accounts?.id) {
              google.accounts.id.initialize({
                client_id: '57183530401-gnoi6jt63bu4lnsdjmr2mu4j78826vpv.apps.googleusercontent.com',
                callback: async (res: any) => {
                  if (res?.credential) {
                    await signInWithGoogle({ idToken: res.credential });
                    setIsVisible(false);
                    if (onSuccess) onSuccess();
                  }
                },
                auto_select: false,
                cancel_on_tap_outside: true,
              });
              google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  // Fall back gracefully to our in-app One Tap prompt
                }
              });
            }
          } catch {
            // Ignore GSI init error on localhost/restricted origins
          }
        };
        document.head.appendChild(script);
      }
    }
  }, [isAuthenticated, user, signInWithGoogle, onSuccess]);

  useEffect(() => {
    // If already logged in or user explicitly dismissed this session, don't show
    if (isAuthenticated || user || isDismissed) {
      setIsVisible(false);
      return;
    }

    // Slide in gracefully after a 1.2s delay for seamless visitor experience
    const timer = setTimeout(() => {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, isDismissed, opacityAnim, translateYAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateYAnim, {
        toValue: isDesktop ? -16 : 20,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setIsVisible(false);
      setIsDismissed(true);
    });
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await signInWithGoogle({
        email: accountEmail,
        name: accountName,
        avatarUrl,
      });
      if (ok) {
        setIsVisible(false);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.warn('Google One Tap sign in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible || isAuthenticated || user) {
    return null;
  }

  const firstName = accountName.split(' ')[0] || 'User';
  const initial = (accountName[0] || 'J').toUpperCase();

  return (
    <Animated.View
      style={[
        styles.container,
        isDesktop ? styles.containerDesktop : styles.containerMobile,
        {
          backgroundColor: isDark ? '#1E232A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {/* ── Top Header Row ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/../assets/google/google-logo.png')}
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            Sign in to node.app with google.com
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDismiss}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcon name="close" size={17} color={colors.onSurfaceMuted} />
        </TouchableOpacity>
      </View>

      {/* ── User Account Card Row ── */}
      <View style={styles.accountRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}

        <View style={styles.accountDetails}>
          <Text style={[styles.accountName, { color: colors.onSurface }]} numberOfLines={1}>
            {accountName}
          </Text>
          <Text style={[styles.accountEmail, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
            {accountEmail}
          </Text>
        </View>
      </View>

      {/* ── Blue "Continue as [FirstName]" Button ── */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleContinue}
        disabled={isSubmitting}
        style={styles.continueButton}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Continue as {firstName}</Text>
        )}
      </TouchableOpacity>

      {/* ── Fine Print / Terms Disclaimer ── */}
      <Text style={[styles.disclaimerText, { color: colors.onSurfaceMuted }]}>
        To continue, google.com will share your name, email address, and profile picture with this site. See this site's{' '}
        <Text style={styles.linkText}>privacy policy</Text> and <Text style={styles.linkText}>terms of service</Text>.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 14,
    zIndex: 99999,
  },
  containerDesktop: {
    top: 20,
    right: 20,
    width: 360,
  },
  containerMobile: {
    bottom: 24,
    left: 16,
    right: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 6,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  headerTitle: {
    fontSize: 12.5,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 3,
    borderRadius: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 18,
  },
  accountEmail: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
  continueButton: {
    backgroundColor: '#1A73E8',
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
  },
  disclaimerText: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 14.5,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
