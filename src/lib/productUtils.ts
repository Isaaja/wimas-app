import { Product } from "@/hooks/useProducts";

/**
 * Helper function to calculate available units count
 * Filters units by condition === "GOOD" and status === "AVAILABLE"
 */
export const getAvailableCount = (product: Product | any): number => {
  if (!product || !product.units) return 0;
  return (
    product.units.filter(
      (unit: any) => unit.condition === "GOOD" && unit.status === "AVAILABLE"
    ).length || 0
  );
};
