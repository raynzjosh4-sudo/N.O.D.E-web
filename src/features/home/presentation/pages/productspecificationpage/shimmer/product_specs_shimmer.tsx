import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function ProductSpecsShimmer() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.scaffoldBackground }]}
    >
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        {/* Top Product Summary Card Skeleton */}
        <View style={[styles.headerCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <ShimmerBlock width={100} height={100} borderRadius={16} />
          <View style={styles.headerInfo}>
            <ShimmerBlock width="80%" height={20} borderRadius={6} />
            <ShimmerBlock width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <ShimmerBlock width="60%" height={18} borderRadius={6} style={{ marginTop: 12 }} />
          </View>
        </View>

        {/* Wholesale Price Tiers Skeleton */}
        <View style={styles.section}>
          <ShimmerBlock width={150} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={styles.tierRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <ShimmerBlock key={`tier-${i}`} width="31%" height={68} borderRadius={12} />
            ))}
          </View>
        </View>

        {/* Color Palette Skeleton */}
        <View style={styles.section}>
          <ShimmerBlock width={120} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={styles.chipRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={`col-${i}`} width={70} height={36} borderRadius={18} />
            ))}
          </View>
        </View>

        {/* Size Selector Skeleton */}
        <View style={styles.section}>
          <ShimmerBlock width={100} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={styles.chipRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ShimmerBlock key={`size-${i}`} width={56} height={36} borderRadius={8} />
            ))}
          </View>
        </View>

        {/* Action Buttons Skeleton */}
        <View style={styles.actions}>
          <ShimmerBlock height={50} borderRadius={25} />
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
    maxWidth: 720,
    gap: 20,
  },
  desktopContainer: {
    paddingVertical: 20,
  },
  headerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  section: {
    width: '100%',
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actions: {
    marginTop: 16,
  },
});
