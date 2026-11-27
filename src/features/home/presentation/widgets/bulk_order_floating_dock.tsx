import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useBulkCart } from '@/features/inventory/context/bulk_cart_context';
import { useAppNavigation } from '@/core/utils/use_app_navigation';

interface BulkOrderFloatingDockProps {
  bottomInset?: number;
}

export function BulkOrderFloatingDock({ bottomInset = 16 }: BulkOrderFloatingDockProps) {
  const { colors, isDark } = useAppTheme();
  const { bulkProductIds, bulkCount, isBulkMode, clearBulkList, setBulkMode } = useBulkCart();
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  if (!isBulkMode && bulkCount === 0) return null;

  const handleProceed = () => {
    const idsParam = bulkProductIds.join(',');
    router.push(`/product/multi-order?ids=${idsParam}`);
  };

  const gitBorder = isDark ? '#30363D' : '#D0D7DE';
  const mutedText = isDark ? '#8B949E' : '#57606A';

  if (bulkCount === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            bottom: bottomInset,
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            borderColor: colors.primary,
            maxWidth: isDesktop ? 680 : undefined,
          },
        ]}
      >
        <View style={styles.leftCol}>
          <View style={[styles.badgeCircle, { backgroundColor: colors.primary }]}>
            <MaterialIcon name="playlist_add" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
              Make Bulk Order Mode Active
            </Text>
            <Text style={[styles.subtitle, { color: mutedText }]} numberOfLines={1}>
              Open each product you want &amp; tap "Add to Bulk List"
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setBulkMode(false)}
          style={[styles.exitBtn, { borderColor: gitBorder }]}
        >
          <Text style={[styles.exitBtnText, { color: mutedText }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomInset,
          backgroundColor: isDark ? '#161B22' : '#FFFFFF',
          borderColor: gitBorder,
          maxWidth: isDesktop ? 680 : undefined,
        },
      ]}
    >
      <View style={styles.leftCol}>
        <View style={[styles.badgeCircle, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{bulkCount}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {bulkCount === 1 ? '1 Product in Bulk List' : `${bulkCount} Products in Bulk List`}
          </Text>
          <Text style={[styles.subtitle, { color: mutedText }]} numberOfLines={1}>
            Pick colors &amp; sizes on order page
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={clearBulkList}
          style={[styles.clearIconBtn, { borderColor: gitBorder }]}
          accessibilityLabel="Clear bulk list"
        >
          <MaterialIcon name="close" size={16} color={mutedText} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleProceed}
          style={[styles.proceedBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.proceedBtnText}>Proceed to Order</Text>
          <MaterialIcon name="arrow_forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignSelf: 'center',
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  badgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 14,
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  exitBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
  },
});
