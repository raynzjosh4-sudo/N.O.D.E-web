import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function ProfileShimmer() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.scaffoldBackground }]}
    >
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        {/* User Card Skeleton */}
        <View style={[styles.card, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <ShimmerBlock width={72} height={72} circle />
          <View style={styles.cardInfo}>
            <ShimmerBlock width={160} height={20} borderRadius={6} />
            <ShimmerBlock width={220} height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <ShimmerBlock width={80} height={22} borderRadius={11} style={{ marginTop: 10 }} />
          </View>
        </View>

        {/* Tab Bar Skeleton */}
        <View style={styles.tabsRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerBlock key={`tab-${i}`} width="23%" height={38} borderRadius={19} />
          ))}
        </View>

        {/* Content List Skeleton */}
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={`item-${i}`}
              style={[styles.listItem, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
            >
              <ShimmerBlock width={64} height={64} borderRadius={12} />
              <View style={styles.listInfo}>
                <ShimmerBlock width="70%" height={16} borderRadius={4} />
                <ShimmerBlock width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
                <ShimmerBlock width="30%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export function ProfileTabShimmer() {
  const { colors } = useAppTheme();

  return (
    <View style={styles.tabShimmerContainer}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={`tab-item-${i}`}
          style={[styles.listItem, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
        >
          <ShimmerBlock width={64} height={64} borderRadius={10} />
          <View style={styles.listInfo}>
            <ShimmerBlock width="65%" height={16} borderRadius={4} />
            <ShimmerBlock width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <ShimmerBlock width={80} height={18} borderRadius={9} />
              <ShimmerBlock width={100} height={18} borderRadius={9} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabShimmerContainer: {
    padding: 16,
    gap: 12,
  },
  scroll: {
    padding: 16,
    paddingBottom: 60,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 800,
    gap: 16,
  },
  desktopContainer: {
    paddingVertical: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  cardInfo: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  listInfo: {
    flex: 1,
  },
});
