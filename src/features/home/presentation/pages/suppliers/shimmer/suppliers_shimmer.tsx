import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function SuppliersShimmer() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.root, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Top Filter Bar Skeleton */}
      <View style={[styles.filterBar, { borderBottomColor: colors.borderLight }]}>
        <ShimmerBlock height={36} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={styles.tabsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ShimmerBlock key={`tab-${i}`} width={70} height={28} borderRadius={14} />
          ))}
        </View>
      </View>

      {/* Table Container Skeleton */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <View style={[styles.table, { borderColor: colors.borderLight }]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`sup-row-${i}`}
              style={[
                styles.row,
                { borderBottomColor: colors.borderLight },
                i === 7 && { borderBottomWidth: 0 },
              ]}
            >
              <ShimmerBlock width={32} height={32} circle />
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <ShimmerBlock width={isDesktop ? 180 : 130} height={16} borderRadius={4} />
                  <ShimmerBlock width={50} height={14} borderRadius={8} />
                </View>
                <ShimmerBlock width={isDesktop ? 220 : 160} height={12} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  list: {
    paddingVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
