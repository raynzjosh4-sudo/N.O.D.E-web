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
import { DraftOrder } from '../../domain/entities/profile_models';

interface DraftsTabProps {
  drafts: DraftOrder[];
  onContinueDraft: (draft: DraftOrder) => void;
  onDeleteDraft: (id: string) => void;
}

export function DraftsTab({
  drafts,
  onContinueDraft,
  onDeleteDraft,
}: DraftsTabProps) {
  const { colors } = useAppTheme();
  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (drafts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcon
            name="inventory_2"
            size={40}
            color="rgba(28, 27, 31, 0.2)"
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Draft Orders</Text>
        <Text style={styles.emptySubtitle}>
          Incomplete wholesale order sheets are automatically saved here so you can resume them at any time.
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
      {drafts.map((draft) => (
        <View key={draft.id} style={[styles.draftCard, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgeSupplierRow}>
              <View style={[styles.draftPill, { backgroundColor: colors.scaffoldBackground }]}>
                <Text style={[styles.draftPillText, { color: colors.onSurfaceMuted }]}>DRAFT</Text>
              </View>
              <Text style={[styles.supplierText, { color: colors.onSurfaceMuted }]}>{draft.supplierName}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onDeleteDraft(draft.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcon
                name="close"
                size={18}
                color={colors.onSurfaceMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.draftTitle, { color: colors.onSurface }]}>{draft.title}</Text>

          <View style={[styles.statsRow, { backgroundColor: colors.scaffoldBackground }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Items</Text>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{draft.itemsCount} products</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Volume</Text>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{draft.totalUnits} units</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Estimated Total</Text>
              <Text style={[styles.statTotalValue, { color: colors.primary }]}>
                {formatPrice(draft.estimatedTotal)}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.updatedText, { color: colors.onSurfaceMuted }]}>
              Saved {getTimeAgo(draft.updatedAt)}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.continueButton, { backgroundColor: colors.primary }]}
              onPress={() => onContinueDraft(draft)}
            >
              <Text style={styles.continueText}>Continue Order</Text>
              <MaterialIcon name="arrow_forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  scrollList: {
    paddingBottom: 40,
  },
  draftCard: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeSupplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftPill: {
    backgroundColor: 'rgba(28, 27, 31, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  draftPillText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.6)',
  },
  supplierText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  draftTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 27, 31, 0.03)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(28, 27, 31, 0.08)',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(28, 27, 31, 0.45)',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginTop: 2,
  },
  statTotalValue: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updatedText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.4)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  continueText: {
    fontSize: 12,
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
    borderRadius: 6,
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
