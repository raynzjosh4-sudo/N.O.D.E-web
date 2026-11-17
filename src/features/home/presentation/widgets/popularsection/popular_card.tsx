import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { Product } from '@/features/inventory/domain/entities/product';

interface PopularCardProps {
  product: Product;
  onPress?: () => void;
  onCartPress?: () => void;
}

export function PopularCard({
  product,
  onPress,
  onCartPress,
}: PopularCardProps) {
  const { colors } = useAppTheme();
  const wholesalePrice = product.priceTiers[0]?.price ?? product.srp;
  const formattedPrice = `UGX ${wholesalePrice.toLocaleString('en-US')}`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={onPress}
    >
      {/* Thumbnail Square */}
      <Image
        source={{ uri: product.imageUrl }}
        style={[styles.thumbnail, { backgroundColor: colors.surfaceContainerHighest }]}
        resizeMode="cover"
      />

      {/* Details */}
      <View style={styles.details}>
        <Text style={[styles.productName, { color: colors.onSurface }]} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={[styles.brandName, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
          {product.brand}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={[styles.priceText, { color: colors.onSurface }]} numberOfLines={1}>
            {formattedPrice}
          </Text>

          {/* Small Cart Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.cartButton, { backgroundColor: colors.primary }]}
            onPress={onCartPress}
          >
            <MaterialIcon
              name="shopping_cart"
              size={12}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    height: 64,
    paddingVertical: 2,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  brandName: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    flex: 1,
  },
  cartButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
