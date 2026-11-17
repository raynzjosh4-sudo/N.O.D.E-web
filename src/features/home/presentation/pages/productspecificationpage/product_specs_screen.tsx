import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { MOCK_PRODUCTS, Product } from '@/features/inventory/domain/entities/product';
import { useAppTheme } from '@/core/theme/theme_context';

export default function ProductSpecsScreen() {
  const router = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { colors } = useAppTheme();

  const product: Product =
    MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];

  const mediaList =
    product.mediaUrls && product.mediaUrls.length > 0
      ? product.mediaUrls
      : [product.imageUrl];

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(2);

  const formatPrice = (val: number) => {
    return 'UGX ' + val.toLocaleString('en-US');
  };

  // -------------------------------------------------------------
  // SHARED MEDIA VIEWER (Hero image + Thumbnail strip)
  // -------------------------------------------------------------
  const renderMediaPane = () => (
    <View style={styles.mediaContainer}>
      {/* Hero Image Card */}
      <View style={styles.heroImageCard}>
        <Image
          source={{ uri: mediaList[selectedMediaIndex] }}
          style={styles.heroMainImage}
          resizeMode="cover"
        />
        {/* Floating Price Tag */}
        <View style={[styles.floatingPriceTag, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
          <Text style={[styles.floatingPriceText, { color: colors.onSurface }]}>{formatPrice(product.srp)}</Text>
        </View>
      </View>

      {/* Thumbnail Gallery Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailStrip}
      >
        {mediaList.map((url, idx) => {
          const isSelected = selectedMediaIndex === idx;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              style={[
                styles.thumbnailItem,
                isSelected && styles.thumbnailItemSelected,
              ]}
              onPress={() => setSelectedMediaIndex(idx)}
            >
              <Image source={{ uri: url }} style={styles.thumbnailImage} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // -------------------------------------------------------------
  // SHARED SPEC DETAILS BODY (Wholesale, logistics, pricing, etc.)
  // -------------------------------------------------------------
  const renderDetailsPane = () => (
    <View style={styles.detailsContainer}>
      {/* Brand & Supplier Info */}
      <View style={styles.brandRow}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>{product.brand}</Text>
        </View>
        <Text style={[styles.warehouseText, { color: colors.onSurfaceMuted }]}>
          {product.warehouseLoc} • Verified Distributor
        </Text>
      </View>

      <Text style={[styles.specsProductTitle, { color: colors.onSurface }]}>{product.name}</Text>

      {/* Logistics & Stock Row */}
      <View style={[styles.logisticsCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <View style={styles.logisticsItem}>
          <MaterialIcon name="inventory_2" size={18} color={AppColors.marginGreen} />
          <View>
            <Text style={[styles.logisticsLabel, { color: colors.onSurfaceMuted }]}>In Stock</Text>
            <Text style={[styles.logisticsValue, { color: colors.onSurface }]}>1,450 Units Ready</Text>
          </View>
        </View>
        <View style={[styles.logisticsDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.logisticsItem}>
          <MaterialIcon name="local_shipping" size={18} color={colors.primary} />
          <View>
            <Text style={[styles.logisticsLabel, { color: colors.onSurfaceMuted }]}>Dispatch</Text>
            <Text style={[styles.logisticsValue, { color: colors.onSurface }]}>Same-day Delivery</Text>
          </View>
        </View>
      </View>

      {/* Price & Quantity Stepper */}
      <View style={styles.priceStepperRow}>
        <View>
          <Text style={[styles.unitPriceLabel, { color: colors.onSurfaceMuted }]}>Wholesale Unit Price</Text>
          <Text style={[styles.unitPriceValue, { color: colors.primary }]}>{formatPrice(product.srp)}</Text>
        </View>

        {/* Counter */}
        <View style={[styles.stepperContainer, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
          <TouchableOpacity
            style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
            onPress={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
          >
            <MaterialIcon name="remove" size={16} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.stepperQty, { color: colors.onSurface }]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <MaterialIcon name="add" size={16} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Order CTA Buttons */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.addToOrderBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}
          onPress={() => console.log('Added to Order Bag:', quantity, 'units')}
        >
          <MaterialIcon name="shopping_bag" size={18} color={colors.primary} />
          <Text style={[styles.addToOrderText, { color: colors.onSurface }]}>
            Add {quantity} to Order • {formatPrice(product.srp * quantity)}
          </Text>
        </TouchableOpacity>

        {/* Order Now Button -> Opens Color & Variant Configuration Sheet */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.orderNowBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/product/order/${product.id}`)}
        >
          <Text style={styles.orderNowText}>Order Now (Choose Colors & Sizes)</Text>
          <MaterialIcon name="arrow_forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Wholesale Pricing Table */}
      <View style={styles.pricingTableSection}>
        <Text style={[styles.sectionHeader, { color: colors.onSurfaceMuted }]}>WHOLESALE TIER BREAKDOWN</Text>
        <View style={[styles.tableCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <View style={[styles.tableHeaderRow, { backgroundColor: colors.scaffoldBackground, borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.tableHeadCell, { color: colors.onSurfaceMuted }]}>QUANTITY</Text>
            <Text style={[styles.tableHeadCell, { color: colors.onSurfaceMuted }]}>UNIT PRICE</Text>
            <Text style={[styles.tableHeadCell, { color: colors.onSurfaceMuted }]}>SAVINGS</Text>
          </View>
          {product.priceTiers.map((tier, idx) => (
            <View key={idx} style={[styles.tableDataRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableCellQty, { color: colors.onSurface }]}>{tier.minQuantity}+ units</Text>
              <Text style={[styles.tableCellPrice, { color: colors.primary }]}>{formatPrice(tier.price)}</Text>
              <Text style={styles.tableCellSavings}>
                {idx === 0 ? 'Standard' : `Save ${idx * 8}%`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={[styles.sectionHeader, { color: colors.onSurfaceMuted }]}>SPECIFICATIONS & DETAILS</Text>
        <Text style={[styles.descriptionText, { color: colors.onSurface }]}>
          Enterprise bulk unit with official manufacturer warranty. Includes full QA inspection,
          individual protective packaging, and direct pallet logistics support across Uganda and
          the East African Community.
        </Text>
      </View>

      {/* Technical Attributes Table */}
      <View style={styles.technicalSection}>
        <Text style={[styles.sectionHeader, { color: colors.onSurfaceMuted }]}>TECHNICAL SPECIFICATIONS</Text>
        <View style={[styles.techSpecsList, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>SKU / Model</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>ND-PROD-{product.id.toUpperCase()}</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Packaging</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>Commercial Bulk Carton (24 pcs)</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Compliance</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>UNBS Certified • CE Approved</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Return Policy</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>14 Days Manufacturer Exchange</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        {/* Top App Bar (NodeAppBar style) */}
        <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.safeGoBack()}
            activeOpacity={0.7}
          >
            <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.appBarTitle, { color: colors.onSurface }]}>Product Details</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Responsive Layout: Split Columns on Desktop vs Vertical Scroll on Mobile */}
        {isDesktop ? (
          <View style={styles.desktopSplitLayout}>
            {/* Left Sticky Media Pane */}
            <View style={[styles.desktopLeftPane, { borderRightColor: colors.borderLight }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderMediaPane()}
              </ScrollView>
            </View>

            {/* Right Scrollable Details Pane */}
            <View style={[styles.desktopRightPane, { backgroundColor: colors.surface }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.desktopRightScroll}
              >
                {renderDetailsPane()}
              </ScrollView>
            </View>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mobileScrollContent}
          >
            {renderMediaPane()}
            {renderDetailsPane()}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surfaceWhite,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.surfaceWhite,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.05)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
  },

  // Desktop Split Layout (5:7 ratio matching Flutter)
  desktopSplitLayout: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  desktopLeftPane: {
    flex: 5,
    padding: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(28, 27, 31, 0.06)',
  },
  desktopRightPane: {
    flex: 7,
    backgroundColor: '#FFFFFF',
  },
  desktopRightScroll: {
    padding: 28,
    paddingBottom: 60,
  },

  // Mobile Layout
  mobileScrollContent: {
    paddingBottom: 50,
  },

  // Media Pane Styles
  mediaContainer: {
    width: '100%',
    padding: 16,
  },
  heroImageCard: {
    width: '100%',
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  heroMainImage: {
    width: '100%',
    height: '100%',
  },
  floatingPriceTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  floatingPriceText: {
    fontSize: 14,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
  },
  thumbnailStrip: {
    gap: 12,
    marginTop: 14,
  },
  thumbnailItem: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: AppColors.surfaceContainerHighest,
  },
  thumbnailItemSelected: {
    borderColor: AppColors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Details Pane Styles
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
  },
  warehouseText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  specsProductTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
    marginTop: 8,
    lineHeight: 30,
  },
  logisticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.06)',
  },
  logisticsItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logisticsLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(28, 27, 31, 0.45)',
  },
  logisticsValue: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
    marginTop: 1,
  },
  logisticsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(28, 27, 31, 0.08)',
    marginHorizontal: 10,
  },
  priceStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 10,
  },
  unitPriceLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.5)',
  },
  unitPriceValue: {
    fontSize: 22,
    fontFamily: 'Outfit_900Black',
    color: AppColors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 20,
    padding: 4,
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  ctaRow: {
    marginTop: 14,
    gap: 10,
  },
  addToOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 16,
  },
  addToOrderText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.surfaceWhite,
  },
  orderNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  orderNowText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.surfaceWhite,
  },
  pricingTableSection: {
    marginTop: 26,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.45)',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  tableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableHeadCell: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.04)',
  },
  tableCellQty: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  tableCellPrice: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
  },
  tableCellSavings: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: AppColors.marginGreen,
  },
  descriptionSection: {
    marginTop: 24,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.7)',
    lineHeight: 20,
  },
  technicalSection: {
    marginTop: 24,
  },
  techSpecsList: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  techKey: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  techVal: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
});
