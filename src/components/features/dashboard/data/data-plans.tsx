"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useTopup } from "@/hooks/useTopup";
import { detectNetworkProvider } from "@/lib/network-utils";
import { Product } from "@/types/product.types";
import { useQueryClient } from "@tanstack/react-query";
import { Grid, LayoutList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckoutModal } from "../shared/checkout-modal";
import { NetworkDetector } from "../shared/network-detector";
import { NetworkSelector } from "../shared/network-selector";
import { ProductCard } from "../shared/product-card";
import { CategoryTabs } from "./category-tabs";

export function DataPlans() {
  const { user } = useAuth();
  const topupMutation = useTopup();
  const queryClient = useQueryClient();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("HOT");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // New State for Input & Detection
  const [phoneNumber, setPhoneNumber] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [hasInitializedPhone, setHasInitializedPhone] = useState(false);

  // Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize phone number from user profile ONLY ONCE
  useEffect(() => {
    if (user?.phoneNumber && !hasInitializedPhone) {
      setPhoneNumber(user.phoneNumber);
      setHasInitializedPhone(true);

      // Auto-detect network for user's number
      const net = detectNetworkProvider(user.phoneNumber);
      if (net) {
        // We need to match "MTN" (from utils) to "MTN Nigeria" (from API)
        // Since operators might not be loaded yet, we just set detectedNetwork key
        // The effect below or handleNetworkDetected logic handles the mapping
        handleNetworkDetected(net);
      }
    }
  }, [user, hasInitializedPhone]);

  // Fetch all data products.
  const { data, isLoading, error } = useProducts(
    { productType: "data" },
    { staleTime: Infinity }
  );
  console.log("data plans data: ", data);

  const products = data?.products || [];

  // Extract unique operators from products
  const operators = useMemo(() => {
    const uniqueOps = new Map<string, { name: string; logoUrl: string }>();

    products.forEach((p) => {
      if (p.operator && p.operator.name) {
        if (!uniqueOps.has(p.operator.name)) {
          uniqueOps.set(p.operator.name, {
            name: p.operator.name,
            logoUrl: p.operator.logoUrl,
          });
        }
      }
    });

    return Array.from(uniqueOps.values()).sort((a, b) => {
      if (a.name.includes("MTN")) return -1;
      if (b.name.includes("MTN")) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  // Set default selected network once operators are loaded
  useEffect(() => {
    if (!selectedNetwork && operators.length > 0) {
      setSelectedNetwork(operators[0].name);
    }
  }, [operators, selectedNetwork]);

  // Handle Smart Network Detection
  const handleNetworkDetected = (networkKey: string) => {
    const matchedOperator = operators.find((op) =>
      op.name.toLowerCase().includes(networkKey.toLowerCase())
    );

    if (matchedOperator) {
      setDetectedNetwork(matchedOperator.name);
      setSelectedNetwork(matchedOperator.name);
    }
  };

  // Handle Manual Network Selection with Warning
  const handleManualNetworkSelect = (networkName: string) => {
    if (
      detectedNetwork &&
      detectedNetwork !== networkName &&
      phoneNumber.length >= 4
    ) {
      toast.warning(`This number appears to be ${detectedNetwork}.`, {
        description: `Are you sure you want to view ${networkName} plans?`,
        action: {
          label: "Yes, switch",
          onClick: () => setSelectedNetwork(networkName),
        },
      });
      setSelectedNetwork(networkName);
    } else {
      setSelectedNetwork(networkName);
    }
  };

  // Filter products based on selection
  const filteredProducts = useMemo(() => {
    if (!selectedNetwork) return [];

    return products.filter((product: Product) => {
      if (product.productType !== "data") return false;

      if (product.operator?.name !== selectedNetwork) return false;

      const validity = product.validityDays || 30;
      const name = product.name.toLowerCase();

      switch (selectedCategory) {
        case "Daily":
          return validity <= 2;
        case "Weekly":
          return validity > 2 && validity <= 7;
        case "Monthly":
          return validity > 7 && validity <= 30;
        case "XtraValue":
          return name.includes("xtra") || name.includes("extra");
        case "Roaming":
          return name.includes("roam") || name.includes("intl");
        case "HOT":
        default:
          return true;
      }
    });
  }, [products, selectedNetwork, selectedCategory]);

  // Handle Plan Click
  const handlePlanClick = (product: Product) => {
    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error("Please enter a valid phone number first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSelectedProduct(product);
    setIsSuccess(false); // Reset success state
    setIsCheckoutOpen(true);
  };

  // Handle Payment
  const handlePayment = (useCashback: boolean) => {
    if (!selectedProduct) return;

    // Prepare payload
    const amount = parseFloat(selectedProduct.denomAmount || "0");
    const offer = selectedProduct.supplierOffers?.[0];

    topupMutation.mutate(
      {
        amount,
        productCode: selectedProduct.productCode,
        recipientPhone: phoneNumber,
        supplierSlug: offer?.supplierSlug,
        supplierMappingId: offer?.mappingId,
        useCashback, // Add the useCashback parameter
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          // Refetch essential data
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
        },
      }
    );
  };

  // Get logo for current selected network
  const currentLogo = operators.find(
    (op) => op.name === selectedNetwork
  )?.logoUrl;

  if (error) {
    return (
      <div className="py-10 text-center text-red-500">
        Failed to load data plans. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Input & Detection Section */}
      <NetworkDetector
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        onNetworkDetected={handleNetworkDetected}
        selectedNetworkLogo={currentLogo}
        recentNumbers={user?.recentlyUsedNumbers || []}
      />

      {/* Header & View Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Data Plans</h1>
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-md"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-md"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="size-4" />
          </Button>
        </div>
      </div>

      {/* Network Selector */}
      {isLoading && operators.length === 0 ? (
        <div className="flex gap-4 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onSelect={handleManualNetworkSelect}
          operators={operators}
        />
      )}

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              : "flex flex-col gap-3"
          }
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handlePlanClick(product)}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground py-10 text-center">
          No plans available for this selection.
        </div>
      )}

      {/* Checkout Modal */}
      {selectedProduct && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={selectedProduct}
          phoneNumber={phoneNumber}
          networkLogo={currentLogo}
          networkName={selectedNetwork}
          userBalance={parseFloat(user?.balance || "0")}
          userCashbackBalance={user?.cashback?.availableBalance || 0}
          onConfirm={handlePayment}
          isProcessing={topupMutation.isPending}
          isSuccess={isSuccess}
        />
      )}
    </div>
  );
}
