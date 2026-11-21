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
  productId?: string;
  entries?: any[];
  images?: string[];
  productNames?: string[];
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
  id: '',
  fullName: 'Wholesale Member',
  legalBusinessName: 'Enterprise Account',
  taxId: 'TIN: Verified',
  email: '',
  phone: '',
  warehouseAddress: 'East Africa',
  avatarUrl: undefined,
  isVerified: true,
};

export const MOCK_SAVED_ITEMS: SavedProductItem[] = [];
export const MOCK_DRAFT_ORDERS: DraftOrder[] = [];
export const MOCK_PENDING_ORDERS: WholesaleOrderItem[] = [];
export const MOCK_SENT_ORDERS: WholesaleOrderItem[] = [];
export const MOCK_PDF_DOCUMENTS: PdfDocumentItem[] = [];
