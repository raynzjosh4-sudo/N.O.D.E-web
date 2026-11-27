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
import { BulkCartProvider } from '@/features/inventory/context/bulk_cart_context';
import { ToastProvider } from '@/core/widgets/whatsapp_dialog';
import { CoachmarkProvider } from '@/core/coachmarks/coachmark_context';
import { CoachmarkOverlay } from '@/core/coachmarks/coachmark_overlay';
import { GoogleOneTapPrompt } from '@/features/auth/presentation/widgets/google_one_tap_prompt';
import { WebUpdateReloader } from '@/core/widgets/web_update_reloader';
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

      // Preconnect and load Google Fonts & Material Symbols via high-speed Google CDN
      if (!document.getElementById('google-fonts-cdn')) {
        const preconnect1 = document.createElement('link');
        preconnect1.rel = 'preconnect';
        preconnect1.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnect1);

        const preconnect2 = document.createElement('link');
        preconnect2.rel = 'preconnect';
        preconnect2.href = 'https://fonts.gstatic.com';
        preconnect2.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect2);

        const fontLink = document.createElement('link');
        fontLink.id = 'google-fonts-cdn';
        fontLink.rel = 'stylesheet';
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
        document.head.appendChild(fontLink);

        const fontStyle = document.createElement('style');
        fontStyle.id = 'material-symbols-alias';
        fontStyle.textContent = `
          @font-face {
            font-family: 'MaterialSymbols';
            src: local('Material Symbols Outlined'),
                 url('https://fonts.gstatic.com/s/materialsymbolsoutlined/v223/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpYo3REeHmuK21U-nv3qlBQ.woff2') format('woff2');
            font-weight: 100 700;
            font-style: normal;
          }
        `;
        document.head.appendChild(fontStyle);
      }
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
  useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          MaterialSymbols: MaterialSymbols_400Regular,
          'Comic Relief': require('../../assets/fonts/Comic_Relief/ComicRelief-Regular.ttf'),
          'ComicRelief-Bold': require('../../assets/fonts/Comic_Relief/ComicRelief-Bold.ttf'),
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
        }
  );

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <AuthTokenBridge />
          <ProductsProvider>
            <BulkCartProvider>
              <ToastProvider>
                <CoachmarkProvider>
                  <NavigationStack />
                  <CoachmarkOverlay />
                  <WebUpdateReloader />
                  <GoogleOneTapPrompt />
                </CoachmarkProvider>
              </ToastProvider>
            </BulkCartProvider>
          </ProductsProvider>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
