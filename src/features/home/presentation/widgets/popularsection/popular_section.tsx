import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { Product, MOCK_PRODUCTS } from '@/features/inventory/domain/entities/product';
import { useProducts } from '@/features/inventory/context/products_context';
import { PopularCard } from './popular_card';

interface PopularSectionProps {
  products?: Product[];
  onProductPress?: (product: Product) => void;
  onCartPress?: (product: Product) => void;
}

export function PopularSection({
  products: propProducts,
  onProductPress,
  onCartPress,
}: PopularSectionProps) {
  const { colors } = useAppTheme();
  const { popularProducts, isPopularLoading } = useProducts();

  const items = propProducts || (popularProducts.length > 0 ? popularProducts : MOCK_PRODUCTS.slice(0, 4));

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Popular</Text>
        {isPopularLoading && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {items.map((product) => (
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  spinner: {
    marginLeft: 8,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
