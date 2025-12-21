import type { SupplierOffer } from "@/types/product.types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the final price with markup
 * Formula: supplierPrice + (supplierPrice * markupPercent / 100)
 *
 * @param supplierPrice - The base supplier price
 * @param markupPercent - The markup percentage to apply
 * @returns The final price with markup applied
 */
export function calculatePriceWithMarkup(
  supplierPrice: number,
  markupPercent: number
): number {
  return supplierPrice + (supplierPrice * markupPercent) / 100;
}

/**
 * Get the marked up price for a supplier offer
 *
 * @param supplierOffer - The supplier offer
 * @param markupPercent - The markup percentage for this supplier
 * @returns The final price with markup
 */
export function getSupplierOfferPrice(
  supplierOffer: SupplierOffer,
  markupPercent?: number
): number {
  const basePrice = parseFloat(supplierOffer.supplierPrice);

  if (!markupPercent || markupPercent === 0) {
    return basePrice;
  }

  return calculatePriceWithMarkup(basePrice, markupPercent);
}
