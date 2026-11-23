import { Product, PriceTier } from '../domain/entities/product';

/**
 * Calculates the exact wholesale unit price based on tiered volume thresholds.
 */
export function getWholesaleUnitPrice(product: Product | null | undefined, quantity: number): number {
  if (!product) return 0;
  const tiers = product.priceTiers || [];
  if (tiers.length === 0) return product.srp || 0;

  // Sort tiers descending: e.g. 100 pcs, 50 pcs, 10 pcs, 5 pcs
  const sorted = [...tiers].sort(
    (a, b) => (Number(b.minQuantity) || 0) - (Number(a.minQuantity) || 0)
  );

  for (const t of sorted) {
    const minQ = Number(t.minQuantity) || 0;
    if (quantity >= minQ) {
      return Number(t.price) || product.srp || 0;
    }
  }

  // If quantity is lower than lowest tier, default to lowest tier price or product SRP
  const lowest = sorted[sorted.length - 1];
  return lowest ? Number(lowest.price) || product.srp || 0 : product.srp || 0;
}

/**
 * Finds the currently active wholesale price tier for the given quantity.
 */
export function getActiveWholesaleTier(
  product: Product | null | undefined,
  quantity: number
): PriceTier | null {
  if (!product || !product.priceTiers || product.priceTiers.length === 0) return null;
  const sorted = [...product.priceTiers].sort(
    (a, b) => (Number(b.minQuantity) || 0) - (Number(a.minQuantity) || 0)
  );

  for (const t of sorted) {
    if (quantity >= (Number(t.minQuantity) || 0)) {
      return t;
    }
  }
  return sorted[sorted.length - 1] || null;
}
