import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface SearchHistoryViewProps {
  recentSearches: string[];
  onSelect: (query: string) => void;
  onDelete: (query: string) => void;
  onClearAll: () => void;
  onCancel: () => void;
  popularSuggestions?: string[];
}

const DEFAULT_POPULAR = [
  'Apple iPad Air',
  'Solar Inverters',
  'Commercial Blender',
  'Lenovo ThinkPad',
  'Nike Air Max',
  'Organic Basmati Rice',
  'Industrial Generators',
  'Smart 4K TVs',
];

export function SearchHistoryView({
  recentSearches,
  onSelect,
  onDelete,
  onClearAll,
  onCancel,
  popularSuggestions = DEFAULT_POPULAR,
}: SearchHistoryViewProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 1. Recent Searches Header ──────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Recent Searches</Text>
          {recentSearches.length > 0 && (
            <TouchableOpacity activeOpacity={0.7} onPress={onClearAll}>
              <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 2. Recent Searches List or Empty State ───────────────────────────── */}
        {recentSearches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.cardColor }]}>
              <MaterialIcon
                name="search_off"
                size={36}
                color={colors.onSurfaceMuted}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.onSurface }]}>No recent searches</Text>
            <Text style={[styles.emptySubtext, { color: colors.onSurfaceMuted }]}>
              Search for wholesale electronics, hardware, apparel, or bulk commodities
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {recentSearches.map((item, index) => (
              <View key={`${item}-${index}`} style={[styles.historyItemRow, { borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.historyItemMain}
                  onPress={() => onSelect(item)}
                >
                  <View style={[styles.historyIconWrapper, { backgroundColor: colors.scaffoldBackground }]}>
                    <MaterialIcon
                      name="history"
                      size={18}
                      color={colors.onSurfaceMuted}
                    />
                  </View>
                  <Text style={[styles.historyItemText, { color: colors.onSurface }]} numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>

                {/* Remove single entry */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.deleteButton}
                  onPress={() => onDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcon
                    name="close"
                    size={16}
                    color={colors.onSurfaceMuted}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── 3. Trending / Popular Wholesale Tags ────────────────────────────── */}
        <View style={[styles.popularSection, { borderTopColor: colors.borderLight }]}>
          <View style={styles.popularHeaderRow}>
            <MaterialIcon name="trending_up" size={18} color={colors.primary} />
            <Text style={[styles.popularHeaderTitle, { color: colors.onSurface }]}>Trending Wholesale Searches</Text>
          </View>
          <View style={styles.tagWrap}>
            {popularSuggestions.map((tag, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                style={[styles.tagChip, { backgroundColor: colors.cardColor, borderColor: colors.primary + '33' }]}
                onPress={() => onSelect(tag)}
              >
                <MaterialIcon
                  name="search"
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.tagText, { color: colors.onSurface }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 4. Back to Explore CTA ─────────────────────────────────────────── */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.backToExploreButton, { backgroundColor: colors.primary }]}
            onPress={onCancel}
          >
            <MaterialIcon
              name="arrow_back"
              size={16}
              color="rgba(28, 27, 31, 0.7)"
            />
            <Text style={styles.backToExploreText}>Back to Explore</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: AppColors.surfaceWhite,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(28, 27, 31, 0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(28, 27, 31, 0.4)',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.3)',
    textAlign: 'center',
    maxWidth: 280,
  },
  historyList: {
    marginBottom: 20,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.05)',
  },
  historyItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: AppColors.onSurface,
  },
  deleteButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularSection: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 27, 31, 0.06)',
  },
  popularHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  popularHeaderTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    letterSpacing: 0.2,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F2FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(18, 187, 240, 0.12)',
  },
  tagText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: AppColors.onSurface,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  backToExploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    borderRadius: 24,
  },
  backToExploreText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(28, 27, 31, 0.7)',
  },
});
