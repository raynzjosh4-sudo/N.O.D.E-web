export interface Supplier {
  id: string;
  name: string;
  imageUrl?: string;
  category: string;
  location?: string;
  rating?: number;
  productCount?: number;
  isVerified?: boolean;
}

export const MOCK_SUPPLIERS: Supplier[] = [];
