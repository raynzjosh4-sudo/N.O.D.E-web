import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useProducts } from '@/features/inventory/context/products_context';
import { Product } from '@/features/inventory/domain/entities/product';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';
import { useToast } from '@/core/widgets/whatsapp_dialog';

export default function ProductDetailScreen() {
  const router = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { showSuccess } = useToast();
  const { products, getProductById } = useProducts();

  const initialProduct = (id ? getProductById(id) : undefined) || products[0];
  const [product, setProduct] = useState<Product | undefined>(initialProduct);

  // Fetch complete product details from backend API to guarantee real colors and sizes
  useEffect(() => {
    if (id) {
      ProductApiService.getProductById(id)
        .then((fullProd) => {
          if (fullProd) setProduct(fullProd);
        })
        .catch((err) => {
          console.log('[ProductDetailScreen] Fresh product fetch error:', err);
        });
    }
  }, [id]);

  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [quantity, setQuantity] = useState(product?.moq || 2);
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);

  const isDesktop = width >= 960;
  const heroHeight = isDesktop ? Math.min(height * 0.62, 540) : Math.min(height * 0.65, 480);

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.onSurface }]}>Product not found.</Text>
          <TouchableOpacity
            style={[styles.backHomeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backHomeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mediaUrls: string[] = Array.from(
    new Set([
      product.imageUrl,
      ...(product.mediaUrls || []),
    ].filter(Boolean))
  );

  const activeImage = mediaUrls[selectedMediaIdx] || product.imageUrl;

  const formatPrice = (val: number) => 'UGX ' + (val || 0).toLocaleString('en-US');

  // Compute wholesale tier price based on current quantity
  const matchedTier = [...(product.priceTiers || [])]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((t) => quantity >= t.minQuantity);
  const activeUnitPrice = matchedTier ? matchedTier.price : product.srp;
  const subtotal = activeUnitPrice * quantity;

  // Use the product's actual colors and sizes from the database
  const colorsList = product.colors && product.colors.length > 0 ? product.colors : [
    { name: 'Standard / As Shown', hexCode: '#1C1B1F' },
  ];

  const sizesList = product.sizes && product.sizes.length > 0 ? product.sizes : [
    { name: 'Standard Unit', abbreviation: 'STD' },
  ];

  /* ──────────────────────────────────────────────────────────
     1. LEFT PANE: Sticky Curved Hero Image & Media Gallery
     ────────────────────────────────────────────────────────── */
  const renderMediaPane = () => (
    <View style={styles.mediaPaneContainer}>
      {/* 👑 IMMERSIVE CURVED HERO IMAGE */}
      <View style={[styles.heroClipCard, { height: heroHeight }]}>
        <Image
          source={{ uri: activeImage }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={styles.topVignette} />

        {/* 🔙 BACK BUTTON (Top-Left Circle) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.circleButton,
            styles.backButtonPos,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.88)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
          onPress={() => router.safeGoBack()}
        >
          <MaterialIcon name="arrow_back_ios_new" size={16} color={colors.onSurface} />
        </TouchableOpacity>

        {/* ❌ CLOSE BUTTON (Top-Right Circle - to Home) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.circleButton,
            styles.closeButtonPos,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.88)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
          onPress={() => router.push('/')}
        >
          <MaterialIcon name="close" size={18} color={colors.onSurface} />
        </TouchableOpacity>

        {/* ── PRICE BADGE (Bottom-Left) ── */}
        <View
          style={[
            styles.priceBadge,
            {
              backgroundColor: isDark ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.92)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <Text style={[styles.priceBadgeText, { color: colors.onSurface }]}>
            {formatPrice(product.srp)}
          </Text>
        </View>

        {/* ── CONFIGURE ORDER CTA (Bottom-Right) ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.specsButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/product/order/${product.id}`)}
        >
          <MaterialIcon name="shopping_bag" size={16} color="#FFFFFF" />
          <Text style={styles.specsButtonText}>Order Now</Text>
        </TouchableOpacity>
      </View>

      {/* 🖼️ THUMBNAILS CAROUSEL STRIP */}
      {mediaUrls.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailStrip}
        >
          {mediaUrls.map((url, idx) => {
            const isSelected = selectedMediaIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                style={[
                  styles.thumbnailItem,
                  {
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedMediaIdx(idx)}
              >
                <Image source={{ uri: url }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 🏷️ EXPANDABLE PRODUCT MEDIA SECTION */}
      {mediaUrls.length > 0 && (
        <View style={styles.mediaAccordion}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.mediaAccordionHeader}
            onPress={() => setIsMediaExpanded((prev) => !prev)}
          >
            <View style={styles.mediaTitleRow}>
              <MaterialIcon name="photo_library" size={18} color={colors.primary} />
              <Text style={[styles.mediaSectionTitle, { color: colors.onSurface }]}>
                Product Gallery ({mediaUrls.length})
              </Text>
            </View>
            <MaterialIcon
              name={isMediaExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              size={20}
              color={colors.onSurfaceMuted}
            />
          </TouchableOpacity>

          {isMediaExpanded && (
            <View style={styles.mediaExpandedGrid}>
              {mediaUrls.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  style={styles.mediaGridItem}
                  onPress={() => setSelectedMediaIdx(idx)}
                >
                  <Image source={{ uri: url }} style={styles.mediaGridImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  /* ──────────────────────────────────────────────────────────
     2. RIGHT PANE: Complete Details, Colors, Numbers & Specs
     ────────────────────────────────────────────────────────── */
  const renderDetailsPane = () => (
    <View style={styles.detailsPaneContainer}>
      {/* ── Brand, Supplier & Verified Badge ── */}
      <View style={styles.brandRow}>
        <View style={[styles.brandBadge, { backgroundColor: isDark ? 'rgba(18,187,240,0.15)' : 'rgba(18,187,240,0.08)' }]}>
          <Text style={[styles.brandBadgeText, { color: colors.primary }]}>{product.brand || 'OFFICIAL'}</Text>
        </View>
        <Text style={[styles.warehouseText, { color: colors.onSurfaceMuted }]}>
          {product.warehouseLoc || 'Kampala Logistics Hub'} • Verified Wholesaler
        </Text>
      </View>

      {/* Product Title */}
      <Text style={[styles.productTitle, { color: colors.onSurface }]}>{product.name}</Text>

      {/* ── Logistics & Numbers Badge Row ── */}
      <View style={[styles.logisticsCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <View style={styles.logisticsItem}>
          <MaterialIcon name="inventory_2" size={18} color={AppColors.marginGreen} />
          <View>
            <Text style={[styles.logisticsLabel, { color: colors.onSurfaceMuted }]}>Stock Ready</Text>
            <Text style={[styles.logisticsValue, { color: colors.onSurface }]}>
              {(product.stockQuantity || 1450).toLocaleString()} Units
            </Text>
          </View>
        </View>
        <View style={[styles.logisticsDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.logisticsItem}>
          <MaterialIcon name="local_shipping" size={18} color={colors.primary} />
          <View>
            <Text style={[styles.logisticsLabel, { color: colors.onSurfaceMuted }]}>Dispatch</Text>
            <Text style={[styles.logisticsValue, { color: colors.onSurface }]}>
              {product.leadTimeDays ? `${product.leadTimeDays} Delivery` : 'Same-day Dispatch'}
            </Text>
          </View>
        </View>
        <View style={[styles.logisticsDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.logisticsItem}>
          <MaterialIcon name="verified" size={18} color="#EAB308" />
          <View>
            <Text style={[styles.logisticsLabel, { color: colors.onSurfaceMuted }]}>Min. Order</Text>
            <Text style={[styles.logisticsValue, { color: colors.onSurface }]}>
              {product.moq ? `${product.moq} Units` : '2 Units'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Available Colors with Numbers & Names ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>AVAILABLE COLORS</Text>
          <Text style={[styles.sectionCountText, { color: colors.primary }]}>
            {colorsList.length} Option{colorsList.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.colorSwatchesRow}>
          {colorsList.map((c, idx) => {
            const isSelected = idx === selectedColorIdx;
            const isLightColor = c.hexCode.toUpperCase() === '#FFFFFF' || c.hexCode.toUpperCase() === '#F0F0F2';
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setSelectedColorIdx(idx)}
                style={[
                  styles.colorChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c.hexCode,
                      borderColor: isLightColor ? colors.borderLight : 'transparent',
                      borderWidth: isLightColor ? 1 : 0,
                    },
                  ]}
                />
                <Text style={[styles.colorNameText, { color: isSelected ? colors.primary : colors.onSurface }]}>
                  {c.name}
                </Text>
                {isSelected && (
                  <MaterialIcon name="check" size={14} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Available Sizes with Chips ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>AVAILABLE SIZES & PACKS</Text>
          <Text style={[styles.sectionCountText, { color: colors.primary }]}>
            {sizesList.length} Option{sizesList.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.sizesRow}>
          {sizesList.map((s, idx) => {
            const isSelected = idx === selectedSizeIdx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setSelectedSizeIdx(idx)}
                style={[
                  styles.sizeChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.sizeAbbr, { color: isSelected ? '#FFFFFF' : colors.onSurface }]}>
                  {s.abbreviation}
                </Text>
                <Text style={[styles.sizeFullName, { color: isSelected ? '#FFFFFF' : colors.onSurfaceMuted }]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Wholesale Tier Breakdown Table ── */}
      {product.priceTiers && product.priceTiers.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>WHOLESALE TIER PRICING</Text>
          <View style={[styles.tableContainer, { borderColor: colors.borderLight }]}>
            <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableHeadCol, { color: colors.onSurfaceMuted }]}>ORDER TIER</Text>
              <Text style={[styles.tableHeadCol, { color: colors.onSurfaceMuted }]}>UNIT PRICE</Text>
              <Text style={[styles.tableHeadCol, { color: colors.onSurfaceMuted }]}>SAVINGS</Text>
            </View>
            {product.priceTiers.map((tier, idx) => {
              const isCurrentActive = matchedTier?.minQuantity === tier.minQuantity;
              return (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: colors.borderLight },
                    isCurrentActive && { backgroundColor: isDark ? 'rgba(18,187,240,0.1)' : 'rgba(18,187,240,0.06)' },
                  ]}
                >
                  <Text style={[styles.tableCellQty, { color: colors.onSurface }]}>
                    {tier.minQuantity}+ units
                  </Text>
                  <Text style={[styles.tableCellPrice, { color: colors.primary }]}>
                    {formatPrice(tier.price)}
                  </Text>
                  <Text style={styles.tableCellSavings}>
                    {idx === 0 ? 'Base Wholesale' : `Save ${idx * 8}%`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Interactive Quantity Stepper & Price Calculation ── */}
      <View style={[styles.stepperCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.stepperSubtext, { color: colors.onSurfaceMuted }]}>Selected Unit Price</Text>
          <Text style={[styles.stepperPrice, { color: colors.primary }]}>{formatPrice(activeUnitPrice)}</Text>
        </View>

        {/* Counter */}
        <View style={[styles.stepperBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setQuantity((q) => (q > (product.moq || 1) ? q - 1 : q))}
          >
            <MaterialIcon name="remove" size={16} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.stepperCount, { color: colors.onSurface }]}>{quantity}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <MaterialIcon name="add" size={16} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Order CTA Action Buttons ── */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.addOrderBtn, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}
          onPress={() => {
            showSuccess('Added to Order Bag', `${quantity} units of ${product.name} saved.`);
          }}
        >
          <MaterialIcon name="add_shopping_cart" size={18} color={colors.primary} />
          <Text style={[styles.addOrderBtnText, { color: colors.onSurface }]}>
            Bag • {formatPrice(subtotal)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.orderNowBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/product/order/${product.id}`)}
        >
          <Text style={styles.orderNowBtnText}>Configure Order</Text>
          <MaterialIcon name="arrow_forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── Description & Specifications ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>PRODUCT DESCRIPTION</Text>
        <Text style={[styles.descriptionBody, { color: colors.onSurface }]}>
          {product.description ||
            product.seoDescription ||
            'Enterprise bulk inventory supplied with official manufacturer verification. Includes full QA inspection, commercial packaging, and direct pallet logistics support across Uganda and East Africa.'}
        </Text>
      </View>

      {/* ── Technical Specifications Table ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>TECHNICAL ATTRIBUTES</Text>
        <View style={[styles.techList, { borderColor: colors.borderLight }]}>
          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>SKU / Model</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>{product.sku || `ND-${product.id.slice(0, 8).toUpperCase()}`}</Text>
          </View>
          <View style={[styles.techDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Material / Build</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>{product.material || 'Commercial Grade Heavy Duty'}</Text>
          </View>
          <View style={[styles.techDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Packing Spec</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>{product.packaging || 'Commercial Master Carton'}</Text>
          </View>
          <View style={[styles.techDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Warranty & Returns</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>{product.warranty || '14-Day Replacement Policy'}</Text>
          </View>
          <View style={[styles.techDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.techRow}>
            <Text style={[styles.techKey, { color: colors.onSurfaceMuted }]}>Compliance</Text>
            <Text style={[styles.techVal, { color: colors.onSurface }]}>{product.compliance || 'UNBS Certified • EAC Standard'}</Text>
          </View>
        </View>
      </View>

      {/* ── Supplier Support Contact ── */}
      {(product.supportPhone || product.supportWhatsapp) && (
        <View style={[styles.sectionCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>SUPPLIER CONTACT & INQUIRIES</Text>
          <View style={styles.supportButtonsRow}>
            {product.supportPhone && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.supportBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => Linking.openURL(`tel:${product.supportPhone}`)}
              >
                <MaterialIcon name="call" size={18} color={colors.primary} />
                <Text style={[styles.supportBtnText, { color: colors.onSurface }]}>Call: {product.supportPhone}</Text>
              </TouchableOpacity>
            )}
            {product.supportWhatsapp && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.supportBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() =>
                  Linking.openURL(
                    `https://wa.me/${product.supportWhatsapp?.replace(/[^0-9]/g, '')}?text=Hi, I found your product on N.O.D.E: ${product.name}`
                  )
                }
              >
                <MaterialIcon name="chat" size={18} color="#25D366" />
                <Text style={[styles.supportBtnText, { color: colors.onSurface }]}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopContainer,
          ]}
        >
          {isDesktop ? (
            /* 🖥️ DESKTOP 2-PANE BALANCED LAYOUT */
            <View style={styles.desktopSplitLayout}>
              <View style={styles.desktopLeftCol}>{renderMediaPane()}</View>
              <View style={styles.desktopRightCol}>{renderDetailsPane()}</View>
            </View>
          ) : (
            /* 📱 MOBILE VERTICAL FLUID FLOW */
            <View style={styles.mobileFlow}>
              {renderMediaPane()}
              {renderDetailsPane()}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════
              3. 🚀 MORE TO EXPLORE GRID (Matching Flutter)
             ══════════════════════════════════════════════════════════ */}
          <View style={styles.exploreSection}>
            <Text style={[styles.exploreHeaderTitle, { color: colors.onSurface }]}>
              More to explore
            </Text>

            <ProductGridSection
              products={products.filter((p) => p.id !== product.id)}
              onProductPress={(p) => router.push(`/product/${p.id}`)}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  desktopContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },

  /* ── Desktop Split ── */
  desktopSplitLayout: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
    marginTop: 12,
  },
  desktopLeftCol: {
    flex: 5,
  },
  desktopRightCol: {
    flex: 7,
  },
  mobileFlow: {
    width: '100%',
  },

  /* ── 1. Hero Header Styles ── */
  mediaPaneContainer: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  heroClipCard: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  circleButton: {
    position: 'absolute',
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  backButtonPos: {
    left: 16,
  },
  closeButtonPos: {
    right: 16,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  priceBadgeText: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.5,
  },
  specsButton: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  specsButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
  },

  /* ── Thumbnails Strip ── */
  thumbnailStrip: {
    paddingVertical: 12,
    gap: 10,
  },
  thumbnailItem: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  /* ── Media Accordion ── */
  mediaAccordion: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  mediaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaSectionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  mediaExpandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  mediaGridItem: {
    width: '48%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
  },

  /* ── 2. Details Pane Styles ── */
  detailsPaneContainer: {
    paddingHorizontal: 10,
    paddingTop: 14,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.8,
  },
  warehouseText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  productTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    lineHeight: 28,
  },

  /* Logistics */
  logisticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  logisticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logisticsDivider: {
    width: 1,
    height: 28,
  },
  logisticsLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  logisticsValue: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 1,
  },

  /* Section Card */
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.8,
  },
  sectionCountText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },

  /* Colors */
  colorSwatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorNameText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },

  /* Sizes */
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  sizeAbbr: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
  sizeFullName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  /* Wholesale Table */
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableHeadCol: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableCellQty: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  tableCellPrice: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
  tableCellSavings: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.marginGreen,
  },

  /* Stepper */
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  stepperSubtext: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  stepperPrice: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  stepperCount: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
  },

  /* Order CTAs */
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addOrderBtn: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  addOrderBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  orderNowBtn: {
    flex: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  orderNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },

  /* Description & Tech Specs */
  descriptionBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  techList: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  techDivider: {
    height: 1,
  },
  techKey: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  techVal: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  /* Supplier Support */
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  supportBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  /* Explore Section */
  exploreSection: {
    marginTop: 28,
    paddingHorizontal: 10,
  },
  exploreHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 10,
  },
});
