import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function ProductDetailShimmer() {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 960;
  const heroHeight = Math.min(height * 0.7, isDesktop ? 680 : 540);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.scaffoldBackground }]}
    >
      {/* Curved Hero Skeleton */}
      <View style={[styles.heroWrapper, { height: heroHeight, maxWidth: isDesktop ? 960 : '100%' }]}>
        <ShimmerBlock height={heroHeight - 12} borderRadius={32} />
      </View>

      {/* Media Row Skeleton */}
      <View style={[styles.section, isDesktop && styles.desktopSection]}>
        <ShimmerBlock width={80} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.mediaRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerBlock key={`media-skel-${i}`} width={130} height={190} borderRadius={18} />
          ))}
        </View>
      </View>

      {/* Explore Grid Skeleton */}
      <View style={[styles.section, isDesktop && styles.desktopSection, { marginTop: 20 }]}>
        <ShimmerBlock width={140} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={`grid-skel-${i}`} style={styles.gridItem}>
              <ShimmerBlock height={180} borderRadius={16} />
              <ShimmerBlock width="80%" height={14} borderRadius={4} style={{ marginTop: 10 }} />
              <ShimmerBlock width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  heroWrapper: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  section: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  desktopSection: {
    maxWidth: 960,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
});
