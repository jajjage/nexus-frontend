"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useUpdateProfile } from "@/hooks/useUser";
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
import { TransactionPinModal } from "../shared/transaction-pin-modal";

export function AirtimePlans() {
  const { user, refetch: refetchUser } = useAuth();
  const topupMutation = useTopup();
  const queryClient = useQueryClient();
  const { mutate: updateProfile, isPending: isUpdatingPin } =
    useUpdateProfile();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // New State for Input & Detection
  const [phoneNumber, setPhoneNumber] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [hasInitializedPhone, setHasInitializedPhone] = useState(false);

  // Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMarkupPercent, setSelectedMarkupPercent] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"setup" | "enter">("enter");
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    useCashback: boolean;
    amount?: number;
  } | null>(null);
  const [transactionPin, setTransactionPin] = useState<string | null>(null);

  // Initialize phone number from user profile ONLY ONCE
  useEffect(() => {
    if (user?.phoneNumber && !hasInitializedPhone) {
      setPhoneNumber(user.phoneNumber);
      setHasInitializedPhone(true);

      // Auto-detect network for user's number
      const net = detectNetworkProvider(user.phoneNumber);
      if (net) {
        handleNetworkDetected(net);
      }
    }
  }, [user, hasInitializedPhone]);

  // Fetch all airtime products.
  const { data, isLoading, error } = useProducts(
    { productType: "airtime" },
    { staleTime: Infinity }
  );

  const products = data?.products || [];

  // Get markup map for all suppliers
  const markupMap = useSupplierMarkupMap();
  useEffect(() => {
    console.log("Debug markupMap:", {
      mapSize: markupMap.size,
      mapEntries: Array.from(markupMap.entries()),
      fullMap: markupMap,
    });
  }, [markupMap]);

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

  // Auto-detect and navigate to operator when phone number changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 4 && operators.length > 0) {
      const detectedOp = detectNetworkProvider(phoneNumber);
      if (detectedOp) {
        handleNetworkDetected(detectedOp);
      }
    }
  }, [phoneNumber, operators]);

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
      if (product.productType !== "airtime") return false;
      if (product.operator?.name !== selectedNetwork) return false;
      return true;
    });
  }, [products, selectedNetwork]);

  // Handle Plan Click
  const handlePlanClick = (product: Product) => {
    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error("Please enter a valid phone number first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSelectedProduct(product);
    setIsSuccess(false);

    // Get and set the markup percent for this product's supplier
    const supplierId = product.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    setSelectedMarkupPercent(markup);

    setIsCheckoutOpen(true);
  };

  // Handle PIN Setup Success
  const handlePinSetupSuccess = (pin: string) => {
    updateProfile(
      { pin },
      {
        onSuccess: () => {
          toast.success("PIN set successfully!");
          setTransactionPin(pin);
          setShowPinModal(false);
          setShowPinModal(true); // Re-open in "enter" mode
          setPinMode("enter");
          refetchUser();
        },
        onError: (error: any) => {
          const errorMsg = error.response?.data?.message || "Failed to set PIN";
          toast.error(errorMsg);
        },
      }
    );
  };

  // Handle PIN Entry Success
  const handlePinEntrySuccess = (pin: string) => {
    setTransactionPin(pin);
    setShowPinModal(false);

    // Proceed with payment
    if (pendingPaymentData) {
      proceedWithPayment(pendingPaymentData.useCashback, pin);
    }
  };

  // Handle Payment - Check for PIN first
  const handlePayment = (useCashback: boolean) => {
    if (!selectedProduct) return;

    // Calculate the amount to display
    const faceValue = parseFloat(selectedProduct.denomAmount || "0");
    const supplierPrice = selectedProduct.supplierOffers?.[0]?.supplierPrice
      ? parseFloat(selectedProduct.supplierOffers[0].supplierPrice)
      : faceValue;

    // Get supplier markup
    const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
    const markupPercent = markupMap.get(supplierId) || 0;
    console.log("DEBUG - Payment Calculation:", {
      supplierId,
      markupPercent,
      mapSize: markupMap.size,
      mapEntries: Array.from(markupMap.entries()),
      faceValue,
      supplierPrice,
    });

    // Calculate selling price: supplierPrice + (supplierPrice * markup%)
    // markupPercent can be either decimal (0.10) or percentage (10)
    const actualMarkup =
      markupPercent < 1 ? markupPercent : markupPercent / 100;
    const sellingPrice = supplierPrice + supplierPrice * actualMarkup;

    // Calculate payable amount
    const userCashbackBalance = user?.cashback?.availableBalance || 0;
    const payableAmount = useCashback
      ? Math.max(0, sellingPrice - userCashbackBalance)
      : sellingPrice;

    // Check if user has PIN
    if (!user?.hasPin) {
      // No PIN - show setup modal
      setPinMode("setup");
      setPendingPaymentData({ useCashback, amount: payableAmount });
      setShowPinModal(true);
    } else {
      // Has PIN - show entry modal
      setPinMode("enter");
      setPendingPaymentData({ useCashback, amount: payableAmount });
      setShowPinModal(true);
    }
  };

  // Execute the actual payment
  const proceedWithPayment = (useCashback: boolean, pin: string) => {
    if (!selectedProduct) return;
    console.log("useCashback: ", useCashback);

    const amount = parseFloat(selectedProduct.denomAmount || "0");
    const offer = selectedProduct.supplierOffers?.[0];

    topupMutation.mutate(
      {
        amount, // Send face value - backend handles discount calculation
        productCode: selectedProduct.productCode,
        recipientPhone: phoneNumber,
        supplierSlug: offer?.supplierSlug,
        supplierMappingId: offer?.mappingId,
        useCashback,
        pin: parseInt(pin, 10), // Include PIN in the request, converted to number
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
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
        Failed to load airtime plans. Please try again.
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
        <h1 className="text-xl font-bold">Airtime Top-up</h1>
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

      {/* Airtime Grid */}
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
          {filteredProducts.map((product) => {
            const supplierId = product.supplierOffers?.[0]?.supplierId || "";
            const markupPercent = markupMap.get(supplierId) || 0;

            return (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handlePlanClick(product)}
                markupPercent={markupPercent}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground py-10 text-center">
          No airtime denominations available for this selection.
        </div>
      )}

      {/* Checkout Modal - Show initially or after mutation completes, hide during processing */}
      {selectedProduct && !showPinModal && !topupMutation.isPending && (
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
          markupPercent={selectedMarkupPercent}
        />
      )}

      {/* Transaction PIN Modal */}
      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={
          pinMode === "setup" ? handlePinSetupSuccess : handlePinEntrySuccess
        }
        isLoading={isUpdatingPin || topupMutation.isPending}
        mode={pinMode}
        amount={pendingPaymentData?.amount}
      />
    </div>
  );
}
