import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface PromoBannersProps {
  onPostProductPress?: () => void;
  onPromoPress?: (promoId: string) => void;
  isSupplierOrAdmin?: boolean;
}

export function PromoBanners({
  onPostProductPress,
  onPromoPress,
  isSupplierOrAdmin = false,
}: PromoBannersProps) {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const isDesktop = width >= 960;

  // -------------------------------------------------------------
  // DESKTOP LAYOUT: Hero 3-Column Bento Grid
  // -------------------------------------------------------------
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Left Wide Hero Bento Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroCard}
          onPress={() => onPromoPress?.('campaign-hero')}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=85',
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <MaterialIcon name="local_fire_department" size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>MEGA WHOLESALE DISCOUNTS</Text>
            </View>

            <Text style={styles.heroTitle}>Bulk Procurement Deals{'\n'}Up to 40% Off</Text>
            <Text style={styles.heroSubtitle}>
              Direct supply from verified East African manufacturers & distributors.
            </Text>

            <View style={styles.heroActionRow}>
              <View style={styles.heroCtaButton}>
                <Text style={styles.heroCtaText}>Explore Deals</Text>
                <MaterialIcon name="arrow_forward" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.heroTerms}>*Minimum Order Quantities apply</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right 2 Stacked Quick Action Bento Cards */}
        <View style={styles.stackedColumn}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.bentoTopCard}
            onPress={() => onPromoPress?.('campaign-freight')}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={styles.subOverlay} />
            <View style={styles.bentoCardContent}>
              <View style={styles.fastTag}>
                <Text style={styles.fastTagText}>FREE LOGISTICS</Text>
              </View>
              <Text style={styles.bentoCardTitle}>Express Freight Delivery</Text>
              <Text style={styles.bentoCardSubtitle}>Zero transit fee for orders above UGX 5M</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.bentoBottomCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={onPostProductPress}
          >
            <View style={styles.supplierCardContent}>
              <View style={[styles.supplierIconBox, { backgroundColor: colors.primary + '18' }]}>
                <MaterialIcon name="storefront" size={26} color={colors.primary} />
              </View>
              <View style={styles.supplierTextGroup}>
                <Text style={[styles.supplierTitle, { color: colors.onSurface }]}>
                  {isSupplierOrAdmin ? 'Supplier Catalog & Posts' : 'Become a NODE Supplier'}
                </Text>
                <Text style={[styles.supplierSubtitle, { color: colors.onSurfaceMuted }]}>
                  {isSupplierOrAdmin
                    ? 'Manage wholesale inventory, stock quantities, and tier prices.'
                    : 'Connect with over 10,000+ commercial retail buyers nationwide.'}
                </Text>
              </View>
              <View style={styles.supplierChevron}>
                <MaterialIcon name="chevron_right" size={20} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // MOBILE / TABLET LAYOUT: EXACT 3-BANNER COMBO MATCHING FLUTTER
  // (Left 60% Large Hero + Right 40% 2 Stacked Tiles)
  // -------------------------------------------------------------
  return (
    <View style={styles.mobileContainer}>
      <View style={styles.mobileRow}>
        {/* 1. Large Left Banner (flex: 6) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.mobileMainBanner}
          onPress={() => onPromoPress?.('campaign-main')}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.mobileGradient} />
          
          <View style={styles.mobileCenterTitle}>
            <Text style={styles.mobileMainTitle}>WHOLESALE</Text>
          </View>

          <View style={styles.mobileBottomInfo}>
            <View style={styles.mobileActionCircle}>
              <Text style={styles.mobileActionText}>SHOP{'\n'}NOW</Text>
            </View>
            <Text style={styles.mobileMainSubtitle}>Direct factory prices</Text>
          </View>
        </TouchableOpacity>

        {/* 2 & 3. Right Stacked 2 Banners (flex: 4) */}
        <View style={styles.mobileStackColumn}>
          {/* Top Sub Banner */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.mobileTopSub}
            onPress={() => onPromoPress?.('campaign-top')}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={styles.mobileSubOverlay} />
            <Text style={styles.mobileSubTopTitle}>Free shipping</Text>
          </TouchableOpacity>

          {/* Bottom Sub Banner (Posts / Bulk) */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.mobileBottomSub}
            onPress={onPostProductPress}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={styles.mobileDarkenOverlay} />
            <Text style={styles.mobileSubBottomTitle}>
              {isSupplierOrAdmin ? 'Catalog' : 'Become Supplier'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Desktop Bento Styles
  desktopContainer: {
    flexDirection: 'row',
    height: 320,
    gap: 16,
    paddingHorizontal: 16,
    marginVertical: 14,
    width: '100%',
  },
  heroCard: {
    flex: 6.2,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  heroContent: {
    padding: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.moqOrange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Outfit_900Black',
    color: '#FFFFFF',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    maxWidth: 520,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  },
  heroCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  heroCtaText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  heroTerms: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stackedColumn: {
    flex: 3.8,
    flexDirection: 'column',
    gap: 14,
  },
  bentoTopCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#1E293B',
  },
  subOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  bentoCardContent: {
    padding: 16,
  },
  fastTag: {
    backgroundColor: AppColors.accentCyan,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  fastTagText: {
    fontSize: 9.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
  },
  bentoCardTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
  },
  bentoCardSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  bentoBottomCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(18, 187, 240, 0.18)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  supplierCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supplierIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierTextGroup: {
    flex: 1,
  },
  supplierTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  supplierSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.55)',
    marginTop: 2,
  },
  supplierChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mobile Exact 3-Banner Styles (Matching Flutter)
  mobileContainer: {
    marginVertical: 10,
    width: '100%',
    paddingHorizontal: 16,
  },
  mobileRow: {
    flexDirection: 'row',
    height: 145,
    gap: 8,
    width: '100%',
  },
  mobileMainBanner: {
    flex: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    justifyContent: 'center',
  },
  mobileGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  mobileCenterTitle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileMainTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_900Black',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mobileBottomInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mobileActionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileActionText: {
    fontSize: 7.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 9,
  },
  mobileMainSubtitle: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  mobileStackColumn: {
    flex: 4,
    flexDirection: 'column',
    gap: 8,
  },
  mobileTopSub: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#334155',
    padding: 8,
  },
  mobileSubOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mobileSubTopTitle: {
    fontSize: 9.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mobileBottomSub: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#263238',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDarkenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileSubBottomTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
});
