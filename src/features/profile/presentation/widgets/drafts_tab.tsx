import React, { useState } from 'react';
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
  onDeleteMultipleDrafts?: (ids: string[]) => void;
}

export function DraftsTab({
  drafts,
  onContinueDraft,
  onDeleteDraft,
  onDeleteMultipleDrafts,
}: DraftsTabProps) {
  const { colors } = useAppTheme();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = drafts.length > 0 && selectedIds.size === drafts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;
    if (onDeleteMultipleDrafts) {
      onDeleteMultipleDrafts(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteDraft(id));
    }
    setSelectedIds(new Set());
  };

  const formatPrice = (val: number) => {
    return 'UGX ' + (val || 0).toLocaleString('en-US');
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
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* ── Selection Control Bar ── */}
      <View style={styles.selectionBanner}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleSelectAll}
          style={styles.selectAllBtn}
        >
          <View style={[styles.checkbox, isAllSelected && styles.checkboxActive]}>
            {isAllSelected && <MaterialIcon name="check" size={12} color="#FFFFFF" />}
          </View>
          <Text style={[styles.selectAllText, { color: colors.onSurface }]}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>

        <View style={styles.selectionPill}>
          <Text style={styles.selectionCountText}>
            {selectedIds.size > 0 ? `${selectedIds.size} of ${drafts.length} selected` : `${drafts.length} drafts saved`}
          </Text>
        </View>

        {selectedIds.size > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDeleteSelected}
            style={styles.deleteSelectedBtn}
          >
            <MaterialIcon name="delete" size={15} color="#D32F2F" />
            <Text style={styles.deleteSelectedText}>Delete ({selectedIds.size})</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {drafts.map((draft) => {
          const isSelected = selectedIds.has(draft.id);

          return (
            <View
              key={draft.id}
              style={[
                styles.draftCard,
                isSelected && styles.draftCardSelected,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                {/* Select Checkbox */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.checkboxTouch}
                  onPress={() => toggleSelect(draft.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <MaterialIcon name="check" size={12} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>

                <View style={styles.badgeSupplierRow}>
                  <View style={[styles.draftPill, { backgroundColor: colors.scaffoldBackground }]}>
                    <Text style={[styles.draftPillText, { color: colors.onSurfaceMuted }]}>DRAFT</Text>
                  </View>
                  <Text style={[styles.supplierText, { color: colors.onSurfaceMuted }]}>{draft.supplierName}</Text>
                </View>

                {/* Individual Delete Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onDeleteDraft(draft.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.trashBtn}
                >
                  <MaterialIcon
                    name="delete_outline"
                    size={18}
                    color="#D32F2F"
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
                  <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Est. Value</Text>
                  <Text style={[styles.statValue, { color: AppColors.primary }]}>
                    {formatPrice(draft.estimatedTotal)}
                  </Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.timeAgoText}>Updated {getTimeAgo(draft.updatedAt)}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.continueBtn}
                  onPress={() => onContinueDraft(draft)}
                >
                  <Text style={styles.continueBtnText}>Resume Order</Text>
                  <MaterialIcon name="arrow_forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 187, 240, 0.15)',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  selectionPill: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  selectionCountText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteSelectedText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: '#D32F2F',
  },
  checkboxTouch: {
    marginRight: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(28, 27, 31, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  draftCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  draftCardSelected: {
    backgroundColor: 'rgba(18, 187, 240, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeSupplierRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashBtn: {
    padding: 4,
    borderRadius: 4,
  },
  draftPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draftPillText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  supplierText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  draftTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeAgoText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.4)',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  continueBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
