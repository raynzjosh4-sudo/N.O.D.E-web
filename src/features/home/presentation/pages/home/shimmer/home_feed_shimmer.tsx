import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import {
  FeaturedCategoryShimmer,
  QuickSelectionsShimmer,
  PopularSectionShimmer,
} from '@/features/home/presentation/widgets/shimmer/home_widgets_shimmer';

export function HomeFeedShimmer() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Banner Skeleton */}
      <View style={styles.bannerWrap}>
        <ShimmerBlock height={140} borderRadius={16} />
      </View>

      {/* Suppliers Skeleton */}
      <QuickSelectionsShimmer />

      {/* Featured Category Skeleton */}
      <FeaturedCategoryShimmer />

      {/* Popular Mini-Cards Skeleton */}
      <PopularSectionShimmer />

      {/* Waterfall Grid Skeleton */}
      <View style={styles.gridWrap}>
        {Array.from({ length: isDesktop ? 8 : 4 }).map((_, i) => (
          <View key={`grid-home-${i}`} style={[styles.gridCard, { width: isDesktop ? '23%' : '48%' }]}>
            <ShimmerBlock height={190} borderRadius={18} />
            <ShimmerBlock width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <ShimmerBlock width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  bannerWrap: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridCard: {
    marginBottom: 12,
  },
});
