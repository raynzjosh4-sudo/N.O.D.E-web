import React from 'react';
import { DefaultTheme, DarkTheme, Stack, ThemeProvider } from 'expo-router';
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
import { AuthProvider } from '@/features/auth/context/auth_context';
import { ProductsProvider } from '@/features/inventory/context/products_context';
import { ToastProvider } from '@/core/widgets/whatsapp_dialog';

function NavigationStack() {
  const { isDark } = useAppTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
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
    <AppThemeProvider>
      <AuthProvider>
        <ProductsProvider>
          <ToastProvider>
            <NavigationStack />
          </ToastProvider>
        </ProductsProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
