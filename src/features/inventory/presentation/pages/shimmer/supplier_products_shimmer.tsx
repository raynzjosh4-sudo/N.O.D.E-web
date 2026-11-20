import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function SupplierProductsShimmer() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.scaffoldBackground }]}
    >
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        {/* Metric Cards Skeleton */}
        <View style={styles.metricsRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={`metric-${i}`}
              style={[styles.metricCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
            >
              <ShimmerBlock width={36} height={36} circle style={{ marginBottom: 10 }} />
              <ShimmerBlock width={60} height={22} borderRadius={6} />
              <ShimmerBlock width={80} height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>

        {/* Action Row Skeleton */}
        <View style={styles.actionsRow}>
          <ShimmerBlock width="60%" height={40} borderRadius={20} />
          <ShimmerBlock width={120} height={40} borderRadius={20} />
        </View>

        {/* Products Table Skeleton */}
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={`prod-item-${i}`}
              style={[styles.productRow, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
            >
              <ShimmerBlock width={54} height={54} borderRadius={12} />
              <View style={styles.productInfo}>
                <ShimmerBlock width="65%" height={16} borderRadius={4} />
                <ShimmerBlock width="45%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
                <ShimmerBlock width="30%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              </View>
              <ShimmerBlock width={30} height={30} borderRadius={15} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 60,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 960,
    gap: 16,
  },
  desktopContainer: {
    paddingVertical: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  list: {
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  productInfo: {
    flex: 1,
  },
});
