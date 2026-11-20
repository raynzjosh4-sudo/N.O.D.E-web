import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function CategoriesShimmer() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  if (isDesktop) {
    return (
      <View style={[styles.desktopRoot, { backgroundColor: colors.scaffoldBackground }]}>
        {/* Left Sidebar Skeleton */}
        <View style={[styles.desktopSidebar, { borderRightColor: colors.borderLight }]}>
          <View style={styles.sidebarHeader}>
            <ShimmerBlock width={120} height={18} borderRadius={4} />
          </View>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`cat-side-${i}`} style={styles.sidebarRow}>
              <ShimmerBlock width={32} height={32} circle />
              <ShimmerBlock width={110} height={14} borderRadius={4} style={{ marginLeft: 12 }} />
            </View>
          ))}
        </View>

        {/* Center / Right Content Skeleton */}
        <View style={styles.desktopContent}>
          <View style={styles.contentHeader}>
            <ShimmerBlock width={180} height={26} borderRadius={6} />
            <ShimmerBlock width={260} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          </View>

          <View style={styles.gridRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={`cat-grid-${i}`} style={styles.gridCard}>
                <ShimmerBlock height={140} borderRadius={16} />
                <ShimmerBlock width="70%" height={16} borderRadius={4} style={{ marginTop: 12 }} />
                <ShimmerBlock width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Mobile Drilldown List Skeleton
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.mobileList}
    >
      <View style={styles.mobileTopBar}>
        <ShimmerBlock width={140} height={22} borderRadius={6} />
      </View>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={`cat-row-${i}`} style={[styles.mobileRow, { borderBottomColor: colors.borderLight }]}>
          <ShimmerBlock width={42} height={42} circle />
          <View style={styles.rowText}>
            <ShimmerBlock width="55%" height={16} borderRadius={4} />
            <ShimmerBlock width="35%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <ShimmerBlock width={20} height={20} borderRadius={4} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopSidebar: {
    width: 280,
    borderRightWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  sidebarHeader: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sidebarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  desktopContent: {
    flex: 1,
    padding: 24,
  },
  contentHeader: {
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: '48%',
    padding: 12,
  },
  mobileList: {
    paddingVertical: 16,
  },
  mobileTopBar: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    marginLeft: 14,
  },
});
