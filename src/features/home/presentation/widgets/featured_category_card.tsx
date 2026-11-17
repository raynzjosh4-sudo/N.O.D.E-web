import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { MaterialIcon } from '@/core/widgets/material_icon';
import {
  FeaturedCategory,
  MOCK_FEATURED_CATEGORIES,
} from '@/features/home/domain/entities/featured_category';

interface FeaturedCategoryCardProps {
  categories?: FeaturedCategory[];
  onCategoryPress?: (category: FeaturedCategory) => void;
  onExplorePress?: (category: FeaturedCategory) => void;
}

export function FeaturedCategoryCard({
  categories = MOCK_FEATURED_CATEGORIES,
  onCategoryPress,
  onExplorePress,
}: FeaturedCategoryCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 650;

  // Responsive card sizing: full/generous on desktop, mobile proportioned on phone
  const cardWidth = isDesktop ? 460 : isTablet ? 380 : Math.min(width * 0.85, 340);
  const cardHeight = isDesktop ? 320 : 280;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        snapToInterval={cardWidth + 14}
        decelerationRate="fast"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            activeOpacity={0.9}
            style={[styles.card, { width: cardWidth, height: cardHeight }]}
            onPress={() => onCategoryPress?.(category)}
          >
            {/* Background Image */}
            <Image
              source={category.localImage ?? { uri: category.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />

            {/* Dark Gradient / Shade Overlay */}
            <View style={styles.overlay} />

            {/* Content & Action */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {category.name}
              </Text>
              <Text style={styles.subtitle}>
                {category.subtitle ?? 'Collection'}
              </Text>

              {/* Explore Button Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.exploreButton}
                onPress={() => onExplorePress?.(category)}
              >
                <Text style={styles.exploreText}>Explore</Text>
                <View style={styles.arrowIcon}>
                  <MaterialIcon
                    name="arrow_forward_ios"
                    size={12}
                    color={AppColors.surfaceWhite}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#37474F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    padding: 22,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.surfaceWhite,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 2,
  },
  exploreButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  exploreText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: AppColors.surfaceWhite,
  },
  arrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accentCyan,
  },
});
