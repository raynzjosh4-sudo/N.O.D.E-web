import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Product, MOCK_PRODUCTS } from '@/features/inventory/domain/entities/product';
import { ProductGridCard } from '@/features/home/presentation/widgets/product_grid_card';

interface ProductGridSectionProps {
  products?: Product[];
  onProductPress?: (product: Product) => void;
}

export function ProductGridSection({
  products = MOCK_PRODUCTS,
  onProductPress,
}: ProductGridSectionProps) {
  const { width } = useWindowDimensions();

  // Responsive column count matching Flutter: Desktop (4-5), Tablet (3), Mobile (2)
  const numColumns = width >= 1200 ? 5 : width >= 900 ? 4 : width >= 600 ? 3 : 2;

  // Staggered waterfall ratios (Pinterest-style) matching Flutter's Masonry sequence
  const staggeredRatios = [0.72, 0.92, 0.78, 0.88, 0.8, 0.95];

  // Distribute items into columns for true masonry waterfall
  const columns: { item: Product; ratio: number }[][] = Array.from(
    { length: numColumns },
    () => []
  );

  products.forEach((product, idx) => {
    const colIndex = idx % numColumns;
    const ratio = staggeredRatios[idx % staggeredRatios.length];
    columns[colIndex].push({ item: product, ratio });
  });

  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        {columns.map((columnItems, colIdx) => (
          <View key={`col-${colIdx}`} style={styles.column}>
            {columnItems.map(({ item, ratio }) => (
              <ProductGridCard
                key={item.id}
                product={item}
                aspectRatio={ratio}
                onPress={() => onProductPress?.(item)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  column: {
    flex: 1,
  },
});
