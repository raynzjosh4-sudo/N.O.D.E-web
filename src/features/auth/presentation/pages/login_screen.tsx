import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/core/theme/theme_context';
import { NodeIcon } from '@/core/widgets/node_icon';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { GoogleSignInButton } from '../widgets/google_sign_in_button';
import { ForgotPasswordSheet } from '../widgets/forgot_password_sheet';
import { useAuth } from '@/features/auth/context/auth_context';

export function LoginScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotSheet, setShowForgotSheet] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const success = await signInWithEmail(email.trim(), password.trim());
      if (success) {
        router.replace('/');
      } else {
        setErrorMessage('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        router.replace('/');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Google sign in failed.');
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Top Actions: Back + Sign Up */}
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcon
                name="arrow_back_ios_new"
                size={20}
                color={colors.onSurface}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={[styles.topSignupText, { color: colors.primary }]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Small Header */}
          <Text
            style={[
              styles.smallHeader,
              { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
            ]}
          >
            Log in
          </Text>

          {/* Brand Row */}
          <View style={styles.brandingRow}>
            <NodeIcon size={46} />
            <View style={styles.brandTextColumn}>
              <Text style={[styles.brandTitle, { color: colors.onSurface }]}>
                N.O.D.E.
              </Text>
              <Text
                style={[
                  styles.brandSubtitle,
                  { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' },
                ]}
              >
                National, Order & Distribution, Exchange
              </Text>
            </View>
          </View>

          <View style={{ height: 32 }} />

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialIcon name="error_outline" size={16} color="#FF4D4F" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <Text
            style={[
              styles.inputLabel,
              { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
            ]}
          >
            Email Address
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.inputLeadingIcon}>
              <MaterialIcon
                name="mail"
                size={18}
                color={isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'}
              />
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@company.com"
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.textInput, { color: colors.onSurface }]}
            />
          </View>

          <View style={{ height: 16 }} />

          {/* Password Field */}
          <View style={styles.passwordLabelRow}>
            <Text
              style={[
                styles.inputLabel,
                { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
              ]}
            >
              Password
            </Text>
            <TouchableOpacity onPress={() => setShowForgotSheet(true)}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.inputLeadingIcon}>
              <MaterialIcon
                name="lock"
                size={18}
                color={isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'}
              />
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
              secureTextEntry={obscurePassword}
              style={[styles.textInput, { color: colors.onSurface }]}
            />
            <TouchableOpacity
              onPress={() => setObscurePassword(!obscurePassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcon
                name={obscurePassword ? 'visibility_off' : 'visibility'}
                size={18}
                color={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
              />
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />

          {/* Log In Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 16 }} />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' },
              ]}
            />
            <Text
              style={[
                styles.dividerText,
                { color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)' },
              ]}
            >
              or
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' },
              ]}
            />
          </View>

          <View style={{ height: 16 }} />

          {/* Google Sign In */}
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            label="Continue with Google"
          />

          <View style={{ height: 28 }} />

          {/* Legal Footer */}
          <Text
            style={[
              styles.legalText,
              { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' },
            ]}
          >
            By logging in, you agree to our{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              Terms of Service
            </Text>
            {' & '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Forgot Password Bottom Sheet */}
      <ForgotPasswordSheet
        visible={showForgotSheet}
        onClose={() => setShowForgotSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 480,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topSignupText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  smallHeader: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 79, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputLeadingIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    height: '100%',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  legalText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
