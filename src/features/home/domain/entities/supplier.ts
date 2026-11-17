export interface Supplier {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  location?: string;
  rating?: number;
  productCount?: number;
  isVerified?: boolean;
}

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'Apex Wholesale Importers',
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=200&auto=format&fit=crop&q=80',
    category: 'Food & Beverage',
    location: 'Plot 44, 7th Street Industrial Area, Kampala',
    rating: 4.9,
    productCount: 142,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Prime Imports & Logistics',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
    category: 'Groceries',
    location: 'Bugolobi Logistics Hub, Gate 2',
    rating: 4.8,
    productCount: 96,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Vanguard Global Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    category: 'Electronics',
    location: 'Jinja Road Freight Terminal, Kyambogo',
    rating: 4.9,
    productCount: 310,
    isVerified: true,
  },
  {
    id: '4',
    name: 'Horizon Trade & Freight',
    imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=200&auto=format&fit=crop&q=80',
    category: 'Manufacturing',
    location: 'Namanve Industrial Park',
    rating: 4.7,
    productCount: 88,
    isVerified: true,
  },
  {
    id: '5',
    name: 'Kikuubo Central Distributors',
    imageUrl: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80',
    category: 'Fashion',
    location: 'Kikuubo Business Hub, Downtown Kampala',
    rating: 4.8,
    productCount: 220,
    isVerified: true,
  },
  {
    id: '6',
    name: 'Victoria Hardware & Steel Works',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=200&auto=format&fit=crop&q=80',
    category: 'Manufacturing',
    location: '6th Street Industrial Area, Kampala',
    rating: 4.9,
    productCount: 175,
    isVerified: true,
  },
  {
    id: '7',
    name: 'Nile Agro Processing Co.',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&auto=format&fit=crop&q=80',
    category: 'Food & Beverage',
    location: 'Jinja Industrial Estate',
    rating: 4.6,
    productCount: 64,
    isVerified: true,
  },
  {
    id: '8',
    name: 'Equator Home & Living Ltd',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
    category: 'Home & Living',
    location: 'Lugogo Bypass Commercial Centre',
    rating: 4.7,
    productCount: 130,
    isVerified: true,
  },
  {
    id: '9',
    name: 'Pearl Textiles & Apparel Hub',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&auto=format&fit=crop&q=80',
    category: 'Fashion',
    location: 'Luwum Street Wholesale Arcade',
    rating: 4.8,
    productCount: 190,
    isVerified: true,
  },
  {
    id: '10',
    name: 'Atlas Electronic Solutions',
    imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&auto=format&fit=crop&q=80',
    category: 'Electronics',
    location: 'Kampala Boulevard, Level 3',
    rating: 4.9,
    productCount: 245,
    isVerified: true,
  },
];
