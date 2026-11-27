import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { shareProduct } from '@/core/utils/share_product';
import { Product } from '@/features/inventory/domain/entities/product';
import { useBulkCart } from '@/features/inventory/context/bulk_cart_context';

interface ProductDetailSidePanelProps {
  product: Product;
  onClose: () => void;
  onViewSpecs?: (product: Product) => void;
}

export function ProductDetailSidePanel({
  product,
  onClose,
  onViewSpecs,
}: ProductDetailSidePanelProps) {
  const { colors } = useAppTheme();
  const { isBulkMode, isInBulkList, toggleBulkItem } = useBulkCart();
  const isInBulk = isInBulkList(product.id);
  const [selectedImage, setSelectedImage] = useState<string>(product.imageUrl);

  // Sync selected image whenever product changes (fixes bug where tapping product in waterfall changed text but image stayed old)
  useEffect(() => {
    setSelectedImage(product.imageUrl);
  }, [product.id, product.imageUrl]);

  const mediaList = product.mediaUrls && product.mediaUrls.length > 0
    ? product.mediaUrls
    : [product.imageUrl];

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  return (
    <View style={[styles.panelContainer, { backgroundColor: colors.surface, borderLeftColor: colors.borderLight }]}>
      {/* ── Top Header Actions ── */}
      <View style={[styles.panelTopBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.brandLocationTag}>
          <Text style={[styles.brandText, { color: colors.primary }]}>{product.brand}</Text>
          <Text style={[styles.dotSeparator, { color: colors.onSurfaceMuted }]}>•</Text>
          <Text style={[styles.locationText, { color: colors.onSurfaceMuted }]}>{product.warehouseLoc}</Text>
        </View>

        <View style={styles.topActionsRow}>
          {/* Share Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => shareProduct(product)}
            style={[styles.actionHeaderBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
          >
            <MaterialIcon name="share" size={18} color={colors.onSurface} />
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={[styles.actionHeaderBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
          >
            <MaterialIcon name="close" size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Main Hero Image (Pinterest Card Style) ── */}
        <View style={[styles.imageCard, { backgroundColor: colors.surfaceContainerHighest }]}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {/* Price Tag Pill */}
          <View style={[styles.priceFloatingBadge, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
            <Text style={[styles.priceFloatingText, { color: colors.onSurface }]}>
              {formatPrice(product.srp)}
            </Text>
          </View>
        </View>

        {/* Thumbnail Selector */}
        {mediaList.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsRow}
          >
            {mediaList.map((url, idx) => {
              const isSelected = selectedImage === url;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={[
                    styles.thumbnailWrapper,
                    isSelected && styles.thumbnailSelected,
                  ]}
                  onPress={() => setSelectedImage(url)}
                >
                  <Image source={{ uri: url }} style={styles.thumbnailImg} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Product Title & Details ── */}
        <View style={styles.titleSection}>
          <Text style={[styles.productName, { color: colors.onSurface }]}>{product.name}</Text>
        </View>

        {/* ── Wholesale Tier Breakdown ── */}
        <View style={[styles.tiersSection, { backgroundColor: colors.scaffoldBackground, borderColor: colors.borderLight }]}>
          <Text style={[styles.tiersHeading, { color: colors.onSurfaceMuted }]}>WHOLESALE PRICE BREAKS</Text>
          <View style={styles.tiersGrid}>
            {product.priceTiers.map((tier, idx) => (
              <View key={idx} style={[styles.tierCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                <View style={styles.tierHeader}>
                  <MaterialIcon name="inventory" size={14} color={colors.primary} />
                  <Text style={[styles.tierQty, { color: colors.primary }]}>{tier.minQuantity}+ units</Text>
                </View>
                <Text style={[styles.tierPrice, { color: colors.onSurface }]}>{formatPrice(tier.price)}</Text>
                <Text style={[styles.tierPerUnit, { color: colors.onSurfaceMuted }]}>per unit</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionButtons}>
          {(isBulkMode || isInBulk) && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.viewSpecsButton,
                {
                  marginBottom: 10,
                  backgroundColor: isInBulk ? '#10B981' : 'transparent',
                  borderWidth: 1.5,
                  borderColor: isInBulk ? '#10B981' : colors.primary,
                },
              ]}
              onPress={() => toggleBulkItem(product.id)}
            >
              <MaterialIcon
                name={isInBulk ? 'check_circle' : 'playlist_add'}
                size={18}
                color={isInBulk ? '#FFFFFF' : colors.primary}
              />
              <Text style={[styles.viewSpecsText, { color: isInBulk ? '#FFFFFF' : colors.primary }]}>
                {isInBulk ? 'In Bulk Order List ✓' : '+ Add to My Bulk List'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.viewSpecsButton, { backgroundColor: colors.primary }]}
            onPress={() => onViewSpecs?.(product)}
          >
            <MaterialIcon
              name="settings_suggest"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.viewSpecsText}>View Full Specifications</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    width: 480,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(28, 27, 31, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  panelTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.06)',
  },
  brandLocationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    color: 'rgba(28, 27, 31, 0.3)',
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageCard: {
    width: '100%',
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  priceFloatingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  priceFloatingText: {
    fontSize: 14,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
  },
  thumbnailsRow: {
    gap: 10,
    marginTop: 14,
  },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: AppColors.primary,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    marginTop: 18,
  },
  productName: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    lineHeight: 26,
  },
  tiersSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  tiersHeading: {
    fontSize: 10.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.45)',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  tiersGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 187, 240, 0.25)',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tierQty: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  tierPrice: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  tierPerUnit: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.4)',
    marginTop: 2,
  },
  actionButtons: {
    marginTop: 24,
  },
  viewSpecsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  viewSpecsText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.surfaceWhite,
  },
});
