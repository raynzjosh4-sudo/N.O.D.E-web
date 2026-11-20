import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { Supplier } from '@/features/home/domain/entities/supplier';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { ProductMapper } from '@/features/inventory/data/mappers/product_mapper';

const DEFAULT_CATEGORIES = [
  'All',
  'Fashion',
  'Electronics',
  'Home & Living',
  'Manufacturing',
  'Food & Beverage',
  'Groceries',
];

/** Strip garbled GPS / emoji chars from location strings */
function cleanLocation(raw: string | undefined | null): string {
  if (!raw) return '';
  // Remove emoji, control chars, raw coordinates like "0.341, 32.583", "right 😂" etc.
  const stripped = raw
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // emoji ranges
    .replace(/[\u0300-\u036F]/g, '')           // combining diacritics
    .replace(/Loc:\s*[\d.]+\s*,\s*[\d.]+/gi, '') // GPS coord literals
    .replace(/,\s*right\b/gi, '')              // ", right" junk from map picker
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped;
}

/** Build a compact, clean location label: "City, Region" only */
function formatLocation(supplier: Supplier): string {
  const raw = supplier.location ?? '';
  // Try to extract city + region if the string is sane
  const cleaned = cleanLocation(raw);
  // If it still looks like GPS coords, just show "East Africa"
  if (/\d+\.\d+/.test(cleaned) || cleaned.length < 2) return 'East Africa';
  // If too long (> 40 chars) truncate to first two comma-parts
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  return cleaned.slice(0, 40);
}

export function AllSuppliersScreen() {
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 768;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    ProductApiService.getSuppliers()
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((dto) => ProductMapper.fromSupplierDto(dto));
        setSuppliers(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load suppliers:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => {
    const dynamicCats = new Set<string>();
    suppliers.forEach((s) => { if (s.category) dynamicCats.add(s.category); });
    if (dynamicCats.size === 0) return DEFAULT_CATEGORIES;
    return ['All', ...Array.from(dynamicCats)];
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesCategory =
        selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [suppliers, selectedCategory, searchQuery]);

  // GitHub-style border color
  const border = colors.borderLight;
  const muted = colors.onSurfaceMuted;
  const accent = '#54AEFF';        // GitHub blue link color
  const bg = colors.scaffoldBackground;
  const surface = colors.surface;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <View style={[styles.root, { backgroundColor: bg }]}>
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>

          {/* ── Top bar ── */}
          <View style={[styles.topbar, { backgroundColor: surface, borderBottomColor: border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backBtn}
              onPress={() => router.safeGoBack('/')}
            >
              <MaterialIcon name="arrow_back" size={18} color={colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={[styles.pageTitle, { color: colors.onSurface }]}>All Suppliers</Text>
              <Text style={[styles.pageSubtitle, { color: muted }]}>
                {loading ? 'Loading…' : `${filteredSuppliers.length} Verified East African Distributors`}
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          {/* ── Search + Category tabs ── */}
          <View style={[styles.filterBar, { backgroundColor: surface, borderBottomColor: border }]}>
            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: bg, borderColor: border }]}>
              <MaterialIcon name="search" size={16} color={muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search suppliers by name, category, hub…"
                placeholderTextColor={muted}
                style={[styles.searchInput, { color: colors.onSurface }]}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcon name="close" size={14} color={muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category tabs — GitHub-style underline tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.75}
                    style={[
                      styles.tab,
                      isActive && { borderBottomColor: '#F7881B', borderBottomWidth: 2 },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[
                      styles.tabText,
                      { color: isActive ? colors.onSurface : muted },
                      isActive && styles.tabTextActive,
                    ]}>
                      {cat}
                    </Text>
                    {isActive && (
                      <View style={[styles.countPill, { backgroundColor: 'rgba(247,136,27,0.15)' }]}>
                        <Text style={[styles.countPillText, { color: '#F7881B' }]}>
                          {filteredSuppliers.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Table header (desktop) ── */}
          {isDesktop && !loading && filteredSuppliers.length > 0 && (
            <View style={[styles.tableHead, { backgroundColor: colors.cardColor, borderColor: border }]}>
              <Text style={[styles.tableHeadCell, { color: muted, flex: 2 }]}>Supplier</Text>
              <Text style={[styles.tableHeadCell, { color: muted, flex: 1 }]}>Category</Text>
              <Text style={[styles.tableHeadCell, { color: muted, flex: 1 }]}>Location</Text>
              <Text style={[styles.tableHeadCell, { color: muted, width: 80, textAlign: 'right' }]}>Status</Text>
            </View>
          )}

          {/* ── List ── */}
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyText, { color: muted, marginTop: 12 }]}>Loading verified suppliers…</Text>
            </View>
          ) : filteredSuppliers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcon name="storefront" size={40} color={muted} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Suppliers Found</Text>
              <Text style={[styles.emptyText, { color: muted }]}>
                Nothing matches "{searchQuery}". Try a different search or category.
              </Text>
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: border }]}
                onPress={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              >
                <Text style={[styles.resetBtnText, { color: colors.onSurface }]}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              {/* GitHub-style flat directory rows */}
              <View style={[styles.table, { borderColor: border }]}>
                {filteredSuppliers.map((supplier, idx) => {
                  const isLast = idx === filteredSuppliers.length - 1;
                  const loc = formatLocation(supplier);
                  return (
                    <TouchableOpacity
                      key={supplier.id}
                      activeOpacity={0.6}
                      style={[
                        styles.row,
                        { borderBottomColor: border },
                        isLast && styles.rowLast,
                      ]}
                      onPress={() => router.push({
                        pathname: '/product/[id]',
                        params: { id: 'supplier', supplierId: supplier.id },
                      })}
                    >
                      {/* Avatar */}
                      <View style={[styles.avatar, { borderColor: border, backgroundColor: colors.cardColor }]}>
                        {supplier.imageUrl ? (
                          <Image source={{ uri: supplier.imageUrl }} style={styles.avatarImg} />
                        ) : (
                          <Text style={[styles.avatarInitial, { color: accent }]}>
                            {supplier.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {isDesktop ? (
                        /* Desktop: columnar layout matching table head */
                        <>
                          <View style={{ flex: 2 }}>
                            <Text style={[styles.supplierName, { color: accent }]} numberOfLines={1}>
                              {supplier.name}
                            </Text>
                            <Text style={[styles.rowMeta, { color: muted }]}>
                              {supplier.productCount || 50}+ products
                            </Text>
                          </View>
                          <Text style={[styles.rowCell, { color: muted, flex: 1 }]} numberOfLines={1}>
                            {supplier.category}
                          </Text>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {loc ? (
                              <>
                                <MaterialIcon name="location_on" size={12} color={muted} />
                                <Text style={[styles.rowCell, { color: muted }]} numberOfLines={1}>{loc}</Text>
                              </>
                            ) : null}
                          </View>
                          <View style={[styles.activeDot, { width: 80, justifyContent: 'flex-end' }]}>
                            <View style={[styles.statusDot, { backgroundColor: '#2EA043' }]} />
                            <Text style={[styles.statusText, { color: '#2EA043' }]}>Active</Text>
                          </View>
                        </>
                      ) : (
                        /* Mobile: stacked */
                        <View style={styles.rowContent}>
                          <View style={styles.rowTop}>
                            <Text style={[styles.supplierName, { color: accent }]} numberOfLines={1}>
                              {supplier.name}
                            </Text>
                            <View style={styles.activeDot}>
                              <View style={[styles.statusDot, { backgroundColor: '#2EA043' }]} />
                              <Text style={[styles.statusText, { color: '#2EA043' }]}>Active</Text>
                            </View>
                          </View>
                          <Text style={[styles.rowMeta, { color: muted }]} numberOfLines={1}>
                            {supplier.category} · {supplier.productCount || 50}+ products
                          </Text>
                          {loc ? (
                            <View style={styles.locRow}>
                              <MaterialIcon name="location_on" size={12} color={muted} />
                              <Text style={[styles.rowCell, { color: muted }]} numberOfLines={1}>{loc}</Text>
                            </View>
                          ) : null}
                        </View>
                      )}

                      <View style={{ marginLeft: 4 }}>
                        <MaterialIcon name="chevron_right" size={18} color={border} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
  },
  innerDesktop: {},

  // ── Top bar ──
  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  pageSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 1,
  },

  // ── Filter bar ──
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderBottomWidth: 1,
    gap: 0,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    paddingVertical: 0,
    height: '100%',
    outlineStyle: 'none' as any,
  },
  tabsList: {
    gap: 0,
    paddingBottom: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  tabTextActive: {
    fontFamily: 'Outfit_700Bold',
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
  },

  // ── Table header ──
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableHeadCell: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── GitHub directory rows ──
  table: {
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  supplierName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  rowMeta: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  rowCell: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  activeDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
    maxWidth: 300,
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
});
