import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { DefaultTheme, DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { MaterialSymbols_400Regular } from '@expo-google-fonts/material-symbols';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppThemeProvider, useAppTheme } from '@/core/theme/theme_context';
import { AuthProvider, useAuth } from '@/features/auth/context/auth_context';
import { ProductsProvider } from '@/features/inventory/context/products_context';
import { ToastProvider } from '@/core/widgets/whatsapp_dialog';
import { setAuthTokenGetter } from '@/core/api/api_client';

/**
 * Bridges the AuthContext token into the global API client so that every
 * protected API call automatically includes the JWT Bearer token.
 */
function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);
  return null;
}

function NavigationStack() {
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyle(isDark ? 'dark' : 'light');
      } catch {
        // ignore on unsupported web or mock envs
      }
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const bg = colors.scaffoldBackground || '#0D1117';
      document.documentElement.style.backgroundColor = bg;
      document.body.style.backgroundColor = bg;
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', bg);
    }
  }, [isDark, colors.scaffoldBackground]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {Platform.OS === 'android' && <NavigationBar style={isDark ? 'dark' : 'light'} />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.scaffoldBackground },
          animation: 'slide_from_right', // Native smooth slide transition matching Flutter
          animationDuration: 350,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="explore"
          options={{
            animation: 'slide_from_bottom', // Bottom modal slide matching Flutter's Explore route transition
          }}
        />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useFonts({
    MaterialSymbols: MaterialSymbols_400Regular,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <AuthTokenBridge />
          <ProductsProvider>
            <ToastProvider>
              <NavigationStack />
            </ToastProvider>
          </ProductsProvider>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
