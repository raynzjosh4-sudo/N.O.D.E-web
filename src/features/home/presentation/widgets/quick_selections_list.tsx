import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { Supplier, MOCK_SUPPLIERS } from '@/features/home/domain/entities/supplier';

interface QuickSelectionsListProps {
  suppliers?: Supplier[];
  onSeeMorePress?: () => void;
  onSupplierPress?: (supplier: Supplier) => void;
}

export function QuickSelectionsList({
  suppliers = MOCK_SUPPLIERS,
  onSeeMorePress,
  onSupplierPress,
}: QuickSelectionsListProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Suppliers</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSeeMorePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.seeMore, { color: colors.primary }]}>See more</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Pill List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {suppliers.map((supplier) => (
          <TouchableOpacity
            key={supplier.id}
            style={[styles.pillContainer, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
            activeOpacity={0.75}
            onPress={() => onSupplierPress?.(supplier)}
          >
            <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceContainerHighest }]}>
              <Image
                source={{ uri: supplier.imageUrl }}
                style={styles.supplierImage}
              />
            </View>
            <Text style={[styles.supplierName, { color: colors.onSurface }]}>{supplier.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  seeMore: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.6)',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pillContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 10,
  },
  imageWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  supplierImage: {
    width: '100%',
    height: '100%',
  },
  supplierName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: AppColors.onSurface,
  },
});
