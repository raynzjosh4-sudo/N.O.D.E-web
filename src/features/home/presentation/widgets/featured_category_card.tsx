import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { ProductApiService } from '@/features/inventory/data/services/product_api_service';
import { CategoryDto } from '@/features/inventory/data/dto/product_dto';
import { resolveImageUrl } from '@/core/utils/image_utils';

export interface FeaturedCategoryItem {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  localImage?: any;
}

interface FeaturedCategoryCardProps {
  categories?: FeaturedCategoryItem[];
  onCategoryPress?: (category: FeaturedCategoryItem) => void;
  onExplorePress?: (category: FeaturedCategoryItem) => void;
}

export function FeaturedCategoryCard({
  categories: propCategories,
  onCategoryPress,
  onExplorePress,
}: FeaturedCategoryCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 650;

  const [apiCategories, setApiCategories] = useState<FeaturedCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) return;

    let isMounted = true;
    setIsLoading(true);

    ProductApiService.getCategories()
      .then((cats) => {
        if (!isMounted) return;
        // Filter root categories (level === 0 or no parent_id)
        const rootCats = (cats || []).filter((c) => !c.parent_id || c.level === 0);
        const mapped: FeaturedCategoryItem[] = rootCats.map((c) => ({
          id: c.id,
          name: c.name,
          subtitle: 'Wholesale Collection',
          imageUrl: resolveImageUrl(c.image_url),
        }));
        setApiCategories(mapped);
      })
      .catch((err) => {
        console.warn('Failed to fetch categories for FeaturedCategoryCard:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propCategories]);

  const items = propCategories && propCategories.length > 0 ? propCategories : apiCategories;

  // Responsive card sizing
  const cardWidth = isDesktop ? 460 : isTablet ? 380 : Math.min(width * 0.85, 340);
  const cardHeight = isDesktop ? 320 : 280;

  if (items.length === 0) {
    if (isLoading) {
      return (
        <View style={[styles.container, { height: cardHeight, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="small" color={AppColors.accentCyan} />
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        snapToInterval={cardWidth + 14}
        decelerationRate="fast"
      >
        {items.map((category) => (
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
