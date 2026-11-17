export interface CategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  itemCount: number;
  subCategories?: CategoryItem[];
}

export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat_electronics',
    name: 'Electronics & Gadgets',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&auto=format&fit=crop&q=80',
    itemCount: 0,
    subCategories: [
      {
        id: 'cat_phones',
        name: 'Mobile Phones & Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
        itemCount: 0,
        subCategories: [
          {
            id: 'cat_smartphones',
            name: 'Smartphones & Flagships',
            imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80',
            itemCount: 16,
          },
          {
            id: 'cat_chargers_cables',
            name: 'Fast Chargers & Cables',
            imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
            itemCount: 22,
          },
          {
            id: 'cat_cases_screen',
            name: 'Screen Protectors & Cases',
            imageUrl: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=300&auto=format&fit=crop&q=80',
            itemCount: 35,
          },
        ],
      },
      {
        id: 'cat_computers',
        name: 'Laptops & Computers',
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop&q=80',
        itemCount: 0,
        subCategories: [
          {
            id: 'cat_business_laptops',
            name: 'Business Laptops',
            imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
            itemCount: 12,
          },
          {
            id: 'cat_computer_peripherals',
            name: 'Keyboards, Mice & Docks',
            imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80',
            itemCount: 28,
          },
        ],
      },
      {
        id: 'cat_audio',
        name: 'Headphones & Audio',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
        itemCount: 32,
      },
    ],
  },
  {
    id: 'cat_fashion',
    name: 'Fashion & Apparel',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&auto=format&fit=crop&q=80',
    itemCount: 0,
    subCategories: [
      {
        id: 'cat_mens_clothing',
        name: "Men's Clothing",
        imageUrl: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=300&auto=format&fit=crop&q=80',
        itemCount: 45,
      },
      {
        id: 'cat_womens_clothing',
        name: "Women's Clothing",
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=80',
        itemCount: 60,
      },
      {
        id: 'cat_footwear',
        name: 'Shoes & Footwear',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
        itemCount: 28,
      },
    ],
  },
  {
    id: 'cat_groceries',
    name: 'Wholesale Groceries',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
    itemCount: 52,
  },
  {
    id: 'cat_hardware',
    name: 'Industrial & Hardware',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80',
    itemCount: 40,
  },
  {
    id: 'cat_home',
    name: 'Home & Kitchen Appliances',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&auto=format&fit=crop&q=80',
    itemCount: 19,
  },
];
