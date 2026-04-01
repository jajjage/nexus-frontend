/**
 * Reseller Product Utilities
 * Helper functions for working with products in the reseller API context
 */

import type { PublicProduct } from "@/types/product.types";

/**
 * Check if a product is eligible for Reseller API purchase
 *
 * A product is purchasable via Reseller API only if:
 * - isActive is true
 * - denomAmount is a number (not string or null)
 * - denomAmount is greater than 0 (fixed-price product)
 *
 * Products with denomAmount of 0, null, or string are variable/range products
 * which are not yet supported by the Reseller API endpoint.
 *
 * @param product - Product from /api/v1/products
 * @returns true if product can be purchased via /reseller/api/purchases
 */
export function isFixedPriceProduct(product: PublicProduct): boolean {
  if (!product.isActive) {
    return false;
  }

  const amount = product.denomAmount;

  // Check if denomAmount is a valid positive number
  if (typeof amount !== "number" && typeof amount !== "string") {
    return false;
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Check if a product is a variable/range airtime product
 * These are currently NOT supported by the Reseller API
 *
 * @param product - Product from /api/v1/products
 * @returns true if product is a variable airtime product
 */
export function isVariableAirtimeProduct(product: PublicProduct): boolean {
  return (
    product.productType === "airtime" &&
    (product.denomAmount === null ||
      product.denomAmount === 0 ||
      (typeof product.denomAmount === "string" &&
        (product.denomAmount === "" || parseFloat(product.denomAmount) === 0)))
  );
}

/**
 * Check if a product is a data bundle
 *
 * @param product - Product from /api/v1/products
 * @returns true if product is a data product
 */
export function isDataProduct(product: PublicProduct): boolean {
  return product.productType === "data";
}

/**
 * Check if a product is an airtime product
 *
 * @param product - Product from /api/v1/products
 * @returns true if product is an airtime product
 */
export function isAirtimeProduct(product: PublicProduct): boolean {
  return product.productType === "airtime";
}

/**
 * Safely convert denomAmount to a number
 * Handles string, number, or null values
 *
 * @param denomAmount - The denomAmount value from a product
 * @param defaultValue - Default value if denomAmount is null/invalid (default: 0)
 * @returns Parsed number
 */
export function convertDenomAmountToNumber(
  denomAmount: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (denomAmount === null || denomAmount === undefined) {
    return defaultValue;
  }

  if (typeof denomAmount === "number") {
    return denomAmount;
  }

  const parsed = parseFloat(denomAmount);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format price from denomAmount or discountedPrice
 * Handles string, number, or null values
 *
 * @param product - Product from /api/v1/products
 * @returns Formatted price as number, or null if not available
 */
export function getProductPrice(product: PublicProduct): number | null {
  // Prefer denomAmount if it's a fixed price
  if (isFixedPriceProduct(product)) {
    const amount = product.denomAmount;
    return convertDenomAmountToNumber(amount);
  }

  // Fall back to discountedPrice if available
  if (product.discountedPrice && product.discountedPrice > 0) {
    return product.discountedPrice;
  }

  return null;
}

/**
 * Get a UI-friendly status message for why a product cannot be purchased via Reseller API
 *
 * @param product - Product from /api/v1/products
 * @returns Human-readable reason, or null if product is purchasable
 */
export function getProductPurchaseBlockReason(
  product: PublicProduct
): string | null {
  if (!product.isActive) {
    return "Product is inactive";
  }

  if (isVariableAirtimeProduct(product)) {
    return "Variable airtime not yet supported for Reseller API";
  }

  if (!isFixedPriceProduct(product)) {
    return "Variable/range products are not supported for Reseller API";
  }

  return null;
}

/**
 * Filter products to only those eligible for Reseller API purchase
 *
 * @param products - Array of products from /api/v1/products
 * @returns Filtered array of fixed-price products
 */
export function filterFixedPriceProducts(
  products: PublicProduct[]
): PublicProduct[] {
  return products.filter(isFixedPriceProduct);
}

/**
 * Sort products for display (by price ascending)
 *
 * @param products - Array of products
 * @returns Sorted array of products
 */
export function sortProductsByPrice(
  products: PublicProduct[]
): PublicProduct[] {
  return [...products].sort((a, b) => {
    const priceA = getProductPrice(a) ?? Infinity;
    const priceB = getProductPrice(b) ?? Infinity;
    return priceA - priceB;
  });
}

/**
 * Group products by operator for display
 *
 * @param products - Array of products
 * @returns Map of operator name to products
 */
export function groupProductsByOperator(
  products: PublicProduct[]
): Map<string, PublicProduct[]> {
  const grouped = new Map<string, PublicProduct[]>();

  for (const product of products) {
    const operatorName = product.operator?.name || "Unknown";
    if (!grouped.has(operatorName)) {
      grouped.set(operatorName, []);
    }
    grouped.get(operatorName)!.push(product);
  }

  return grouped;
}
