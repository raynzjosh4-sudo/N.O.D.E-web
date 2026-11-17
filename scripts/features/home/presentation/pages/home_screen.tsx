import { ScrollView, StyleSheet, View } from 'react-native';

import { NodeColors as colors } from '../../../../core/theme/app_theme';
import { useLayoutWidth } from '../../../../core/utils/use_layout_width';
import FeaturedCategoryCard from '../widgets/featured_category_card';
import HomeHeader from '../widgets/home_header';
import HomeSearchBar from '../widgets/home_search_bar';
import PopularSection from '../widgets/popularsection/popular_section';
import ProductGridSection from '../widgets/product_grid_section';
import PromoBanners from '../widgets/promo_banners';
import QuickSelectionsList from '../widgets/quick_selections_list'
  ;

export default function HomeScreen() {
  const width = useLayoutWidth();
  const isTablet = width >= 650;
  const isDesktop = width >= 1100;
  const horizontalPadding = isDesktop ? 28 : isTablet ? 22 : 16;

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            maxWidth: isDesktop ? 1200 : 800,
            paddingHorizontal: horizontalPadding,
          },
        ]}>
        <View style={styles.header}>
          <HomeHeader />
        </View>
        <View style={styles.search}>
          <HomeSearchBar />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <PromoBanners isDesktop={isDesktop} />
          <View style={styles.suppliers}>
            <QuickSelectionsList />
          </View>
          <View style={styles.featured}>
            <FeaturedCategoryCard isTablet={isTablet} isDesktop={isDesktop} />
          </View>
          <View style={styles.popular}>
            <PopularSection />
          </View>
          <View style={styles.products}>
            <ProductGridSection isTablet={isTablet} isDesktop={isDesktop} />
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  header: {
    paddingTop: 8,
  },
  search: {
    marginTop: 8,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  suppliers: {
    marginTop: 12,
  },
  featured: {
    marginTop: 12,
  },
  popular: {
    marginTop: 12,
  },
  products: {
    marginTop: 12,
  },
});
