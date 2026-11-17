import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { Product, MOCK_PRODUCTS } from '@/features/inventory/domain/entities/product';
import { PopularCard } from './popular_card';

interface PopularSectionProps {
  products?: Product[];
  onProductPress?: (product: Product) => void;
  onCartPress?: (product: Product) => void;
}

export function PopularSection({
  products = MOCK_PRODUCTS.slice(0, 4),
  onProductPress,
  onCartPress,
}: PopularSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Popular</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {products.map((product) => (
          <PopularCard
            key={`pop-${product.id}`}
            product={product}
            onPress={() => onProductPress?.(product)}
            onCartPress={() => onCartPress?.(product)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
