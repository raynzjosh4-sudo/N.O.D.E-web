import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth_context';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { SupplierProductsScreen } from '@/features/inventory/presentation/pages/supplier_products_screen';
import { BecomeSupplierSheet } from '@/features/profile/presentation/widgets/become_supplier_sheet';
import { SupplierProductsShimmer } from '@/features/inventory/presentation/pages/shimmer/supplier_products_shimmer';
import { CoachmarkAnchor } from '@/core/coachmarks/coachmark_anchor';

export default function PostsRoute() {
  const { user, isAuthenticated, isLoading, isProfileReady } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [showBecomeSupplier, setShowBecomeSupplier] = useState(false);

  // If user navigates to post but is not a verified supplier, directly launch supplier application sheet
  useEffect(() => {
    if (isAuthenticated && isProfileReady && user) {
      const role = (user.role || '').toLowerCase();
      const isSupplierOrAdmin = role === 'supplier' || role === 'admin';
      if (!isSupplierOrAdmin) {
        setShowBecomeSupplier(true);
      }
    }
  }, [isAuthenticated, isProfileReady, user]);

  if (isLoading || !isProfileReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <SupplierProductsShimmer />
      </SafeAreaView>
    );
  }

  // Not logged in state
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <MaterialIcon name="lock" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Sign In Required</Text>
          <Text style={[styles.cardSubtitle, { color: colors.onSurfaceMuted }]}>
            Please sign in to access your wholesale supplier catalog and manage inventory.
          </Text>
          <CoachmarkAnchor id="login_prompt_btn" style={{ width: '100%', marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginBottom: 0 }]}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.primaryBtnText}>Log In to Account</Text>
            </TouchableOpacity>
          </CoachmarkAnchor>
          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => router.replace('/')}
          >
            <Text style={[styles.textBtnLabel, { color: colors.onSurfaceMuted }]}>Return to Catalog</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const role = (user.role || '').toLowerCase();
  const isSupplierOrAdmin = role === 'supplier' || role === 'admin';

  // Logged in as customer (non-supplier)
  if (!isSupplierOrAdmin) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <MaterialIcon name="storefront" size={36} color="#F59E0B" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Supplier Account Required</Text>
          <Text style={[styles.cardSubtitle, { color: colors.onSurfaceMuted }]}>
            Your account ({user.email}) is currently registered as a buyer. To list products and manage wholesale inventory, apply to become a verified supplier.
          </Text>
          <CoachmarkAnchor id="apply_supplier_btn" style={{ width: '100%', marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginBottom: 0 }]}
              onPress={() => setShowBecomeSupplier(true)}
            >
              <Text style={styles.primaryBtnText}>Apply to Become a Supplier</Text>
            </TouchableOpacity>
          </CoachmarkAnchor>
          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => router.replace('/')}
          >
            <Text style={[styles.textBtnLabel, { color: colors.onSurfaceMuted }]}>Back to Shopping</Text>
          </TouchableOpacity>
        </View>

        <BecomeSupplierSheet
          visible={showBecomeSupplier}
          onClose={() => setShowBecomeSupplier(false)}
          onSuccess={() => setShowBecomeSupplier(false)}
        />
      </SafeAreaView>
    );
  }

  return <SupplierProductsScreen />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  centerCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 460,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  textBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textBtnLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
