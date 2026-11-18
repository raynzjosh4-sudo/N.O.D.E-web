import { apiClient } from '@/core/api/api_client';
import { API_ENDPOINTS } from '@/core/api/api_endpoints';
import { Platform } from 'react-native';
import { Product } from '../../domain/entities/product';
import { compressImageWeb } from '@/core/utils/image_utils';
import {
  CategoryCreatePayloadDto,
  CategoryDto,
  ImageUploadResponseDto,
  PaginatedProductsDto,
  ProductResponseDto,
  SupplierDto,
} from '../dto/product_dto';
import { ProductMapper } from '../mappers/product_mapper';

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  supplierId?: string;
  sortBy?: string;
  ascending?: boolean;
}

export class ProductApiService {
  /**
   * Fetch only the current supplier's own posted products (requires auth token)
   */
  static async getMyProducts(params: ProductFilterParams = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search,
      sort_by: params.sortBy ?? 'created_at',
      ascending: params.ascending ?? false,
    };

    const response = await apiClient<PaginatedProductsDto>(API_ENDPOINTS.PRODUCTS.MY_PRODUCTS, {
      params: queryParams,
    });

    const products = (response.data || []).map((item, idx) =>
      ProductMapper.fromListItemDto(item, idx)
    );

    return {
      products,
      total: response.total ?? products.length,
      page: response.page ?? 1,
      limit: response.limit ?? 50,
      hasMore: response.has_more ?? false,
    };
  }

  /**
   * Fetch paginated products from live API
   */
  static async getProducts(params: ProductFilterParams = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      category_id: params.categoryId,
      supplier_id: params.supplierId,
      sort_by: params.sortBy ?? 'created_at',
      ascending: params.ascending ?? false,
    };

    const response = await apiClient<PaginatedProductsDto>(API_ENDPOINTS.PRODUCTS.LIST, {
      params: queryParams,
    });

    const products = (response.data || []).map((item, idx) =>
      ProductMapper.fromListItemDto(item, idx)
    );

    return {
      products,
      total: response.total ?? products.length,
      page: response.page ?? 1,
      limit: response.limit ?? 20,
      hasMore: response.has_more ?? false,
    };
  }

  /**
   * Fetch popular wholesale products from live API
   */
  static async getPopularProducts(params?: {
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const queryParams: Record<string, string | number | undefined> = {
      category_id: params?.categoryId,
      limit: params?.limit ?? 15,
      offset: params?.offset ?? 0,
    };

    const response = await apiClient<ProductResponseDto[]>(API_ENDPOINTS.PRODUCTS.POPULAR, {
      params: queryParams,
    });

    return (response || []).map((item) => ProductMapper.fromResponseDto(item));
  }

  /**
   * Fetch detailed product specifications by ID
   */
  static async getProductById(id: string): Promise<Product> {
    try {
      const response = await apiClient<ProductResponseDto>(API_ENDPOINTS.PRODUCTS.DETAIL(id));
      return ProductMapper.fromResponseDto(response);
    } catch (err) {
      // If single-item lookup endpoint fails, fallback to fetching from list
      const listRes = await this.getProducts({ limit: 100 });
      const found = listRes.products.find((p) => p.id === id);
      if (found) {
        return found;
      }
      throw err;
    }
  }

  /**
   * Fetch all product categories
   */
  static async getCategories(): Promise<CategoryDto[]> {
    return apiClient<CategoryDto[]>(API_ENDPOINTS.PRODUCTS.CATEGORIES);
  }

  /**
   * Create a new category or sub-category in the catalog hierarchy (Cloudflare R2 image supported)
   */
  static async createCategory(
    data: CategoryCreatePayloadDto,
    token?: string
  ): Promise<CategoryDto> {
    return await apiClient<CategoryDto>(API_ENDPOINTS.PRODUCTS.CREATE_CATEGORY, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        parent_id: data.parent_id || null,
        image_url: data.image_url || null,
        image_base64: data.image_base64 || null,
        level: data.level ?? 0,
      }),
      token,
    });
  }

  /**
   * Create a new category or sub-category with a direct multipart image upload (Cloudflare R2)
   */
  static async createCategoryWithImage(
    data: {
      name: string;
      parent_id?: string | null;
      level?: number;
      file: { uri: string; name?: string; type?: string } | Blob | File;
    },
    token?: string
  ): Promise<CategoryDto> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.parent_id) {
      formData.append('parent_id', data.parent_id);
    }
    if (data.level !== undefined) {
      formData.append('level', String(data.level));
    }

    if (Platform.OS === 'web') {
      if (typeof Blob !== 'undefined' && (data.file instanceof Blob || (typeof File !== 'undefined' && data.file instanceof File))) {
        const compressed = await compressImageWeb(data.file as Blob);
        formData.append('file', compressed, (data.file as File).name || 'category.jpg');
      } else {
        const fileObj = data.file as { uri: string; name?: string; type?: string };
        const fetched = await fetch(fileObj.uri);
        const blob = await fetched.blob();
        const compressed = await compressImageWeb(blob);
        formData.append('file', compressed, fileObj.name || 'category.jpg');
      }
    } else {
      const fileObj = data.file as { uri: string; name?: string; type?: string };
      formData.append('file', {
        uri: fileObj.uri,
        name: fileObj.name || 'category.jpg',
        type: fileObj.type || 'image/jpeg',
      } as any);
    }

    return apiClient<CategoryDto>(API_ENDPOINTS.PRODUCTS.CATEGORIES_WITH_IMAGE, {
      method: 'POST',
      body: formData,
      token,
    });
  }

  /**
   * Upload / update category cover image on Cloudflare R2
   */
  static async uploadCategoryImage(
    categoryId: string,
    file: { uri: string; name?: string; type?: string } | Blob | File,
    token?: string
  ): Promise<CategoryDto> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (typeof Blob !== 'undefined' && (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File))) {
        const compressed = await compressImageWeb(file as Blob);
        formData.append('file', compressed, (file as File).name || 'category.jpg');
      } else {
        const fileObj = file as { uri: string; name?: string; type?: string };
        const fetched = await fetch(fileObj.uri);
        const blob = await fetched.blob();
        const compressed = await compressImageWeb(blob);
        formData.append('file', compressed, fileObj.name || 'category.jpg');
      }
    } else {
      const fileObj = file as { uri: string; name?: string; type?: string };
      formData.append('file', {
        uri: fileObj.uri,
        name: fileObj.name || 'category.jpg',
        type: fileObj.type || 'image/jpeg',
      } as any);
    }

    return apiClient<CategoryDto>(API_ENDPOINTS.PRODUCTS.CATEGORY_IMAGE(categoryId), {
      method: 'POST',
      body: formData,
      token,
    });
  }

  /**
   * Upload an image file to Cloudflare R2 via backend
   */
  static async uploadImage(
    file: { uri: string; name?: string; type?: string } | Blob | File,
    token?: string
  ): Promise<ImageUploadResponseDto> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (typeof Blob !== 'undefined' && (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File))) {
        const compressed = await compressImageWeb(file as Blob);
        formData.append('file', compressed, (file as File).name || 'image.jpg');
      } else {
        const fileObj = file as { uri: string; name?: string; type?: string };
        const fetched = await fetch(fileObj.uri);
        const blob = await fetched.blob();
        const compressed = await compressImageWeb(blob);
        formData.append('file', compressed, fileObj.name || 'image.jpg');
      }
    } else {
      const fileObj = file as { uri: string; name?: string; type?: string };
      formData.append('file', {
        uri: fileObj.uri,
        name: fileObj.name || 'product_image.jpg',
        type: fileObj.type || 'image/jpeg',
      } as any);
    }

    return apiClient<ImageUploadResponseDto>(API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE, {
      method: 'POST',
      body: formData,
      token,
    });
  }

  /**
   * Directly upload an image for an existing product to Cloudflare R2
   */
  static async uploadProductImage(
    productId: string,
    file: { uri: string; name?: string; type?: string } | Blob | File,
    token?: string
  ): Promise<Product> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (typeof Blob !== 'undefined' && (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File))) {
        const compressed = await compressImageWeb(file as Blob);
        formData.append('file', compressed, (file as File).name || 'image.jpg');
      } else {
        const fileObj = file as { uri: string; name?: string; type?: string };
        const fetched = await fetch(fileObj.uri);
        const blob = await fetched.blob();
        const compressed = await compressImageWeb(blob);
        formData.append('file', compressed, fileObj.name || 'image.jpg');
      }
    } else {
      const fileObj = file as { uri: string; name?: string; type?: string };
      formData.append('file', {
        uri: fileObj.uri,
        name: fileObj.name || 'product_image.jpg',
        type: fileObj.type || 'image/jpeg',
      } as any);
    }

    const response = await apiClient<ProductResponseDto>(
      API_ENDPOINTS.PRODUCTS.UPLOAD_PRODUCT_IMAGE(productId),
      {
        method: 'POST',
        body: formData,
        token,
      }
    );
    return ProductMapper.fromResponseDto(response);
  }

  /**
   * Fetch verified suppliers
   */
  static async getSuppliers(): Promise<SupplierDto[]> {
    return apiClient<SupplierDto[]>(API_ENDPOINTS.PRODUCTS.SUPPLIERS);
  }

  /**
   * Publish a new product to the catalog
   */
  static async createProduct(
    product: Partial<Product>,
    options?: { token?: string; supplierId?: string }
  ): Promise<Product> {
    const payload = ProductMapper.toCreateDto(product, options?.supplierId);
    const response = await apiClient<ProductResponseDto>(API_ENDPOINTS.PRODUCTS.LIST, {
      method: 'POST',
      body: JSON.stringify(payload),
      token: options?.token,
    });
    return ProductMapper.fromResponseDto(response);
  }

  /**
   * Update an existing product
   */
  static async updateProduct(
    id: string,
    updates: Partial<Product>,
    token?: string
  ): Promise<Product> {
    const payload = ProductMapper.toUpdateDto(updates);
    const response = await apiClient<ProductResponseDto>(API_ENDPOINTS.PRODUCTS.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    });
    return ProductMapper.fromResponseDto(response);
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string, token?: string): Promise<void> {
    await apiClient<void>(API_ENDPOINTS.PRODUCTS.DETAIL(id), {
      method: 'DELETE',
      token,
    });
  }
}
