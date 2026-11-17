
export interface FeaturedCategory {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  localImage?: any;
}

export const MOCK_FEATURED_CATEGORIES: FeaturedCategory[] = [
  {
    id: '1',
    name: 'Electronics',
    subtitle: 'Collection',
    localImage: require('@/../assets/images/node/electronics-category.png'),
  },
  {
    id: '2',
    name: 'Fashion & Apparel',
    subtitle: 'Collection',
    localImage: require('@/../assets/images/node/fashion-banner.png'),
  },
  {
    id: '3',
    name: 'Industrial & Hardware',
    subtitle: 'Collection',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
  },
];
