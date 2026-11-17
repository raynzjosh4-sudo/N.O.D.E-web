export interface PriceTier {
  minQuantity: number;
  price: number;
}

export interface ProductColor {
  name: string;
  hexCode: string;
}

export interface ProductSize {
  name: string;
  abbreviation: string;
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
  supplierName?: string;
  categoryId?: string;
  categoryName?: string;
  sku?: string;
  stockQuantity?: number;
  moq?: number;
  description?: string;
  status?: 'active' | 'low_stock' | 'draft' | 'out_of_stock';
  colors?: ProductColor[];
  sizes?: ProductSize[];
  material?: string;
  packaging?: string;
  weight?: string;
  warranty?: string;
  compliance?: string;
  supportPhone?: string;
  supportWhatsapp?: string;
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
    sku: 'LOGI-MX3S-GRY',
    stockQuantity: 420,
    moq: 5,
    status: 'active',
    categoryName: 'Electronics & Gadgets',
    supplierId: 'sup_apex',
    supplierName: 'Apex Wholesale Importers',
    material: 'Matte ABS Polymer & Textured Silicone',
    packaging: 'Commercial Bulk Carton (24 pcs)',
    weight: '141g / unit',
    warranty: '2 Years Manufacturer Warranty',
    compliance: 'UNBS Certified • CE • RoHS',
    supportPhone: '+256 700 123456',
    supportWhatsapp: '+256 700 123456',
    colors: [
      { name: 'Space Gray', hexCode: '#3A3A3C' },
      { name: 'Pale Gray', hexCode: '#E5E5EA' },
      { name: 'Graphite', hexCode: '#1C1C1E' },
    ],
    sizes: [
      { name: 'Standard Ergonomic Right', abbreviation: 'STD' },
    ],
    description: 'Quiet click performance wireless mouse with 8K DPI any-surface sensor, MagSpeed electromagnetic scrolling, and Bluetooth/Bolt connectivity.',
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
      { minQuantity: 20, price: 330000 },
    ],
  },
  {
    id: 'p2',
    name: 'Sony WH-1000XM5 Noise Canceling Headphones',
    brand: 'Sony',
    warehouseLoc: 'Industrial Area',
    srp: 1450000,
    sku: 'SNY-WH1000XM5-BLK',
    stockQuantity: 84,
    moq: 3,
    status: 'active',
    categoryName: 'Electronics & Gadgets',
    supplierId: 'sup_apex',
    supplierName: 'Apex Wholesale Importers',
    material: 'Soft Fit Synthetic Leather & Aluminum Core',
    packaging: 'Master Pack (12 units)',
    weight: '250g / unit',
    warranty: '1 Year Sony East Africa Replacement Warranty',
    compliance: 'UNBS Certified • CE Approved',
    supportPhone: '+256 700 123456',
    supportWhatsapp: '+256 700 123456',
    colors: [
      { name: 'Midnight Black', hexCode: '#000000' },
      { name: 'Platinum Silver', hexCode: '#DCDCDC' },
      { name: 'Midnight Blue', hexCode: '#1A2A44' },
    ],
    sizes: [
      { name: 'Universal Adjustable Over-Ear', abbreviation: 'OS' },
    ],
    description: 'Industry-leading noise canceling with two processors and 8 microphones. Auto NC Optimizer, magnificent call quality, and up to 30h battery life.',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.95,
    mediaUrls: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ],
    priceTiers: [
      { minQuantity: 1, price: 1450000 },
      { minQuantity: 3, price: 1290000 },
      { minQuantity: 10, price: 1180000 },
    ],
  },
  {
    id: 'p3',
    name: 'Apple iPad Air 11-inch M2 Chip',
    brand: 'Apple',
    warehouseLoc: 'Bugolobi Hub',
    srp: 2900000,
    sku: 'APL-IPADAIR-M2-128',
    stockQuantity: 1450,
    moq: 2,
    status: 'active',
    categoryName: 'Electronics & Gadgets',
    supplierId: 'sup_apex',
    supplierName: 'Apex Wholesale Importers',
    material: '100% Recycled Aluminum Enclosure',
    packaging: 'Factory Sealed Master Box (10 units)',
    weight: '462g / unit',
    warranty: '1 Year Apple International Limited Warranty',
    compliance: 'UNBS Certified • ENERGY STAR',
    supportPhone: '+256 700 123456',
    supportWhatsapp: '+256 700 123456',
    colors: [
      { name: 'Space Gray', hexCode: '#4B4846' },
      { name: 'Starlight', hexCode: '#E4DFD5' },
      { name: 'Purple', hexCode: '#9B99AC' },
      { name: 'Blue', hexCode: '#738392' },
    ],
    sizes: [
      { name: '128 GB Storage', abbreviation: '128G' },
      { name: '256 GB Storage', abbreviation: '256G' },
      { name: '512 GB Storage', abbreviation: '512G' },
    ],
    description: '11-inch Liquid Retina display powered by the breakthrough Apple M2 chip. Landscape 12MP front camera with Center Stage and superfast Wi-Fi 6E.',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.75,
    mediaUrls: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80',
    ],
    priceTiers: [
      { minQuantity: 1, price: 2900000 },
      { minQuantity: 2, price: 2650000 },
      { minQuantity: 10, price: 2490000 },
    ],
  },
  {
    id: 'p4',
    name: 'Mechanical Gaming Keyboard RGB',
    brand: 'Keychron',
    warehouseLoc: 'Kampala Central',
    srp: 380000,
    sku: 'KEY-K2-V2-RGB',
    stockQuantity: 18,
    moq: 4,
    status: 'low_stock',
    categoryName: 'Electronics & Gadgets',
    supplierId: 'sup_apex',
    supplierName: 'Apex Wholesale Importers',
    material: 'CNC Aluminum Frame & PBT Keycaps',
    packaging: 'Case Pack (10 units)',
    weight: '790g / unit',
    warranty: '1 Year Warranty',
    compliance: 'CE • FCC • RoHS',
    colors: [
      { name: 'Carbon Black', hexCode: '#222222' },
      { name: 'Retro Gray', hexCode: '#777777' },
    ],
    sizes: [
      { name: 'Red Linear Switches', abbreviation: 'RED' },
      { name: 'Blue Clicky Switches', abbreviation: 'BLU' },
      { name: 'Brown Tactile Switches', abbreviation: 'BRN' },
    ],
    description: 'Compact 75% layout Bluetooth mechanical keyboard with Mac & Windows support, hot-swappable switches, and RGB backlighting.',
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
    sku: 'GPR-HERO-4K-60',
    stockQuantity: 9,
    moq: 3,
    status: 'low_stock',
    categoryName: 'Electronics & Gadgets',
    supplierId: 'sup_apex',
    supplierName: 'Apex Wholesale Importers',
    material: 'Rugged Polymer Housing & Gorilla Glass',
    packaging: 'Retail Bundle Box (6 units)',
    weight: '153g / unit',
    warranty: '1 Year Manufacturer Exchange',
    compliance: 'UNBS Certified',
    colors: [
      { name: 'Matte Black', hexCode: '#111111' },
    ],
    sizes: [
      { name: 'Standard Edition', abbreviation: 'STD' },
      { name: 'Creator Edition Bundle', abbreviation: 'BUNDLE' },
    ],
    description: 'Waterproof 4K action camera with HyperSmooth stabilization, front LCD screen, and voice control for extreme outdoor commercial recordings.',
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
    sku: 'GRM-VIVOSMART-5',
    stockQuantity: 160,
    moq: 5,
    status: 'active',
    categoryName: 'Electronics & Gadgets',
    supplierId: 'sup_apex',
    supplierName: 'Apex Wholesale Importers',
    material: 'Polycarbonate body & Silicone band',
    packaging: 'Case Pack (20 units)',
    weight: '24.5g / unit',
    warranty: '1 Year Exchange',
    compliance: 'CE • UNBS Certified',
    colors: [
      { name: 'Midnight Black', hexCode: '#0A0A0A' },
      { name: 'Cool Mint', hexCode: '#98FF98' },
      { name: 'White', hexCode: '#F5F5F5' },
    ],
    sizes: [
      { name: 'Small / Medium Band', abbreviation: 'S/M' },
      { name: 'Large Band', abbreviation: 'L' },
    ],
    description: 'Slim wellness tracker with touchscreen, Pulse Ox sensor, 24/7 heart rate monitoring, and sleep score tracking.',
    imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=85',
    aspectRatio: 0.72,
    priceTiers: [
      { minQuantity: 1, price: 520000 },
      { minQuantity: 5, price: 440000 },
    ],
  },
];
