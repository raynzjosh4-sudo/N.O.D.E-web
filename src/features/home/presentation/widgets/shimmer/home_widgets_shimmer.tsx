import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';

export function FeaturedCategoryShimmer() {
  return (
    <View style={styles.card}>
      <ShimmerBlock height={280} borderRadius={28} />
    </View>
  );
}

export function QuickSelectionsShimmer() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalList}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`quick-skel-${i}`} style={styles.quickItem}>
          <ShimmerBlock width={64} height={64} circle />
          <ShimmerBlock width={54} height={12} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      ))}
    </ScrollView>
  );
}

export function PopularSectionShimmer() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalList}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`pop-skel-${i}`} style={styles.popularCard}>
          <ShimmerBlock width={64} height={64} borderRadius={12} />
          <View style={styles.popularInfo}>
            <ShimmerBlock width={90} height={14} borderRadius={4} />
            <ShimmerBlock width={60} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            <ShimmerBlock width={70} height={14} borderRadius={4} style={{ marginTop: 10 }} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  quickItem: {
    alignItems: 'center',
    width: 72,
  },
  popularCard: {
    flexDirection: 'row',
    width: 220,
    padding: 10,
    gap: 12,
  },
  popularInfo: {
    flex: 1,
    justifyContent: 'center',
  },
});
