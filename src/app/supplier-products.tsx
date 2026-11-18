import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth_context';
import { SupplierProductsScreen } from '@/features/inventory/presentation/pages/supplier_products_screen';

export default function SupplierProductsRoute() {
  const { user, isAuthenticated, isLoading, isProfileReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until both session restoration and server profile are ready
    if (isLoading || !isProfileReady) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    const role = (user.role || '').toLowerCase();
    if (role !== 'supplier' && role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, isProfileReady, isAuthenticated, user]);

  if (isLoading || !isProfileReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const role = (user?.role || '').toLowerCase();
  if (!isAuthenticated || !user || (role !== 'supplier' && role !== 'admin')) {
    return null;
  }

  return <SupplierProductsScreen />;
}
