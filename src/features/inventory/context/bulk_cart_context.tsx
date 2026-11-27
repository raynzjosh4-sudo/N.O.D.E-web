import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BULK_CART_STORAGE_KEY = '@node_bulk_cart_ids_v1';
const BULK_MODE_STORAGE_KEY = '@node_bulk_mode_v1';

interface BulkCartContextType {
  bulkProductIds: string[];
  bulkCount: number;
  isBulkMode: boolean;
  setBulkMode: (enabled: boolean) => void;
  toggleBulkMode: () => void;
  addToBulkList: (productId: string) => void;
  removeFromBulkList: (productId: string) => void;
  toggleBulkItem: (productId: string) => void;
  isInBulkList: (productId: string) => boolean;
  clearBulkList: () => void;
}

const BulkCartContext = createContext<BulkCartContextType | undefined>(undefined);

export function BulkCartProvider({ children }: { children: ReactNode }) {
  const [bulkProductIds, setBulkProductIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkModeState] = useState<boolean>(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [storedIds, storedMode] = await Promise.all([
          AsyncStorage.getItem(BULK_CART_STORAGE_KEY),
          AsyncStorage.getItem(BULK_MODE_STORAGE_KEY),
        ]);
        if (!isMounted) return;
        let loadedIds: string[] = [];
        if (storedIds) {
          const parsed = JSON.parse(storedIds);
          if (Array.isArray(parsed)) {
            loadedIds = parsed.filter((x) => typeof x === 'string' && x.length > 0);
            setBulkProductIds(loadedIds);
          }
        }
        if (storedMode === 'true' || loadedIds.length > 0) {
          setIsBulkModeState(true);
        }
      } catch (e) {
        console.warn('[BulkCart] Failed to load saved bulk list:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const persistIds = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(BULK_CART_STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('[BulkCart] Failed to persist bulk list:', e);
    }
  }, []);

  const persistMode = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(BULK_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('[BulkCart] Failed to persist bulk mode:', e);
    }
  }, []);

  const setBulkMode = useCallback(
    (enabled: boolean) => {
      setIsBulkModeState(enabled);
      persistMode(enabled);
    },
    [persistMode]
  );

  const toggleBulkMode = useCallback(() => {
    setIsBulkModeState((prev) => {
      const next = !prev;
      persistMode(next);
      return next;
    });
  }, [persistMode]);

  const addToBulkList = useCallback(
    (productId: string) => {
      if (!productId) return;
      setIsBulkModeState(true);
      persistMode(true);
      setBulkProductIds((prev) => {
        if (prev.includes(productId)) return prev;
        const next = [...prev, productId];
        persistIds(next);
        return next;
      });
    },
    [persistIds, persistMode]
  );

  const removeFromBulkList = useCallback(
    (productId: string) => {
      if (!productId) return;
      setBulkProductIds((prev) => {
        const next = prev.filter((id) => id !== productId);
        persistIds(next);
        return next;
      });
    },
    [persistIds]
  );

  const toggleBulkItem = useCallback(
    (productId: string) => {
      if (!productId) return;
      setBulkProductIds((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        persistIds(next);
        if (!exists) {
          setIsBulkModeState(true);
          persistMode(true);
        }
        return next;
      });
    },
    [persistIds, persistMode]
  );

  const isInBulkList = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return bulkProductIds.includes(productId);
    },
    [bulkProductIds]
  );

  const clearBulkList = useCallback(() => {
    setBulkProductIds([]);
    setIsBulkModeState(false);
    persistIds([]);
    persistMode(false);
  }, [persistIds, persistMode]);

  return (
    <BulkCartContext.Provider
      value={{
        bulkProductIds,
        bulkCount: bulkProductIds.length,
        isBulkMode,
        setBulkMode,
        toggleBulkMode,
        addToBulkList,
        removeFromBulkList,
        toggleBulkItem,
        isInBulkList,
        clearBulkList,
      }}
    >
      {children}
    </BulkCartContext.Provider>
  );
}

export function useBulkCart(): BulkCartContextType {
  const context = useContext(BulkCartContext);
  if (!context) {
    throw new Error('useBulkCart must be used within a BulkCartProvider');
  }
  return context;
}
