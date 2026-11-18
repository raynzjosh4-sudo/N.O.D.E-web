import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, MOCK_PRODUCTS } from '../domain/entities/product';
import { ProductApiService, ProductFilterParams } from '../data/services/product_api_service';

interface ProductsContextType {
  products: Product[];
  popularProducts: Product[];
  isLoading: boolean;
  isPopularLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  error: string | null;
  hasMore: boolean;
  totalProducts: number;
  refreshProducts: () => Promise<void>;
  refreshPopularProducts: (categoryId?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  filterByCategory: (categoryId?: string) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  publishProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  fetchProductDetail: (id: string) => Promise<Product | undefined>;
}

const ProductsContext = createContext<ProductsContextType>({
  products: MOCK_PRODUCTS,
  popularProducts: MOCK_PRODUCTS.slice(0, 4),
  isLoading: false,
  isPopularLoading: false,
  isRefreshing: false,
  isSubmitting: false,
  error: null,
  hasMore: false,
  totalProducts: MOCK_PRODUCTS.length,
  refreshProducts: async () => {},
  refreshPopularProducts: async () => {},
  loadMore: async () => {},
  searchProducts: async () => {},
  filterByCategory: async () => {},
  updateProduct: async () => {},
  addProduct: () => MOCK_PRODUCTS[0],
  publishProduct: async () => MOCK_PRODUCTS[0],
  deleteProduct: async () => {},
  getProductById: () => undefined,
  fetchProductDetail: async () => undefined,
});

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [popularProducts, setPopularProducts] = useState<Product[]>(MOCK_PRODUCTS.slice(0, 4));
  const [isLoading, setIsLoading] = useState(true);
  const [isPopularLoading, setIsPopularLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeFilters, setActiveFilters] = useState<ProductFilterParams>({});

  const fetchPopular = useCallback(async (categoryId?: string) => {
    try {
      setIsPopularLoading(true);
      const res = await ProductApiService.getPopularProducts({ categoryId, limit: 15 });
      if (res && res.length > 0) {
        setPopularProducts(res);
      }
    } catch (err: any) {
      console.warn('API getPopularProducts error, fallback to mock:', err.message);
    } finally {
      setIsPopularLoading(false);
    }
  }, []);

  const fetchLiveProducts = useCallback(
    async (filters: ProductFilterParams = {}, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Fetch products and popular in parallel
        const [res] = await Promise.all([
          ProductApiService.getProducts({
            page: 1,
            limit: 20,
            ...filters,
          }),
          fetchPopular(filters.categoryId),
        ]);

        if (res.products && res.products.length > 0) {
          setProducts(res.products);
          setTotalProducts(res.total);
          setHasMore(res.hasMore);
          setPage(1);
        } else {
          // If empty live products, fallback to mock products
          setProducts(MOCK_PRODUCTS);
          setTotalProducts(MOCK_PRODUCTS.length);
          setHasMore(false);
        }
      } catch (err: any) {
        console.warn('API getProducts error, using cached/mock fallback:', err.message);
        setError(err.message || 'Unable to connect to live backend');
        setProducts((prev) => (prev.length > 0 ? prev : MOCK_PRODUCTS));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchPopular]
  );

  useEffect(() => {
    fetchLiveProducts();
  }, [fetchLiveProducts]);

  const refreshProducts = useCallback(async () => {
    await fetchLiveProducts(activeFilters, true);
  }, [fetchLiveProducts, activeFilters]);

  const searchProducts = useCallback(
    async (query: string) => {
      const newFilters = { ...activeFilters, search: query || undefined };
      setActiveFilters(newFilters);
      await fetchLiveProducts(newFilters);
    },
    [activeFilters, fetchLiveProducts]
  );

  const filterByCategory = useCallback(
    async (categoryId?: string) => {
      const newFilters = { ...activeFilters, categoryId: categoryId || undefined };
      setActiveFilters(newFilters);
      await fetchLiveProducts(newFilters);
    },
    [activeFilters, fetchLiveProducts]
  );

  const loadMore = useCallback(async () => {
    if (isLoading || isRefreshing || !hasMore) return;

    try {
      const nextPage = page + 1;
      const res = await ProductApiService.getProducts({
        ...activeFilters,
        page: nextPage,
        limit: 20,
      });

      if (res.products && res.products.length > 0) {
        setProducts((prev) => [...prev, ...res.products]);
        setPage(nextPage);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.warn('Load more products failed:', err.message);
    }
  }, [isLoading, isRefreshing, hasMore, page, activeFilters]);

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    // 1. Optimistic local update
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        return p;
      })
    );

    // 2. Dispatch to live API in background
    try {
      await ProductApiService.updateProduct(id, updates);
    } catch (err: any) {
      console.warn('API updateProduct failed (stored locally):', err.message);
    }
  };

  const publishProduct = async (newProd: Omit<Product, 'id'>): Promise<Product> => {
    setIsSubmitting(true);
    try {
      // Dispatch to live backend
      const created = await ProductApiService.createProduct(newProd);
      setProducts((prev) => [created, ...prev]);
      setTotalProducts((prev) => prev + 1);
      return created;
    } catch (err: any) {
      console.warn('Live API publish error, storing optimistically:', err.message);
      // Fallback optimistic local product
      const fallback: Product = {
        ...newProd,
        id: 'p_' + Date.now(),
        aspectRatio: newProd.aspectRatio || 0.85,
      };
      setProducts((prev) => [fallback, ...prev]);
      setTotalProducts((prev) => prev + 1);
      return fallback;
    } finally {
      setIsSubmitting(false);
    }
  };

  const addProduct = (newProd: Omit<Product, 'id'>): Product => {
    const created: Product = {
      ...newProd,
      id: 'p_' + Date.now(),
      aspectRatio: newProd.aspectRatio || 0.85,
    };
    setProducts((prev) => [created, ...prev]);

    // Asynchronously publish to backend
    ProductApiService.createProduct(newProd).then((liveCreated) => {
      // Replace optimistic temp id with live id
      setProducts((prev) =>
        prev.map((p) => (p.id === created.id ? liveCreated : p))
      );
    }).catch((err) => {
      console.warn('Async product publish fallback to local:', err.message);
    });

    return created;
  };

  const deleteProduct = async (id: string) => {
    // 1. Optimistic remove
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setTotalProducts((prev) => Math.max(0, prev - 1));

    // 2. Backend delete
    try {
      await ProductApiService.deleteProduct(id);
    } catch (err: any) {
      console.warn('Live API deleteProduct failed (removed locally):', err.message);
    }
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const fetchProductDetail = async (id: string): Promise<Product | undefined> => {
    try {
      const detailed = await ProductApiService.getProductById(id);
      // Merge into local state if available
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...detailed } : p))
      );
      return detailed;
    } catch {
      return getProductById(id);
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        popularProducts,
        isLoading,
        isPopularLoading,
        isRefreshing,
        isSubmitting,
        error,
        hasMore,
        totalProducts,
        refreshProducts,
        refreshPopularProducts: fetchPopular,
        loadMore,
        searchProducts,
        filterByCategory,
        updateProduct,
        addProduct,
        publishProduct,
        deleteProduct,
        getProductById,
        fetchProductDetail,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
