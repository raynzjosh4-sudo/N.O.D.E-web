import React, { useState } from 'react';
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
import { MaterialIcon } from '@/core/widgets/material_icon';
import { SavedProductItem } from '../../domain/entities/profile_models';

interface SavedTabProps {
  items: SavedProductItem[];
  onPlaceOrder: (selectedItems: SavedProductItem[]) => void;
  onDeleteItem: (id: string) => void;
  onProductClick: (productId: string) => void;
}

export function SavedTab({
  items,
  onPlaceOrder,
  onDeleteItem,
  onProductClick,
}: SavedTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(items.map((i) => i.id)));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  const { colors } = useAppTheme();

  const totalUnits = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.product.srp * item.quantity,
    0
  );

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.cardColor }]}>
          <MaterialIcon
            name="shopping_bag"
            size={40}
            color="rgba(28, 27, 31, 0.2)"
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>Your bag is empty</Text>
        <Text style={styles.emptySubtitle}>
          Items you save while browsing wholesale catalogs will appear here for bulk checkout.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* ── Selection Status Banner ── */}
      {selectedIds.size > 0 && (
        <View style={styles.selectionBanner}>
          <View style={styles.selectionPill}>
            <Text style={styles.selectionCountText}>
              {selectedIds.size} selected
            </Text>
          </View>
          <Text style={styles.selectionHintText}>
            Tap 'Place Wholesale Order' below to proceed with bulk checkout.
          </Text>
        </View>
      )}

      {/* ── Saved Items List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const lineTotal = item.product.srp * item.quantity;

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                isSelected && styles.itemCardSelected,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              {/* Checkbox */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.checkboxTouch}
                onPress={() => toggleSelect(item.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxActive,
                    !isSelected && { backgroundColor: colors.surface },
                  ]}
                >
                  {isSelected && (
                    <MaterialIcon name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Product Thumbnail */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onProductClick(item.product.id)}
                style={styles.thumbnailContainer}
              >
                <Image
                  source={{ uri: item.product.imageUrl }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityBadgeText}>{item.quantity}x</Text>
                </View>
              </TouchableOpacity>

              {/* Product Details */}
              <View style={styles.itemDetails}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onProductClick(item.product.id)}
                >
                  <Text style={styles.itemBrandText}>
                    {item.product.brand} • {item.product.warehouseLoc}
                  </Text>
                  <Text style={[styles.itemTitleText, { color: colors.onSurface }]} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                </TouchableOpacity>

                {/* Variants Row */}
                <View style={styles.variantsRow}>
                  {item.selectedColor && (
                    <View style={styles.variantBadge}>
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: item.selectedColor.color },
                        ]}
                      />
                      <Text style={styles.variantText}>
                        {item.selectedColor.label}
                      </Text>
                    </View>
                  )}

                  {item.selectedSize && (
                    <View style={styles.variantBadge}>
                      <Text style={styles.variantText}>
                        Size: {item.selectedSize}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price Row */}
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.unitPriceText}>
                      {formatPrice(item.product.srp)} / unit
                    </Text>
                    <Text style={styles.totalPriceText}>
                      Subtotal: {formatPrice(lineTotal)}
                    </Text>
                  </View>

                  {/* Delete Item */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.deleteButton}
                    onPress={() => onDeleteItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcon
                      name="delete_outline"
                      size={18}
                      color="rgba(28, 27, 31, 0.4)"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Bottom Bulk Order Bar ── */}
      {selectedItems.length > 0 && (
        <View style={[styles.bottomOrderBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          <View style={styles.bottomOrderSummary}>
            <Text style={styles.bottomUnitsText}>{totalUnits} Total Units</Text>
            <Text style={[styles.bottomTotalText, { color: colors.onSurface }]}>{formatPrice(totalAmount)}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.placeOrderBtn}
            onPress={() => onPlaceOrder(selectedItems)}
          >
            <MaterialIcon
              name="shopping_cart_checkout"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.placeOrderText}>
              Place Wholesale Order ({selectedItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 187, 240, 0.15)',
  },
  selectionPill: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  selectionCountText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
  },
  selectionHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: AppColors.primary,
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.06)',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemCardSelected: {
    backgroundColor: 'rgba(18, 187, 240, 0.02)',
  },
  checkboxTouch: {
    paddingTop: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(28, 27, 31, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    position: 'relative',
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  quantityBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quantityBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  itemDetails: {
    flex: 1,
  },
  itemBrandText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTitleText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginTop: 2,
    lineHeight: 18,
  },
  variantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  colorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  variantText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.7)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  unitPriceText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.45)',
  },
  totalPriceText: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    marginTop: 1,
  },
  deleteButton: {
    padding: 6,
  },
  bottomOrderBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 27, 31, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomOrderSummary: {},
  bottomUnitsText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  bottomTotalText: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  placeOrderText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.45)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});
