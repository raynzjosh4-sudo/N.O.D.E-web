import React, { createContext, useContext, useState } from 'react';
import { Product, MOCK_PRODUCTS } from '../domain/entities/product';

interface ProductsContextType {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType>({
  products: MOCK_PRODUCTS,
  updateProduct: () => {},
  addProduct: () => MOCK_PRODUCTS[0],
  deleteProduct: () => {},
  getProductById: () => undefined,
});

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        return p;
      })
    );
  };

  const addProduct = (newProd: Omit<Product, 'id'>): Product => {
    const created: Product = {
      ...newProd,
      id: 'p_' + Date.now(),
      aspectRatio: newProd.aspectRatio || 0.85,
    };
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        updateProduct,
        addProduct,
        deleteProduct,
        getProductById,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
