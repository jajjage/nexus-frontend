import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/product.types";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
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
      {/* Badges Container */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
        {/* Discount Badge */}
        {hasDiscount && (
          <Badge
            variant="secondary"
            className="h-5 bg-green-100 px-1.5 text-[10px] font-bold text-green-600 dark:bg-green-900/20"
          >
            -{discountPercentage}% Off
          </Badge>
        )}
        {/* Cashback Badge (Earn) */}
        {/* {product.has_cashback && (
          <Badge
            variant="secondary"
            className="h-5 bg-blue-100 px-1.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20"
          >
            +{product.cashback_percentage}% Back
          </Badge>
        )} */}
      </div>

      {/* Main Display (Volume or Airtime Amount) */}
      <div className="mt-6 mb-1">
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

      {/* Cashback Badge (Earn) - Moved to bottom-left */}
      {product.has_cashback && (
        <div className="absolute bottom-2 left-2 mt-2 mb-2">
          <Badge
            variant="secondary"
            className="h-5 bg-blue-100 px-1.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20"
          >
            +{product.cashback_percentage}% Back
          </Badge>
        </div>
      )}
    </Card>
  );
}
