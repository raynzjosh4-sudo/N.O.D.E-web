export interface PriceTier {
  minQuantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  warehouseLoc: string;
  srp: number;
  imageUrl: string;
  aspectRatio?: number;
  supplierId?: string;
  categoryId?: string;
  mediaUrls?: string[];
  priceTiers: PriceTier[];
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Logitech MX Master 3S Wireless Mouse',
    brand: 'Logitech',
    warehouseLoc: 'Kampala Central',
    srp: 420000,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.85,
    mediaUrls: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626218174358-7769486c4b79?w=600&auto=format&fit=crop&q=80',
    ],
    priceTiers: [
      { minQuantity: 1, price: 420000 },
      { minQuantity: 5, price: 360000 },
    ],
  },
  {
    id: 'p2',
    name: 'Sony WH-1000XM5 Noise Canceling Headphones',
    brand: 'Sony',
    warehouseLoc: 'Industrial Area',
    srp: 1450000,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.95,
    mediaUrls: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ],
    priceTiers: [
      { minQuantity: 1, price: 1450000 },
      { minQuantity: 3, price: 1290000 },
    ],
  },
  {
    id: 'p3',
    name: 'Apple iPad Air 11-inch M2 Chip',
    brand: 'Apple',
    warehouseLoc: 'Bugolobi Hub',
    srp: 2900000,
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.75,
    mediaUrls: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80',
    ],
    priceTiers: [
      { minQuantity: 1, price: 2900000 },
      { minQuantity: 2, price: 2650000 },
    ],
  },
  {
    id: 'p4',
    name: 'Mechanical Gaming Keyboard RGB',
    brand: 'Keychron',
    warehouseLoc: 'Kampala Central',
    srp: 380000,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.8,
    mediaUrls: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    ],
    priceTiers: [
      { minQuantity: 1, price: 380000 },
      { minQuantity: 4, price: 320000 },
    ],
  },
  {
    id: 'p5',
    name: '4K Ultra HD Action Camera 60fps',
    brand: 'GoPro',
    warehouseLoc: 'Ntinda depot',
    srp: 1200000,
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.9,
    priceTiers: [
      { minQuantity: 1, price: 1200000 },
      { minQuantity: 3, price: 1050000 },
    ],
  },
  {
    id: 'p6',
    name: 'Smart Fitness Tracker & Heart Monitor',
    brand: 'Garmin',
    warehouseLoc: 'Kololo Main',
    srp: 520000,
    imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.72,
    priceTiers: [
      { minQuantity: 1, price: 520000 },
      { minQuantity: 5, price: 440000 },
    ],
  },
];
