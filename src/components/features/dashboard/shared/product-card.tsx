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

    // For Data - use 1024 MB = 1 GB (binary, standard for data plans)
    const mb = p.dataMb;
    if (mb) {
      if (mb >= 1024) {
        const gb = mb / 1024;
        // Round to whole number if close (within 0.1), otherwise show 1 decimal
        const roundedGb =
          Math.abs(gb - Math.round(gb)) < 0.1
            ? Math.round(gb)
            : parseFloat(gb.toFixed(1));
        return `${roundedGb} GB`;
      }
      return `${mb} MB`;
    }
    // Fallback regex for data
    const match = p.name.match(/(\d+(\.\d+)?)\s?(GB|MB|TB)/i);
    return match ? match[0].toUpperCase() : p.name;
  };

  const mainDisplayText = formatMainDisplay(product);

  // 2. Determine Price
  const faceValue = parseFloat(product.denomAmount || "0");
  const supplierOffer = product.supplierOffers?.[0];

  // Parse supplier price, fallback to faceValue if missing or 0
  const rawSupplierPrice = supplierOffer?.supplierPrice
    ? parseFloat(supplierOffer.supplierPrice)
    : 0;
  // Use faceValue if supplier price is missing or 0 (no supplier discount without valid price)
  const supplierPrice = rawSupplierPrice > 0 ? rawSupplierPrice : faceValue;
  const hasValidSupplierDiscount =
    rawSupplierPrice > 0 && rawSupplierPrice < faceValue;

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
  // Only show if we have a valid discount (from offer OR valid supplier price)
  const originalPrice =
    displayPrice < faceValue && displayPrice > 0 ? faceValue : null;

  // Calculate discount percentage for badge
  let discountPercentage = 0;

  if (hasOffer && (isGuest || isEligibleForOffer)) {
    const offer = product.activeOffer;

    // For percentage-type offers, use the discount value directly
    if (offer?.discountType === "percentage") {
      discountPercentage = offer.discountValue;
    }
    // For fixed_amount offers, calculate percentage from price difference
    else if (
      offer?.discountType === "fixed_amount" &&
      product.discountedPrice
    ) {
      discountPercentage = Math.round(
        ((faceValue - product.discountedPrice) / faceValue) * 100
      );
    }
    // For fixed_price offers, calculate percentage from final price
    else if (offer?.discountType === "fixed_price" && offer.discountValue) {
      discountPercentage = Math.round(
        ((faceValue - offer.discountValue) / faceValue) * 100
      );
    }
  }
  // Only show supplier discount badge if there's a valid supplier price less than face value
  else if (
    !hasOffer &&
    hasValidSupplierDiscount &&
    baseSellingPrice < faceValue
  ) {
    discountPercentage = Math.round(
      ((faceValue - baseSellingPrice) / faceValue) * 100
    );
  }

  // 4. Determine Offer Badge
  const getOfferBadge = () => {
    if (!hasOffer) return null;

    if (isGuest) {
      return {
        text: "🔓 Login to Claim",
        className:
          "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md",
      };
    }

    if (isEligibleForOffer) {
      return {
        text: `🎉 ${product.activeOffer?.title || "Special Deal"}`,
        className:
          "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md animate-pulse",
      };
    }

    // Ineligible user - show subtle badge
    return {
      text: product.activeOffer?.title || "Limited Offer",
      className:
        "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
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
      {/* Badges Container - Top left to avoid overlap with centered content */}
      <div className="absolute top-1.5 left-1.5 flex max-w-[50%] flex-col items-start gap-0.5">
        {/* Offer Badge */}
        {offerBadge && (
          <Badge
            variant="secondary"
            className={`h-4 truncate px-1.5 text-[9px] font-semibold ${offerBadge.className}`}
          >
            {offerBadge.text}
          </Badge>
        )}
        {/* Discount Percentage Badge - Show for any discount */}
        {discountPercentage > 0 && (
          <Badge
            variant="secondary"
            className="h-4 bg-gradient-to-r from-orange-400 to-red-500 px-1.5 text-[9px] font-bold text-white shadow-sm"
          >
            -{discountPercentage}% OFF
          </Badge>
        )}
      </div>

      {/* Main Display (Volume or Airtime Amount) */}
      <div className="mt-8 mb-1">
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
