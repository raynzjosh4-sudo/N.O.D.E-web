import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';

interface GoogleSignInButtonProps {
  onPress?: () => void;
  isLoading?: boolean;
  label?: string;
  outlineOnly?: boolean;
}

export function GoogleSignInButton({
  onPress,
  isLoading = false,
  label = 'Continue with Google',
  outlineOnly = true,
}: GoogleSignInButtonProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isLoading}
      style={[
        styles.button,
        {
          backgroundColor: outlineOnly
            ? (isDark ? '#1C1C21' : '#FFFFFF')
            : colors.primary,
          borderColor: outlineOnly
            ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)')
            : 'transparent',
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={outlineOnly ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          <Image
            source={require('@/../assets/google/google-logo.png')}
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.label,
              {
                color: outlineOnly ? colors.onSurface : '#FFFFFF',
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
