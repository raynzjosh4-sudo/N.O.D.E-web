import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/core/utils/use_app_navigation';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { Product } from '@/features/inventory/domain/entities/product';
import { useProducts } from '@/features/inventory/context/products_context';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { ProfileApiService } from '@/features/profile/data/services/profile_api_service';
import { ProductGridSection } from '@/features/home/presentation/widgets/product_grid_section';
import { useToast } from '@/core/widgets/whatsapp_dialog';
import { ProductSpecsShimmer } from './shimmer/product_specs_shimmer';

export default function ProductSpecsScreen() {
  const router = useAppNavigation();
  const { showSuccess, showError } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { colors, isDark } = useAppTheme();
  const { products, getProductById } = useProducts();

  const initialProduct = (id ? getProductById(id) : undefined) || products[0];
  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(product?.moq || 2);
  const [isSavingToBag, setIsSavingToBag] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // GitHub-style border and surface palette
  const gitBorder = isDark ? '#30363D' : '#D0D7DE';
  const gitHeaderBg = isDark ? '#161B22' : '#F6F8FA';
  const gitSubtleText = isDark ? '#8B949E' : '#57606A';

  // Fetch complete product details with real colors, sizes, tiers, and specs
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      ProductApiService.getProductById(id)
        .then((fullProd) => {
          if (fullProd) {
            setProduct(fullProd);
            if (fullProd.moq && fullProd.moq > 1) {
              setQuantity(fullProd.moq);
            }
          }
        })
        .catch((err) => {
          console.warn('[ProductSpecsScreen] Failed to fetch product specs:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  if (!product && isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <ProductSpecsShimmer />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.onSurface }]}>Product specifications not found.</Text>
          <TouchableOpacity
            style={[styles.gitButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.gitButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mediaList: string[] = Array.from(
    new Set([
      product.imageUrl,
      ...(product.mediaUrls || []),
    ].filter(Boolean))
  );

  const activeImage = mediaList[selectedMediaIndex] || product.imageUrl;
  const formatPrice = (val: number) => 'UGX ' + (val || 0).toLocaleString('en-US');

  // Handle Save to Bulk Bag (Wishlist)
  const handleSaveToBag = async () => {
    setIsSavingToBag(true);
    setSaveSuccessMsg(null);
    try {
      await ProfileApiService.addSavedItem(
        product.id,
        quantity,
        product.colors?.[0]?.name || 'Standard',
        product.sizes?.[0]?.name || 'Standard',
        {
          id: product.id,
          name: product.name,
          srp: product.srp,
          brand: product.brand,
          imageUrl: product.imageUrl,
          warehouseLoc: product.warehouseLoc,
          priceTiers: product.priceTiers,
          colors: product.colors,
          sizes: product.sizes,
          moq: product.moq,
        }
      );
      const msg = `Saved ${quantity} units of ${product.name} to your bulk order bag.`;
      setSaveSuccessMsg(msg);
      showSuccess('Saved to Bag', `${quantity} units of ${product.name} synced to your cloud bag.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Failed to save to bag:', err.message);
      showError('Save Failed', err?.message || 'Could not sync item to cloud bag.');
      setSaveSuccessMsg(`Saved to local bag (${quantity} units).`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSavingToBag(false);
    }
  };

  // -------------------------------------------------------------
  // LEFT PANE: Media Viewer (Hero image + Thumbnail strip)
  // -------------------------------------------------------------
  const renderMediaPane = () => (
    <View style={styles.mediaContainer}>
      {/* Hero Image Box - Clean 1px GitHub-style Border */}
      <View style={[styles.heroBox, { borderColor: gitBorder }]}>
        <Image
          source={{ uri: activeImage }}
          style={styles.heroMainImage}
          resizeMode="cover"
        />
        {/* Floating Price Badge */}
        <View style={[styles.floatingPriceTag, { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: gitBorder }]}>
          <Text style={[styles.floatingPriceText, { color: colors.onSurface }]}>
            {formatPrice(product.srp)}
          </Text>
        </View>
      </View>

      {/* Thumbnail Strip */}
      {mediaList.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailStrip}
        >
          {mediaList.map((url, idx) => {
            const isSelected = selectedMediaIndex === idx;
            return (
              <TouchableOpacity
                key={`spec-thumb-${idx}`}
                activeOpacity={0.8}
                style={[
                  styles.thumbnailItem,
                  { borderColor: isSelected ? colors.primary : gitBorder },
                  isSelected && styles.thumbnailItemSelected,
                ]}
                onPress={() => setSelectedMediaIndex(idx)}
              >
                <Image source={{ uri: url }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  // -------------------------------------------------------------
  // RIGHT PANE: All Product Specifications, Pricing, Tables
  // -------------------------------------------------------------
  const renderDetailsPane = () => {
    const similarProducts = products.filter((p) => p.id !== product.id).slice(0, 4);

    return (
      <View style={styles.detailsContainer}>
        {/* Brand & Supplier Header Line */}
        <View style={[styles.gitSection, { borderBottomColor: gitBorder }]}>
          <View style={styles.brandRow}>
            <View style={[styles.brandChip, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}>
              <Text style={[styles.brandChipText, { color: colors.onSurface }]}>{product.brand || 'Verified Brand'}</Text>
            </View>
            <Text style={[styles.warehouseText, { color: gitSubtleText }]}>
              {product.supplierName || 'Verified Supplier'} • {product.warehouseLoc || 'Uganda Central Warehouse'}
            </Text>
          </View>

          <Text style={[styles.productTitle, { color: colors.onSurface }]}>{product.name}</Text>
        </View>

        {/* Logistics & Stock Status Line */}
        <View style={[styles.gitSection, styles.logisticsRow, { borderBottomColor: gitBorder }]}>
          <View style={styles.logisticsBlock}>
            <Text style={[styles.statLabel, { color: gitSubtleText }]}>IN STOCK</Text>
            <Text style={[styles.statValue, { color: '#2EA44F' }]}>
              {product.stockQuantity ? `${product.stockQuantity.toLocaleString()} Units Ready` : 'Available in Bulk'}
            </Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: gitBorder }]} />

          <View style={styles.logisticsBlock}>
            <Text style={[styles.statLabel, { color: gitSubtleText }]}>DISPATCH TIME</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>
              {product.leadTimeDays ? `${product.leadTimeDays} business days` : 'Same-day Dispatch'}
            </Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: gitBorder }]} />

          <View style={styles.logisticsBlock}>
            <Text style={[styles.statLabel, { color: gitSubtleText }]}>MIN. ORDER (MOQ)</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>
              {product.moq ? `${product.moq} Units` : '1 Unit'}
            </Text>
          </View>
        </View>

        {/* Wholesale Unit Price & Stepper Row */}
        <View style={[styles.gitSection, styles.priceStepperRow, { borderBottomColor: gitBorder }]}>
          <View>
            <Text style={[styles.statLabel, { color: gitSubtleText }]}>WHOLESALE UNIT PRICE</Text>
            <Text style={[styles.unitPriceText, { color: colors.primary }]}>{formatPrice(product.srp)}</Text>
          </View>

          {/* Stepper with sharp Git-style buttons */}
          <View style={[styles.stepperBox, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}>
            <TouchableOpacity
              style={[styles.stepperBtn, { borderRightColor: gitBorder, borderRightWidth: 1 }]}
              onPress={() => setQuantity((q) => (q > (product.moq || 1) ? q - 1 : q))}
            >
              <MaterialIcon name="remove" size={16} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.stepperQty, { color: colors.onSurface }]}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.stepperBtn, { borderLeftColor: gitBorder, borderLeftWidth: 1 }]}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <MaterialIcon name="add" size={16} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA Buttons: Save to Bag & Order Now */}
        <View style={[styles.gitSection, styles.ctaSection, { borderBottomColor: gitBorder }]}>
          {saveSuccessMsg && (
            <View style={[styles.notificationBar, { borderColor: '#2EA44F', backgroundColor: isDark ? 'rgba(46,164,79,0.15)' : '#E6FFED' }]}>
              <MaterialIcon name="check_circle" size={16} color="#2EA44F" />
              <Text style={[styles.notificationText, { color: colors.onSurface }]}>{saveSuccessMsg}</Text>
            </View>
          )}

          <View style={styles.actionButtonsRow}>
            {/* Save to Bag Button (Bulk Ordering Wishlist) */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.gitOutlineBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
              onPress={handleSaveToBag}
              disabled={isSavingToBag}
            >
              {isSavingToBag ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialIcon name="shopping_bag" size={18} color={colors.primary} />
                  <Text style={[styles.gitOutlineBtnText, { color: colors.onSurface }]}>
                    Save {quantity} to Bag • {formatPrice(product.srp * quantity)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Order Now Button -> Navigates to full order sheet */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.gitPrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/product/order/${product.id}`)}
            >
              <Text style={styles.gitPrimaryBtnText}>Order Now (Choose Colors & Sizes)</Text>
              <MaterialIcon name="arrow_forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description & Overview */}
        <View style={[styles.gitSection, { borderBottomColor: gitBorder }]}>
          <Text style={[styles.gitSectionHeader, { color: gitSubtleText }]}>DESCRIPTION & SPECIFICATIONS</Text>
          <Text style={[styles.descriptionBody, { color: colors.onSurface }]}>
            {product.description ||
              'Enterprise wholesale unit with official manufacturer warranty. Includes full QA inspection, individual protective packaging, and direct pallet logistics support across Uganda and the East African Community.'}
          </Text>
        </View>

        {/* Wholesale Tier Breakdown Table */}
        {product.priceTiers && product.priceTiers.length > 0 && (
          <View style={[styles.gitSection, { borderBottomColor: gitBorder }]}>
            <Text style={[styles.gitSectionHeader, { color: gitSubtleText }]}>WHOLESALE TIER BREAKDOWN</Text>
            <View style={[styles.gitTable, { borderColor: gitBorder }]}>
              <View style={[styles.gitTableHeaderRow, { backgroundColor: gitHeaderBg, borderBottomColor: gitBorder }]}>
                <Text style={[styles.tableHeadCol, { color: gitSubtleText }]}>ORDER QUANTITY</Text>
                <Text style={[styles.tableHeadCol, { color: gitSubtleText }]}>UNIT PRICE</Text>
                <Text style={[styles.tableHeadCol, { color: gitSubtleText }]}>SAVINGS</Text>
              </View>
              {product.priceTiers.map((tier, idx) => (
                <View
                  key={`tier-${idx}`}
                  style={[
                    styles.gitTableRow,
                    idx < product.priceTiers.length - 1 && { borderBottomColor: gitBorder, borderBottomWidth: 1 },
                  ]}
                >
                  <Text style={[styles.tableDataCol, { color: colors.onSurface, fontWeight: '600' }]}>
                    {tier.minQuantity}+ units
                  </Text>
                  <Text style={[styles.tableDataCol, { color: colors.primary, fontWeight: '700' }]}>
                    {formatPrice(tier.price)}
                  </Text>
                  <Text style={[styles.tableDataCol, { color: '#2EA44F', fontWeight: '600' }]}>
                    {idx === 0 ? 'Standard' : `Save ${Math.min(idx * 8, 35)}%`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Available Colors & Sizes */}
        {((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) && (
          <View style={[styles.gitSection, { borderBottomColor: gitBorder }]}>
            <Text style={[styles.gitSectionHeader, { color: gitSubtleText }]}>AVAILABLE VARIANTS</Text>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <View style={styles.variantBlock}>
                <Text style={[styles.variantSubtitle, { color: colors.onSurface }]}>
                  Colors ({product.colors.length}):
                </Text>
                <View style={styles.colorChipsRow}>
                  {product.colors.map((c, idx) => (
                    <View
                      key={`color-${idx}`}
                      style={[styles.colorChip, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: c.hexCode }]} />
                      <Text style={[styles.colorChipText, { color: colors.onSurface }]}>{c.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <View style={[styles.variantBlock, { marginTop: 12 }]}>
                <Text style={[styles.variantSubtitle, { color: colors.onSurface }]}>
                  Sizes ({product.sizes.length}):
                </Text>
                <View style={styles.sizeChipsRow}>
                  {product.sizes.map((s, idx) => (
                    <View
                      key={`size-${idx}`}
                      style={[styles.sizeChip, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                    >
                      <Text style={[styles.sizeChipAbbr, { color: colors.primary }]}>{s.abbreviation}</Text>
                      <Text style={[styles.sizeChipName, { color: colors.onSurface }]}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Technical Attributes Table (Clean 1px GitHub-style Table) */}
        <View style={[styles.gitSection, { borderBottomColor: gitBorder }]}>
          <Text style={[styles.gitSectionHeader, { color: gitSubtleText }]}>TECHNICAL SPECIFICATIONS</Text>
          <View style={[styles.gitTable, { borderColor: gitBorder }]}>
            <View style={[styles.gitTableRow, { borderBottomColor: gitBorder, borderBottomWidth: 1 }]}>
              <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>SKU / Model</Text>
              <Text style={[styles.techValCol, { color: colors.onSurface }]}>{product.sku || `ND-${product.id.slice(0, 8).toUpperCase()}`}</Text>
            </View>
            {product.material && (
              <View style={[styles.gitTableRow, { borderBottomColor: gitBorder, borderBottomWidth: 1 }]}>
                <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>Material</Text>
                <Text style={[styles.techValCol, { color: colors.onSurface }]}>{product.material}</Text>
              </View>
            )}
            {product.packaging && (
              <View style={[styles.gitTableRow, { borderBottomColor: gitBorder, borderBottomWidth: 1 }]}>
                <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>Packaging</Text>
                <Text style={[styles.techValCol, { color: colors.onSurface }]}>{product.packaging}</Text>
              </View>
            )}
            {product.weight && (
              <View style={[styles.gitTableRow, { borderBottomColor: gitBorder, borderBottomWidth: 1 }]}>
                <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>Weight</Text>
                <Text style={[styles.techValCol, { color: colors.onSurface }]}>{product.weight}</Text>
              </View>
            )}
            {product.warranty && (
              <View style={[styles.gitTableRow, { borderBottomColor: gitBorder, borderBottomWidth: 1 }]}>
                <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>Warranty</Text>
                <Text style={[styles.techValCol, { color: colors.onSurface }]}>{product.warranty}</Text>
              </View>
            )}
            {product.compliance && (
              <View style={[styles.gitTableRow, { borderBottomColor: gitBorder, borderBottomWidth: 1 }]}>
                <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>Compliance</Text>
                <Text style={[styles.techValCol, { color: colors.onSurface }]}>{product.compliance}</Text>
              </View>
            )}
            <View style={styles.gitTableRow}>
              <Text style={[styles.techKeyCol, { color: gitSubtleText }]}>Return Policy</Text>
              <Text style={[styles.techValCol, { color: colors.onSurface }]}>14 Days Manufacturer Exchange / Escrow Protected</Text>
            </View>
          </View>
        </View>

        {/* Supplier Contact */}
        {(product.supportPhone || product.supportWhatsapp) && (
          <View style={[styles.gitSection, { borderBottomColor: gitBorder }]}>
            <Text style={[styles.gitSectionHeader, { color: gitSubtleText }]}>SUPPLIER CONTACT</Text>
            <View style={styles.supportButtonsRow}>
              {product.supportPhone && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.gitContactBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => Linking.openURL(`tel:${product.supportPhone}`)}
                >
                  <MaterialIcon name="call" size={16} color="#FFFFFF" />
                  <Text style={[styles.gitContactBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>{product.supportPhone}</Text>
                </TouchableOpacity>
              )}
              {product.supportWhatsapp && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.gitContactBtn, { borderColor: gitBorder, backgroundColor: gitHeaderBg }]}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${product.supportWhatsapp?.replace(/[^0-9]/g, '')}?text=Hi, inquiring about wholesale product ${product.name}`
                    )
                  }
                >
                  <MaterialIcon name="chat" size={16} color="#2EA44F" />
                  <Text style={[styles.gitContactBtnText, { color: colors.onSurface }]}>WhatsApp Supplier</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={[styles.gitSectionHeader, { color: gitSubtleText, marginBottom: 12 }]}>SIMILAR PRODUCTS</Text>
            <ProductGridSection
              products={similarProducts}
              onProductPress={(selected) => router.push(`/product/${selected.id}`)}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Top App Bar with back button */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: gitBorder }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.safeGoBack()}
          activeOpacity={0.7}
        >
          <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>Product Details & Specifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Responsive layout: Desktop 5:7 split vs Mobile vertical scroll */}
      {isDesktop ? (
        <View style={styles.desktopContainer}>
          {/* Left Sticky Media Pane */}
          <View style={[styles.desktopLeftPane, { borderRightColor: gitBorder }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderMediaPane()}
            </ScrollView>
          </View>

          {/* Right Scrolling Specs Pane */}
          <View style={styles.desktopRightPane}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderDetailsPane()}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileContent}>
          {renderMediaPane()}
          {renderDetailsPane()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  gitButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 6,
  },
  gitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  // Desktop Layout
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopLeftPane: {
    flex: 5,
    borderRightWidth: 1,
    padding: 24,
  },
  desktopRightPane: {
    flex: 7,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  mobileContent: {
    paddingBottom: 32,
  },
  // Media Pane
  mediaContainer: {
    padding: 12,
  },
  heroBox: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 520,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F1117',
  },
  heroMainImage: {
    width: '100%',
    height: '100%',
  },
  floatingPriceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  floatingPriceText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  thumbnailStrip: {
    marginTop: 10,
    gap: 8,
  },
  thumbnailItem: {
    width: 68,
    height: 68,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnailItemSelected: {
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  // Details Pane
  detailsContainer: {
    paddingHorizontal: 12,
  },
  gitSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  brandChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 4,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warehouseText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logisticsBlock: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitPriceText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    width: 44,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  ctaSection: {
    gap: 10,
  },
  notificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  notificationText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  gitOutlineBtn: {
    flex: 1,
    minWidth: 180,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
  },
  gitOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gitPrimaryBtn: {
    flex: 1,
    minWidth: 200,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 4,
    paddingHorizontal: 14,
  },
  gitPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gitSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  gitTable: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  gitTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeadCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gitTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableDataCol: {
    flex: 1,
    fontSize: 13,
  },
  techKeyCol: {
    width: 140,
    fontSize: 12,
    fontWeight: '600',
  },
  techValCol: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  variantBlock: {
    marginTop: 4,
  },
  variantSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  colorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 4,
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sizeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 4,
  },
  sizeChipAbbr: {
    fontSize: 12,
    fontWeight: '800',
  },
  sizeChipName: {
    fontSize: 12,
    fontWeight: '500',
  },
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  gitContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  gitContactBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  similarSection: {
    paddingVertical: 16,
  },
});
