import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/product.types";
import { Info } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  // Mock data for visual completeness (fields missing from API)
  const cashback = "₦50 Cashback";
  // Use deterministic logic for mock data to prevent UI flickering during re-renders
  const hasBonus = product.id.charCodeAt(0) % 5 === 0; // Stable mock based on ID
  const bonusText = "Voice Bonus";

  // 1. Format Main Display (Volume or Amount)
  const formatMainDisplay = (p: Product) => {
    if (p.productType === "airtime") {
      return `₦${parseFloat(p.denomAmount).toLocaleString()}`;
    }

    // For Data
    const mb = p.dataMb;
    if (mb) {
      return mb >= 1000 ? `${mb / 1000} GB` : `${mb} MB`;
    }
    // Fallback regex for data
    const match = p.name.match(/(\d+(\.\d+)?)\s?(GB|MB|TB)/i);
    return match ? match[0].toUpperCase() : p.name;
  };

  const mainDisplayText = formatMainDisplay(product);

  // 2. Determine Price
  const faceValue = parseFloat(product.denomAmount || "0");
  const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
    ? parseFloat(product.supplierOffers[0].supplierPrice)
    : null;

  let sellingPrice = faceValue;
  let originalPrice = faceValue;
  let discountPercentage = 0;
  let hasDiscount = false;

  if (supplierPrice !== null && supplierPrice < faceValue) {
    const margin = faceValue - supplierPrice;
    // User saves half of the margin
    const userSavings = margin / 2;
    sellingPrice = faceValue - userSavings;
    originalPrice = faceValue;
    discountPercentage = Math.round((userSavings / faceValue) * 100);
    hasDiscount = true;
  }

  // 3. Format Validity
  const duration = product.validityDays
    ? `${product.validityDays} ${product.validityDays === 1 ? "Day" : "Days"}`
    : "30 Days"; // Default fallback

  return (
    <Card
      className="border-muted-foreground/20 hover:border-primary/50 relative flex cursor-pointer flex-col items-center justify-between overflow-hidden p-3 text-center shadow-sm transition-all hover:shadow-md"
      onClick={onClick}
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-bold text-green-600"
          >
            -{discountPercentage}%
          </Badge>
        </div>
      )}

      {/* Main Display (Volume or Airtime Amount) */}
      <div className="mt-2 mb-1">
        <h3 className="text-foreground text-2xl font-bold">
          {mainDisplayText}
        </h3>
      </div>

      {/* Duration - Only show for data products */}
      {product.productType === "data" ? (
        <div className="mb-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {duration}
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Top-up
          </p>
        </div>
      )}

      {/* Pricing */}
      <div className="mb-3 flex flex-col items-center gap-0.5">
        <span className="text-foreground text-lg font-bold">
          ₦{sellingPrice.toLocaleString()}
        </span>
        {hasDiscount && (
          <span className="text-muted-foreground text-xs line-through">
            ₦{originalPrice.toLocaleString()}
          </span>
        )}
      </div>

      {/* Cashback */}
      <div className="mb-2 rounded-full bg-green-50 px-2 py-0.5 dark:bg-green-900/20">
        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
          {cashback}
        </span>
      </div>

      {/* Optional Bonus Footer */}
      {hasBonus && (
        <div className="mt-2 flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <span>{bonusText}</span>
          <Info className="size-3" />
        </div>
      )}
    </Card>
  );
}
