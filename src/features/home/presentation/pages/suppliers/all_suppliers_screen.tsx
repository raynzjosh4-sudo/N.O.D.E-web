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
import { AppColors } from '@/core/theme/app_theme';
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

export function AllSuppliersScreen() {
  const router = useAppNavigation();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 960;

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
        console.warn('Failed to load suppliers in AllSuppliersScreen:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const dynamicCats = new Set<string>();
    suppliers.forEach((s) => {
      if (s.category) dynamicCats.add(s.category);
    });
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.contentWrapper}>
          {/* ── Top Header Bar ── */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.backButton, { backgroundColor: colors.cardColor }]}
              onPress={() => router.safeGoBack('/')}
            >
              <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.headerTitleBlock}>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>All Suppliers</Text>
              <Text style={[styles.headerSubtitle, { color: colors.onSurfaceMuted }]}>
                {loading ? 'Loading...' : `${filteredSuppliers.length} Verified East African Distributors`}
              </Text>
            </View>

            <View style={{ width: 36 }} />
          </View>

          {/* ── Quick Search & Category Bar ── */}
          <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
            {/* Search Input */}
            <View style={[styles.searchBar, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
              <MaterialIcon name="search" size={18} color={colors.onSurfaceMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search suppliers by name, category, hub..."
                placeholderTextColor={colors.onSurfaceMuted}
                style={[styles.searchInput, { color: colors.onSurface }]}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcon name="close" size={16} color={colors.onSurfaceMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Horizontal Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsList}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.75}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.cardColor,
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? '#FFFFFF' : colors.onSurfaceMuted },
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Supplier List / Desktop Grid ── */}
          {loading ? (
            <View style={[styles.emptyState, { paddingTop: 60 }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted, marginTop: 12 }]}>
                Loading verified suppliers...
              </Text>
            </View>
          ) : filteredSuppliers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.cardColor }]}>
                <MaterialIcon name="storefront" size={42} color={colors.onSurfaceMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Suppliers Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
                No verified supplier matches "{searchQuery}". Try selecting another category or clearing your search.
              </Text>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollList,
                isDesktop && styles.desktopGridContainer,
              ]}
            >
              {filteredSuppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  activeOpacity={0.75}
                  style={[
                    styles.supplierCard,
                    isDesktop && styles.desktopSupplierCard,
                    { backgroundColor: colors.cardColor, borderColor: colors.borderLight },
                  ]}
                  onPress={() => router.push(`/explore`)}
                >
                  {/* Avatar / Brand Logo */}
                  <View style={[styles.avatarWrapper, { borderColor: colors.borderLight, backgroundColor: colors.surfaceContainerHighest }]}>
                    {supplier.imageUrl ? (
                      <Image source={{ uri: supplier.imageUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={[styles.supplierInitial, { color: colors.primary }]}>
                        {supplier.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Supplier Info */}
                  <View style={styles.supplierInfo}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.supplierName, { color: colors.onSurface }]} numberOfLines={1}>
                        {supplier.name}
                      </Text>
                      <View style={styles.activeBadge}>
                        <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
                      </View>
                    </View>

                    <Text style={[styles.supplierCategory, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                      {supplier.category} • {supplier.productCount || 80}+ Products
                    </Text>

                    {supplier.location && (
                      <View style={styles.locationRow}>
                        <MaterialIcon name="location_on" size={13} color={colors.primary} />
                        <Text style={[styles.locationText, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                          {supplier.location}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Right Action Chevron */}
                  <View style={styles.chevronWrapper}>
                    <MaterialIcon name="chevron_right" size={20} color={colors.onSurfaceMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1300,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingVertical: 0,
    height: '100%',
    outlineStyle: 'none' as any,
  },
  categoryChipsList: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  categoryChipTextSelected: {
    fontFamily: 'Outfit_700Bold',
  },
  scrollList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 50,
  },
  desktopGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  desktopSupplierCard: {
    width: '48.8%',
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierInitial: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  supplierInfo: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  supplierName: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
  },
  activeBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Outfit_700Bold',
  },
  supplierCategory: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    flex: 1,
  },
  chevronWrapper: {
    paddingLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
});
