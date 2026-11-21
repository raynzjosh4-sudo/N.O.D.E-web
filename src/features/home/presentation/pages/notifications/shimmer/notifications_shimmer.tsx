import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ShimmerBlock } from '@/core/widgets/shimmer/shimmer_block';
import { useAppTheme } from '@/core/theme/theme_context';

export function NotificationsShimmer({ showFilters = true }: { showFilters?: boolean } = {}) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Category Pills Skeleton */}
      {showFilters && (
        <View style={[styles.filterRow, { borderBottomColor: colors.borderLight }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerBlock
              key={`pill-${i}`}
              width={i === 0 ? 56 : 80}
              height={30}
              borderRadius={20}
              style={styles.pill}
            />
          ))}
        </View>
      )}

      {/* Notification Cards Skeleton */}
      <View style={[styles.listCard, { backgroundColor: colors.cardColor }]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={`notif-skel-${i}`}
            style={[styles.notificationRow, { borderBottomColor: colors.borderLight }]}
          >
            {/* Left Circle Icon */}
            <ShimmerBlock width={46} height={46} circle style={styles.iconCircle} />

            {/* Middle Content */}
            <View style={styles.textContent}>
              {/* Top row: Title + Time */}
              <View style={styles.topRow}>
                <ShimmerBlock width="60%" height={15} borderRadius={4} />
                <ShimmerBlock width={44} height={12} borderRadius={4} />
              </View>

              {/* Message lines */}
              <ShimmerBlock
                width="95%"
                height={12}
                borderRadius={4}
                style={{ marginTop: 8 }}
              />
              <ShimmerBlock
                width="70%"
                height={12}
                borderRadius={4}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  pill: {
    marginRight: 2,
  },
  listCard: {
    width: '100%',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconCircle: {
    marginRight: 14,
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
});
