export interface PriceTierDto {
  minQuantity?: number;
  price?: number;
  label?: string;
}

export interface ProductColorDto {
  name: string;
  hexCode: string;
}

export interface ProductSizeDto {
  name: string;
  abbreviation: string;
}

export interface ProductMaterialDto {
  name: string;
  imageUrl?: string;
}

export interface ProductListItemDto {
  id: string;
  name: string;
  sku: string;
  brand: string;
  srp: number;
  image_url: string;
  created_at?: string;
  supplier_id?: string;
  supplier_name?: string;
  category_id?: string;
  price_tiers?: PriceTierDto[];
}

export interface PaginatedProductsDto {
  data: ProductListItemDto[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ProductSupportDto {
  whatsapp?: string;
  phone?: string;
  email?: string;
}

export interface TradingTermsDto {
  id?: string;
  content?: string;
  moq?: string;
  warranty?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
}

export interface ProductSupplierDto {
  id?: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  location?: {
    addressName?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface ProductResponseDto {
  id: string;
  sku: string;
  name: string;
  brand: string;
  srp: number;
  image_url: string;
  media_urls?: string[];
  price_tiers?: PriceTierDto[];
  aspect_ratio?: number;
  hs_code?: string;
  weight_kg?: number;
  volume_cbm?: number;
  origin_country?: string;
  unbs_number?: string;
  denier?: string;
  material?: string;
  category_id?: string;
  current_stock?: number;
  lead_time_days?: number;
  warehouse_loc?: string;
  seo_title?: string;
  seo_description?: string;
  search_keywords?: string[];
  slug?: string;
  available_colors?: ProductColorDto[];
  available_sizes?: ProductSizeDto[];
  available_materials?: ProductMaterialDto[];
  variant_label?: string;
  support?: ProductSupportDto;
  trading_terms?: TradingTermsDto;
  supplier?: ProductSupplierDto;
}

export interface CategoryDto {
  id: string;
  name: string;
  parent_id?: string | null;
  level: number;
  image_url?: string | null;
}

export interface CategoryCreatePayloadDto {
  name: string;
  parent_id?: string | null;
  level?: number;
  image_url?: string | null;
  image_base64?: string | null;
}

export interface ImageUploadResponseDto {
  url: string;
  filename?: string;
  content_type?: string;
}

export interface SupplierDto {
  id: string;
  full_name?: string;
  name?: string;
  imageUrl?: string;
  image_url?: string;
  category?: string;
}

export interface ProductCreateRequestDto {
  sku: string;
  name: string;
  brand: string;
  srp: number;
  supplier_id: string;
  category_id?: string | null;
  new_category?: CategoryCreatePayloadDto | null;
  image_url?: string | null;
  image_base64?: string | null;
  slug?: string | null;
  media_urls?: string[];
  aspect_ratio?: number;
  price_tiers?: PriceTierDto[];
  hs_code?: string | null;
  weight_kg?: number | null;
  volume_cbm?: number | null;
  origin_country?: string | null;
  unbs_number?: string | null;
  denier?: string | null;
  material?: string | null;
  current_stock?: number;
  lead_time_days?: number;
  warehouse_loc?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  search_keywords?: string[];
  available_colors?: ProductColorDto[];
  available_sizes?: ProductSizeDto[];
  available_materials?: ProductMaterialDto[];
  variant_label?: string;
  support_info?: ProductSupportDto | null;
  trading_terms?: TradingTermsDto | null;
}

export interface ProductUpdateRequestDto {
  sku?: string;
  name?: string;
  brand?: string;
  srp?: number;
  category_id?: string;
  supplier_id?: string;
  image_url?: string;
  image_base64?: string | null;
  slug?: string | null;
  media_urls?: string[];
  aspect_ratio?: number;
  price_tiers?: PriceTierDto[];
  hs_code?: string | null;
  weight_kg?: number | null;
  volume_cbm?: number | null;
  origin_country?: string | null;
  unbs_number?: string | null;
  denier?: string | null;
  material?: string | null;
  current_stock?: number;
  lead_time_days?: number;
  warehouse_loc?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  search_keywords?: string[];
  available_colors?: ProductColorDto[];
  available_sizes?: ProductSizeDto[];
  available_materials?: ProductMaterialDto[];
  variant_label?: string;
  support_info?: ProductSupportDto | null;
  trading_terms?: TradingTermsDto | null;
}

