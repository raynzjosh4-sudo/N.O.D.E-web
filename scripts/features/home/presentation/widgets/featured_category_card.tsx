import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NodeColors as colors } from '../../../../core/theme/app_theme';
import MaterialIcon from '../../../../core/widgets/material_icon';

type FeaturedCategoryCardProps = {
  isTablet: boolean;
  isDesktop: boolean;
};

export default function FeaturedCategoryCard({
  isTablet,
  isDesktop,
}: FeaturedCategoryCardProps) {
  const cardWidth = isDesktop ? 520 : isTablet ? 420 : '85%';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carousel}>
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: isDesktop ? 350 : 280,
          },
        ]}>
        <Image
          source={require('../../../../../assets/images/node/electronics-category.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.shade} />
        <View style={styles.copy}>
          <Text style={styles.title}>Electronics</Text>
          <Text style={styles.subtitle}>Collection</Text>
          <View style={styles.explore}>
            <Text style={styles.exploreText}>Explore</Text>
            <View style={styles.arrow}>
              <MaterialIcon name="arrow_forward_ios" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    gap: 12,
    paddingHorizontal: 8,
  },
  card: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: 28,
    backgroundColor: '#455A64',
  },
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  copy: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 1,
  },
  explore: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingLeft: 16,
    paddingRight: 7,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  exploreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyan,
  },
});
