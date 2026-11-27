import { Product, PriceTier } from '../domain/entities/product';

/**
 * Calculates the exact wholesale unit price based on tiered volume thresholds.
 */
export function getWholesaleUnitPrice(product: Product | null | undefined, quantity: number): number {
  if (!product) return 0;
  const tiers = product.priceTiers || [];
  const baseSrp = Number(product.srp) || 0;
  if (tiers.length === 0) return baseSrp;

  // Sort tiers descending by quantity: e.g. 30000, 28000, 25000, 23000, 22000
  const sorted = [...tiers].sort(
    (a, b) => (Number(b.minQuantity) || 0) - (Number(a.minQuantity) || 0)
  );

  for (const t of sorted) {
    const minQ = Number(t.minQuantity) || 0;
    if (quantity >= minQ) {
      return Number(t.price) || baseSrp;
    }
  }

  // If quantity is lower than the lowest volume discount tier threshold,
  // return the base product SRP price (or lowest tier price if SRP is unconfigured)
  if (baseSrp > 0) {
    return baseSrp;
  }
  const lowest = sorted[sorted.length - 1];
  return lowest ? Number(lowest.price) || 0 : 0;
}

/**
 * Finds the currently active wholesale price tier for the given quantity.
 * Returns null if the quantity does not meet any tiered volume threshold.
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
  // Quantity does not meet any wholesale volume discount tier
  return null;
}
