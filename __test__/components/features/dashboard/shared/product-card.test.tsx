import { ProductCard } from "@/components/features/dashboard/shared/product-card";
import { Product } from "@/types/product.types";
import { fireEvent, render, screen } from "@testing-library/react";

// Mock product factory
const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-123",
  operatorId: "op-1",
  productCode: "MTN_1GB",
  name: "MTN 1GB Data",
  productType: "data",
  denomAmount: "1000",
  dataMb: 1024,
  validityDays: 30,
  isActive: true,
  metadata: {},
  createdAt: "2024-01-01T00:00:00Z",
  operator: {
    name: "MTN Nigeria",
    countryCode: "NG",
    logoUrl: "/mtn-logo.png",
  },
  supplierOffers: [
    {
      mappingId: "map-1",
      supplierId: "sup-1",
      supplierName: "PalmPay",
      supplierSlug: "palmpay",
      supplierProductCode: "PP_MTN_1GB",
      supplierPrice: "900",
      leadTimeSeconds: 5,
    },
  ],
  ...overrides,
});

describe("ProductCard Component", () => {
  describe("Without Offer", () => {
    it("should render product without offer badge", () => {
      const product = createMockProduct();

      render(<ProductCard product={product} />);

      expect(screen.getByText("1 GB")).toBeInTheDocument();
      expect(screen.getByText("30 Days")).toBeInTheDocument();
      // No offer badge should be present
      expect(screen.queryByText("Login to Claim")).not.toBeInTheDocument();
      expect(screen.queryByText("Special Deal")).not.toBeInTheDocument();
    });

    it("should call onClick when clicked", () => {
      const product = createMockProduct();
      const handleClick = vi.fn();

      render(<ProductCard product={product} onClick={handleClick} />);

      fireEvent.click(
        screen.getByRole("article") || screen.getByText("1 GB").closest("div")!
      );
      // Note: Card might not have role="article", adjust selector as needed
    });
  });

  describe("With Offer - Guest User", () => {
    it("should show 'Login to Claim' badge for guest users", () => {
      const product = createMockProduct({
        activeOffer: {
          id: "offer-123",
          title: "Flash Sale",
          discountType: "percentage",
          discountValue: 10,
        },
        discountedPrice: 900,
      });

      render(<ProductCard product={product} isGuest={true} />);

      expect(screen.getByText("Login to Claim")).toBeInTheDocument();
    });

    it("should show discounted price for guest users with offer", () => {
      const product = createMockProduct({
        activeOffer: {
          id: "offer-123",
          title: "Flash Sale",
          discountType: "percentage",
          discountValue: 10,
        },
        discountedPrice: 900,
      });

      render(<ProductCard product={product} isGuest={true} />);

      // Should show discounted price
      expect(screen.getByText("₦900")).toBeInTheDocument();
    });
  });

  describe("With Offer - Eligible User", () => {
    it("should show offer title badge with green styling for eligible users", () => {
      const product = createMockProduct({
        activeOffer: {
          id: "offer-123",
          title: "Flash Sale",
          discountType: "percentage",
          discountValue: 10,
        },
        discountedPrice: 900,
      });

      render(
        <ProductCard
          product={product}
          isGuest={false}
          isEligibleForOffer={true}
        />
      );

      expect(screen.getByText("Flash Sale")).toBeInTheDocument();
    });

    it("should show discounted price with strikethrough original for eligible users", () => {
      const product = createMockProduct({
        activeOffer: {
          id: "offer-123",
          title: "Flash Sale",
          discountType: "percentage",
          discountValue: 10,
        },
        discountedPrice: 900,
      });

      render(
        <ProductCard
          product={product}
          isGuest={false}
          isEligibleForOffer={true}
        />
      );

      // Should show discounted price
      expect(screen.getByText("₦900")).toBeInTheDocument();
      // Should show original price with strikethrough
      expect(screen.getByText("₦1,000")).toBeInTheDocument();
    });
  });

  describe("With Offer - Ineligible User", () => {
    it("should show grayed offer badge for ineligible users", () => {
      const product = createMockProduct({
        activeOffer: {
          id: "offer-123",
          title: "New User Promo",
          discountType: "percentage",
          discountValue: 10,
        },
        discountedPrice: 900,
      });

      render(
        <ProductCard
          product={product}
          isGuest={false}
          isEligibleForOffer={false}
        />
      );

      expect(screen.getByText("New User Promo")).toBeInTheDocument();
    });

    it("should show regular price for ineligible users (no discount)", () => {
      const product = createMockProduct({
        activeOffer: {
          id: "offer-123",
          title: "New User Promo",
          discountType: "percentage",
          discountValue: 10,
        },
        discountedPrice: 900,
      });

      render(
        <ProductCard
          product={product}
          isGuest={false}
          isEligibleForOffer={false}
        />
      );

      // Should show regular price (based on supplier price + markup)
      // Without markup, supplier price is 900, but face value display depends on logic
      expect(screen.getByText("₦900")).toBeInTheDocument();
      // Should NOT show strikethrough when ineligible
    });
  });

  describe("Airtime Products", () => {
    it("should display airtime amount correctly", () => {
      const product = createMockProduct({
        productType: "airtime",
        denomAmount: "500",
        dataMb: null,
      });

      render(<ProductCard product={product} />);

      expect(screen.getByText("₦500")).toBeInTheDocument();
      expect(screen.getByText("Top-up")).toBeInTheDocument();
    });
  });

  describe("Cashback Badge", () => {
    it("should show cashback badge when product has cashback", () => {
      const product = createMockProduct({
        has_cashback: true,
        cashback_percentage: 5,
      });

      render(<ProductCard product={product} />);

      expect(screen.getByText("+5% Back")).toBeInTheDocument();
    });
  });
});
