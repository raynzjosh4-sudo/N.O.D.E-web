import React from 'react';
import { useWindowDimensions } from 'react-native';
import ProductDetailScreen from '@/features/home/presentation/pages/product_detail_screen';
import ProductSpecsScreen from '@/features/home/presentation/pages/productspecificationpage/product_specs_screen';

export default function ProductRoute() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  // On desktop, going to product detail directly presents the comprehensive
  // 5:7 split specifications & wholesale page rather than the mobile preview card.
  if (isDesktop) {
    return <ProductSpecsScreen />;
  }

  return <ProductDetailScreen />;
}
