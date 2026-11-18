import { Product } from '@/features/inventory/domain/entities/product';

export interface UserProfile {
  id: string;
  fullName: string;
  legalBusinessName: string;
  taxId: string;
  email: string;
  phone: string;
  warehouseAddress: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface SavedProductItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor: { label: string; color: string };
  selectedSize: string;
  addedAt: string;
}

export interface DraftOrder {
  id: string;
  title: string;
  itemsCount: number;
  totalUnits: number;
  estimatedTotal: number;
  updatedAt: string;
  supplierName: string;
}

export type OrderStatusCode = 'pending' | 'processing' | 'dispatched' | 'completed' | 'cancelled';

export interface WholesaleOrderItem {
  id: string;
  orderNumber: string;
  date: string;
  supplierName: string;
  status: OrderStatusCode;
  totalUnits: number;
  totalAmount: number;
  trackingNumber?: string;
  warehouseDestination: string;
  pdfId?: string;
  itemSummary: string;
}

export interface PdfDocumentItem {
  id: string;
  title: string;
  orderNumber: string;
  fileSize: string;
  updatedAt: string;
  downloadUrl?: string;
}

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'usr-1',
  fullName: 'Apex Wholesale Importers',
  legalBusinessName: 'Apex Commercial Supplies Ltd',
  taxId: 'TIN: 1002948123',
  email: 'procurement@apexwholesale.ug',
  phone: '+256 700 123 456',
  warehouseAddress: 'Plot 44, 7th Street Industrial Area, Kampala',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  isVerified: true,
};

export const MOCK_SAVED_ITEMS: SavedProductItem[] = [];

export const MOCK_DRAFT_ORDERS: DraftOrder[] = [
  {
    id: 'draft-1',
    title: 'Q4 Electronics Restock • Apex Hub',
    itemsCount: 3,
    totalUnits: 45,
    estimatedTotal: 28450000,
    updatedAt: '2026-11-16T17:30:00Z',
    supplierName: 'Apex Wholesale Importers',
  },
  {
    id: 'draft-2',
    title: 'Fast-Moving Audio & Gadgets Batch',
    itemsCount: 2,
    totalUnits: 20,
    estimatedTotal: 9600000,
    updatedAt: '2026-11-14T11:00:00Z',
    supplierName: 'Prime Import Hub',
  },
];

export const MOCK_PENDING_ORDERS: WholesaleOrderItem[] = [
  {
    id: 'ord-101',
    orderNumber: 'ND-ORD-88210',
    date: '2026-11-16T13:00:00Z',
    supplierName: 'Apex Wholesale Importers',
    status: 'pending',
    totalUnits: 25,
    totalAmount: 9000000,
    warehouseDestination: 'Kampala Central Warehouse',
    itemSummary: '25x Logitech MX Master 3S Wireless Mouse (Space Gray)',
  },
  {
    id: 'ord-102',
    orderNumber: 'ND-ORD-88195',
    date: '2026-11-15T09:30:00Z',
    supplierName: 'East Africa Tech Distribution',
    status: 'processing',
    totalUnits: 10,
    totalAmount: 14500000,
    warehouseDestination: 'Bugolobi Logistics Hub',
    itemSummary: '10x Sony WH-1000XM5 Noise Canceling Headphones',
  },
];

export const MOCK_SENT_ORDERS: WholesaleOrderItem[] = [
  {
    id: 'ord-201',
    orderNumber: 'ND-ORD-87940',
    date: '2026-11-13T10:15:00Z',
    supplierName: 'Global Commodities Direct',
    status: 'dispatched',
    totalUnits: 50,
    totalAmount: 32500000,
    trackingNumber: 'TRK-SWIFT-883921',
    warehouseDestination: 'Industrial Area Section 4 Hub',
    itemSummary: '50x Lenovo ThinkPad Enterprise Laptops',
    pdfId: 'pdf-201',
  },
  {
    id: 'ord-202',
    orderNumber: 'ND-ORD-86510',
    date: '2026-11-08T14:00:00Z',
    supplierName: 'Uganda Agro Wholesale',
    status: 'completed',
    totalUnits: 200,
    totalAmount: 18400000,
    trackingNumber: 'TRK-FREIGHT-440219',
    warehouseDestination: 'Jinja Road Main Warehouse',
    itemSummary: '200x Premium Basmati Rice (25kg Bags)',
    pdfId: 'pdf-202',
  },
  {
    id: 'ord-203',
    orderNumber: 'ND-ORD-85190',
    date: '2026-10-28T16:45:00Z',
    supplierName: 'PowerTech Solar Uganda',
    status: 'completed',
    totalUnits: 15,
    totalAmount: 24750000,
    trackingNumber: 'TRK-POWER-109283',
    warehouseDestination: 'Kampala Central Warehouse',
    itemSummary: '15x 5kVA Hybrid Solar Inverters',
    pdfId: 'pdf-203',
  },
];

export const MOCK_PDF_DOCUMENTS: PdfDocumentItem[] = [
  {
    id: 'pdf-1',
    title: 'Commercial Wholesale Invoice #ND-ORD-88210',
    orderNumber: 'ND-ORD-88210',
    fileSize: '245 KB',
    updatedAt: '2026-11-16T13:05:00Z',
  },
  {
    id: 'pdf-2',
    title: 'Pallet Delivery Note & UNBS QA Cert #ND-ORD-87940',
    orderNumber: 'ND-ORD-87940',
    fileSize: '1.2 MB',
    updatedAt: '2026-11-13T10:30:00Z',
  },
  {
    id: 'pdf-3',
    title: 'Tax Invoice & Escrow Release #ND-ORD-86510',
    orderNumber: 'ND-ORD-86510',
    fileSize: '312 KB',
    updatedAt: '2026-11-08T14:15:00Z',
  },
];
