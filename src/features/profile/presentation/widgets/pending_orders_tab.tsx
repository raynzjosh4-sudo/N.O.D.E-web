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

interface PendingOrdersTabProps {
  orders: WholesaleOrderItem[];
  onOrderPress?: (order: WholesaleOrderItem) => void;
  onDownloadInvoice?: (order: WholesaleOrderItem) => void;
}

export function PendingOrdersTab({
  orders,
  onOrderPress,
  onDownloadInvoice,
}: PendingOrdersTabProps) {
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
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcon
            name="hourglass_empty"
            size={40}
            color="rgba(28, 27, 31, 0.2)"
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No pending orders</Text>
        <Text style={styles.emptySubtitle}>
          Orders awaiting supplier confirmation, stock allocation, or payment verification will appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollList}
    >
      {orders.map((order) => {
        const isProcessing = order.status === 'processing';
        const badgeColor = isProcessing ? '#0288D1' : '#F57C00';
        const badgeBg = isProcessing ? '#E1F5FE' : '#FFF3E0';
        const badgeLabel = isProcessing ? 'PROCESSING' : 'PENDING REVIEW';

        return (
          <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.cardColor, borderColor: colors.cardBorder }]}>
            {/* ── Order Top Bar: Number + Status ── */}
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={[styles.orderNumberText, { color: colors.onSurface }]}>{order.orderNumber}</Text>
                <Text style={[styles.orderDateText, { color: colors.onSurfaceMuted }]}>
                  Placed on {formatDate(order.date)}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                  {badgeLabel}
                </Text>
              </View>
            </View>

            {/* ── Supplier & Destination ── */}
            <View style={styles.logisticsRow}>
              <View style={styles.logisticsItem}>
                <MaterialIcon
                  name="store"
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.logisticsText, { color: colors.onSurfaceMuted }]}>{order.supplierName}</Text>
              </View>

              <View style={styles.logisticsItem}>
                <MaterialIcon
                  name="warehouse"
                  size={14}
                  color={colors.onSurfaceMuted}
                />
                <Text style={[styles.logisticsText, { color: colors.onSurfaceMuted }]}>
                  {order.warehouseDestination}
                </Text>
              </View>
            </View>

            {/* ── Item Summary ── */}
            <View style={[styles.summaryBox, { backgroundColor: colors.scaffoldBackground }]}>
              <Text style={[styles.summaryText, { color: colors.onSurface }]}>{order.itemSummary}</Text>
            </View>

            {/* ── Footer: Total Units + Amount + Action ── */}
            <View style={styles.orderFooterRow}>
              <View>
                <Text style={[styles.totalUnitsText, { color: colors.onSurfaceMuted }]}>
                  {order.totalUnits} Units
                </Text>
                <Text style={[styles.totalAmountText, { color: colors.onSurface }]}>
                  {formatPrice(order.totalAmount)}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                {onDownloadInvoice && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.proformaBtn}
                    onPress={() => onDownloadInvoice(order)}
                  >
                    <MaterialIcon
                      name="description"
                      size={15}
                      color={colors.primary}
                    />
                    <Text style={[styles.proformaText, { color: colors.primary }]}>Proforma PDF</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.detailsBtn}
                  onPress={() => onOrderPress?.(order)}
                >
                  <Text style={styles.detailsText}>Details</Text>
                  <MaterialIcon
                    name="arrow_forward"
                    size={14}
                    color="#FFFFFF"
                  />
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
  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  logisticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logisticsText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.7)',
  },
  summaryBox: {
    backgroundColor: 'rgba(28, 27, 31, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: AppColors.onSurface,
    lineHeight: 16,
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
  proformaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  proformaText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  detailsText: {
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
