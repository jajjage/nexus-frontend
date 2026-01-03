import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/product.types";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  markupPercent?: number;
  // Offer eligibility props (Two-Request Merge pattern)
  isEligibleForOffer?: boolean;
  isGuest?: boolean;
}

export function ProductCard({
  product,
  onClick,
  markupPercent = 0,
  isEligibleForOffer = false,
  isGuest = false,
}: ProductCardProps) {
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
  const supplierOffer = product.supplierOffers?.[0];
  const supplierPrice = supplierOffer
    ? parseFloat(supplierOffer.supplierPrice)
    : faceValue;

  // Calculate base selling price (with markup)
  const actualMarkup = markupPercent < 1 ? markupPercent : markupPercent / 100;
  const baseSellingPrice = supplierPrice + supplierPrice * actualMarkup;

  // 3. Offer Logic (Two-Request Merge pattern)
  const hasOffer = !!product.activeOffer;
  const showDiscountedPrice = hasOffer && (isGuest || isEligibleForOffer);

  // Use pre-calculated discountedPrice from API if available, otherwise use base price
  const displayPrice =
    showDiscountedPrice && product.discountedPrice
      ? product.discountedPrice
      : baseSellingPrice;

  // Show strikethrough price when display price is less than face value
  // This covers BOTH supplier pricing discounts AND offer discounts
  const originalPrice = displayPrice < faceValue ? faceValue : null;

  // Calculate discount percentage for badge
  let discountPercentage = 0;
  if (
    showDiscountedPrice &&
    product.discountedPrice &&
    product.discountedPrice < faceValue
  ) {
    discountPercentage = Math.round(
      ((faceValue - product.discountedPrice) / faceValue) * 100
    );
  } else if (baseSellingPrice < faceValue) {
    discountPercentage = Math.round(
      ((faceValue - baseSellingPrice) / faceValue) * 100
    );
  }

  // 4. Determine Offer Badge
  const getOfferBadge = () => {
    if (!hasOffer) return null;

    if (isGuest) {
      return {
        text: "Login to Claim",
        className: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
      };
    }

    if (isEligibleForOffer) {
      return {
        text: product.activeOffer?.title || "Special Deal",
        className: "bg-green-100 text-green-600 dark:bg-green-900/20",
      };
    }

    // Ineligible user - show grayed badge
    return {
      text: product.activeOffer?.title || "Limited Offer",
      className: "bg-gray-100 text-gray-500 dark:bg-gray-800/50",
    };
  };

  const offerBadge = getOfferBadge();

  // 5. Format Validity
  const duration = product.validityDays
    ? `${product.validityDays} ${product.validityDays === 1 ? "Day" : "Days"}`
    : "30 Days";

  return (
    <Card
      className="border-muted-foreground/20 hover:border-primary/50 relative flex cursor-pointer flex-col items-center justify-between overflow-hidden p-3 text-center shadow-sm transition-all hover:shadow-md"
      onClick={onClick}
    >
      {/* Badges Container */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
        {/* Offer Badge */}
        {offerBadge && (
          <Badge
            variant="secondary"
            className={`h-5 px-1.5 text-[10px] font-bold ${offerBadge.className}`}
          >
            {offerBadge.text}
          </Badge>
        )}
        {/* Discount Percentage Badge - Show for any discount */}
        {discountPercentage > 0 && (
          <Badge
            variant="secondary"
            className="h-5 bg-green-100 px-1.5 text-[10px] font-bold text-green-600 dark:bg-green-900/20"
          >
            -{discountPercentage}% Off
          </Badge>
        )}
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
          ₦{displayPrice.toLocaleString()}
        </span>
        {originalPrice && (
          <span className="text-muted-foreground text-xs line-through">
            ₦{originalPrice.toLocaleString()}
          </span>
        )}
      </div>

      {/* Cashback Badge (Earn) - Position at bottom */}
      {product.has_cashback && (
        <div className="mt-auto pt-2">
          <Badge
            variant="secondary"
            className="h-4 bg-blue-100 px-1 text-[9px] font-bold text-blue-600 dark:bg-blue-900/20"
          >
            +{product.cashback_percentage}% Back
          </Badge>
        </div>
      )}
    </Card>
  );
}
