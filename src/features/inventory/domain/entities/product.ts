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

export interface ProductMaterialItem {
  name: string;
  imageUrl?: string;
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
  slug?: string;
  stockQuantity?: number;
  moq?: number;
  moqText?: string;
  description?: string;
  status?: 'active' | 'low_stock' | 'draft' | 'out_of_stock';
  colors?: ProductColor[];
  sizes?: ProductSize[];
  materialsList?: ProductMaterialItem[];
  material?: string;
  denier?: string;
  hsCode?: string;
  unbsNumber?: string;
  weight?: string;
  volumeCbm?: string;
  originCountry?: string;
  leadTimeDays?: string;
  packaging?: string;
  warranty?: string;
  compliance?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  seoTitle?: string;
  seoDescription?: string;
  mediaUrls?: string[];
  imageBase64?: string;
  priceTiers: PriceTier[];
}

export const MOCK_PRODUCTS: Product[] = [];

