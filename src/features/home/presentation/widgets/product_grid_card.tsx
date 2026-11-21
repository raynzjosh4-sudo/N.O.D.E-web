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
import { shareProduct } from '@/core/utils/share_product';
import { Product } from '@/features/inventory/domain/entities/product';

interface ProductGridCardProps {
  product: Product;
  aspectRatio?: number;
  onPress?: () => void;
}

export function ProductGridCard({
  product,
  aspectRatio,
  onPress,
}: ProductGridCardProps) {
  const { colors } = useAppTheme();
  const activeRatio = aspectRatio ?? product.aspectRatio ?? 0.85;

  // Determine wholesale price tier
  const sortedTiers = [...(product.priceTiers || [])].sort(
    (a, b) => a.minQuantity - b.minQuantity
  );
  const wholesaleTier = sortedTiers.find((t) => t.minQuantity > 1) || sortedTiers[0];
  const wholesalePrice = wholesaleTier ? wholesaleTier.price : product.srp;
  const qtySuffix =
    wholesaleTier && wholesaleTier.minQuantity > 1
      ? ` / ${wholesaleTier.minQuantity}+ units`
      : '';

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  const handleCardShare = (e: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    shareProduct(product);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.container}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={[styles.imageWrapper, { aspectRatio: activeRatio, backgroundColor: colors.surfaceContainerHighest }]}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Product Details */}
      <View style={styles.details}>
        {/* Dual Pricing Row with Share Action */}
        <View style={styles.pricingRow}>
          <View style={styles.pricingContainer}>
            <View style={styles.wholesaleRow}>
              <Text style={[styles.wholesalePrice, { color: colors.primary }]}>
                {formatPrice(wholesalePrice)}
              </Text>
              {qtySuffix.length > 0 && (
                <Text style={[styles.qtySuffix, { color: colors.primary }]}>{qtySuffix}</Text>
              )}
            </View>
            <Text style={[styles.retailPrice, { color: colors.onSurfaceMuted }]}>
              Retail {formatPrice(product.srp)}
            </Text>
          </View>

          {/* Share Button (Image 1 circled in red) */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.shareBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
            onPress={handleCardShare}
          >
            <MaterialIcon name="share" size={14} color={colors.onSurfaceMuted} />
          </TouchableOpacity>
        </View>

        {/* Product Name */}
        <Text style={[styles.productName, { color: colors.onSurface }]} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Warehouse Location & Brand */}
        <Text style={[styles.locationBrand, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
          {product.warehouseLoc} • {product.brand}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  details: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  pricingContainer: {
    flex: 1,
  },
  shareBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 6,
  },
  wholesaleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  wholesalePrice: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
  },
  qtySuffix: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(18, 187, 240, 0.85)',
    marginLeft: 3,
  },
  retailPrice: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(18, 187, 240, 0.6)',
    marginTop: 1,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    lineHeight: 17,
    marginTop: 2,
  },
  locationBrand: {
    fontSize: 9.5,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
    marginTop: 2,
  },
});
