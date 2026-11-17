import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { WholesaleOrderItem } from '../../domain/entities/profile_models';

interface SentOrdersTabProps {
  orders: WholesaleOrderItem[];
  onTrackOrder?: (order: WholesaleOrderItem) => void;
  onViewInvoice?: (order: WholesaleOrderItem) => void;
}

export function SentOrdersTab({
  orders,
  onTrackOrder,
  onViewInvoice,
}: SentOrdersTabProps) {
  const { colors } = useAppTheme();
  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcon
            name="local_shipping"
            size={40}
            color="rgba(28, 27, 31, 0.2)"
          />
        </View>
        <Text style={styles.emptyTitle}>No sent or completed orders</Text>
        <Text style={styles.emptySubtitle}>
          Dispatched freight, confirmed deliveries, and historical wholesale orders will appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollList}
    >
      {orders.map((order) => {
        const isCompleted = order.status === 'completed';
        const badgeColor = isCompleted ? '#2E7D32' : AppColors.primary;
        const badgeBg = isCompleted ? '#E8F5E9' : 'rgba(18, 187, 240, 0.08)';
        const badgeLabel = isCompleted ? 'DELIVERED & VERIFIED' : 'DISPATCHED IN TRANSIT';

        return (
          <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            {/* ── Order Header Row ── */}
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={[styles.orderNumberText, { color: colors.onSurface }]}>{order.orderNumber}</Text>
                <Text style={[styles.orderDateText, { color: colors.onSurfaceMuted }]}>
                  Dispatched {formatDate(order.date)}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                  {badgeLabel}
                </Text>
              </View>
            </View>

            {/* ── Tracking Info & Destination ── */}
            <View style={[styles.trackingBox, { backgroundColor: colors.scaffoldBackground }]}>
              {order.trackingNumber && (
                <View style={styles.trackingChip}>
                  <MaterialIcon
                    name="local_shipping"
                    size={15}
                    color={colors.primary}
                  />
                  <Text style={[styles.trackingCodeText, { color: colors.primary }]}>
                    {order.trackingNumber}
                  </Text>
                </View>
              )}

              <View style={styles.destinationRow}>
                <MaterialIcon
                  name="location_on"
                  size={14}
                  color={colors.onSurfaceMuted}
                />
                <Text style={[styles.destinationText, { color: colors.onSurfaceMuted }]}>
                  {order.warehouseDestination}
                </Text>
              </View>
            </View>

            {/* ── Summary Text ── */}
            <Text style={[styles.summaryText, { color: colors.onSurface }]}>{order.itemSummary}</Text>

            {/* ── Footer ── */}
            <View style={styles.orderFooterRow}>
              <View>
                <Text style={[styles.totalUnitsText, { color: colors.onSurfaceMuted }]}>
                  {order.totalUnits} Units Fulfilled
                </Text>
                <Text style={[styles.totalAmountText, { color: colors.onSurface }]}>
                  {formatPrice(order.totalAmount)}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                {onViewInvoice && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.invoiceBtn}
                    onPress={() => onViewInvoice(order)}
                  >
                    <MaterialIcon
                      name="picture_as_pdf"
                      size={15}
                      color="#E53935"
                    />
                    <Text style={styles.invoiceText}>Invoice PDF</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.trackBtn}
                  onPress={() => onTrackOrder?.(order)}
                >
                  <MaterialIcon
                    name="map"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.trackText}>Track Pallet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderNumberText: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  orderDateText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  trackingBox: {
    backgroundColor: 'rgba(28, 27, 31, 0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  trackingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingCodeText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  destinationText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.65)',
  },
  summaryText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: AppColors.onSurface,
    lineHeight: 18,
    marginBottom: 12,
  },
  orderFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 27, 31, 0.05)',
    paddingTop: 10,
  },
  totalUnitsText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
  },
  totalAmountText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  invoiceText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#E53935',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  trackText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.45)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
