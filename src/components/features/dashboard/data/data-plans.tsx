"use client";

import { BiometricVerificationModal } from "@/components/auth/BiometricVerificationModal";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useUpdateProfile } from "@/hooks/useUser";
import { useEligibleOffers } from "@/hooks/useUserOffers";
import { detectNetworkProvider } from "@/lib/network-utils";
import { useSecurityStore } from "@/store/securityStore";
import { Product } from "@/types/product.types";
import { useQueryClient } from "@tanstack/react-query";
import { Grid, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckoutModal } from "../shared/checkout-modal";
import { NetworkDetector } from "../shared/network-detector";
import { NetworkSelector } from "../shared/network-selector";
import { ProductCard } from "../shared/product-card";
import { CategoryTabs } from "./category-tabs";

export function DataPlans() {
  const router = useRouter();
  const { user, refetch: refetchUser } = useAuth();
  const { recordPinAttempt, isBlocked } = useSecurityStore();
  const topupMutation = useTopup();
  const queryClient = useQueryClient();
  const { mutate: updateProfile, isPending: isUpdatingPin } =
    useUpdateProfile();

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
  const [selectedMarkupPercent, setSelectedMarkupPercent] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  // const [pinMode, setPinMode] = useState<"setup" | "enter">("enter")

  // Verification Modal State - Biometric First, then PIN Fallback
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    useCashback: boolean;
    amount?: number;
    verificationToken?: string;
    pin?: string;
  } | null>(null);

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

  const products = data?.products || [];

  // Get user's eligible offers (Two-Request Merge pattern)
  const isGuest = !user;
  const { eligibleIds } = useEligibleOffers(!isGuest);

  // Track selected offer ID for checkout
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Get markup map for all suppliers
  const markupMap = useSupplierMarkupMap();

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
      if (product.productType !== "data") return false;

      if (product.operator?.name !== selectedNetwork) return false;

      const validity = product.validityDays; // Don't default to 30, use actual value
      const name = product.name.toLowerCase();

      switch (selectedCategory) {
        case "Daily":
          return !!validity && validity <= 1;
        case "Weekly":
          return !!validity && validity > 1 && validity <= 7;
        case "Monthly":
          return !!validity && validity > 7 && validity <= 45; // Extended to 45 to cover slightly longer months
        case "XtraValue":
          return name.includes("xtra") || name.includes("extra");
        case "Roaming":
          return name.includes("roam") || name.includes("intl");
        case "Other":
          // Show if no validity, or very long validity, or doesn't fit mostly
          return !validity || validity > 45;
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

    // Get and set the markup percent for this product's supplier
    const supplierId = product.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    setSelectedMarkupPercent(markup);

    // Track offer ID if product has an active offer and user is eligible
    if (product.activeOffer) {
      const isEligible = eligibleIds.has(product.activeOffer.id);
      setSelectedOfferId(isEligible ? product.activeOffer.id : null);
    } else {
      setSelectedOfferId(null);
    }

    setIsCheckoutOpen(true);
  };

  // Handle Biometric Verification Success
  const handleBiometricSuccess = (verificationToken: string) => {
    console.log("[DataPlans] Biometric verification successful");
    // NOTE: We don't close the modal here anymore.
    // The modal stays open in a loading state until the mutation completes.

    // Update pending payment with verification token
    if (pendingPaymentData) {
      setPendingPaymentData({
        ...pendingPaymentData,
        verificationToken,
      });

      // Proceed directly to payment (no PIN needed)
      proceedWithPayment(pendingPaymentData.useCashback, verificationToken);
    }
  };

  // Handle Biometric Unavailable - Fall back to PIN
  const handleBiometricUnavailable = useCallback(() => {
    console.log("[DataPlans] Biometric unavailable, falling back to PIN");
    setShowBiometricModal(false);
    // Immediately show PIN modal - no delay to prevent background flash
    setShowPinModal(true);
  }, []);

  // Handle no PIN setup - Show PIN setup modal
  const handleNoPinSetup = useCallback(() => {
    console.log("[DataPlans] No PIN set up, showing PIN setup modal");
    setShowBiometricModal(false);
    // Immediately show PIN setup modal - no delay to prevent background flash
    setShowPinSetupModal(true);
  }, []);

  // Handle PIN setup success - Show PIN verification modal
  const handlePinSetupSuccess = useCallback(() => {
    console.log(
      "[DataPlans] PIN setup completed, now showing PIN verification modal"
    );
    setShowPinSetupModal(false);
    // Immediately show PIN modal - no delay to prevent background flash
    setShowPinModal(true);

    // Refetch user to get updated hasPin status
    refetchUser();
  }, [refetchUser]);

  // Handle PIN Entry Success
  const handlePinEntrySuccess = (pin: string) => {
    console.log(
      "[DataPlans] PIN verification successful, received PIN:",
      pin ? "****" : "null"
    );
    setErrorMessage(""); // Clear previous errors
    // NOTE: We don't close the modal here anymore.
    // The modal stays open in a loading state until the mutation completes.
    // setShowPinModal(false);

    // Proceed with payment with PIN
    if (pendingPaymentData) {
      console.log(
        "[DataPlans] Found pendingPaymentData, proceeding with payment"
      );
      proceedWithPayment(pendingPaymentData.useCashback, undefined, pin);
    } else {
      console.error(
        "[DataPlans] ERROR: No pendingPaymentData found in handlePinEntrySuccess"
      );
      setShowPinModal(false); // Close if no data
    }
  };

  // Handle Payment - Try Biometric First, PIN Fallback
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

    // Store pending payment data
    setPendingPaymentData({ useCashback, amount: payableAmount });

    // Hide checkout modal while verification is in progress
    setIsCheckoutOpen(false);

    // BIOMETRIC-FIRST FLOW
    // Try biometric verification first, fall back to PIN if needed
    console.log(
      "[DataPlans] Starting verification flow - attempting biometric first"
    );
    setShowBiometricModal(true);
  };

  // Execute the actual payment
  const proceedWithPayment = (
    useCashback: boolean,
    verificationToken?: string,
    pin?: string
  ) => {
    if (!selectedProduct) {
      console.error(
        "[DataPlans] ERROR: proceedWithPayment called but selectedProduct is null"
      );
      return;
    }

    const amount = parseFloat(selectedProduct.denomAmount || "0");
    const offer = selectedProduct.supplierOffers?.[0];

    console.log("[DataPlans] Proceeding with payment", {
      method: verificationToken ? "biometric" : "pin",
      hasToken: !!verificationToken,
      hasPin: !!pin,
      amount,
      productCode: selectedProduct.productCode,
      offerId: offer?.mappingId,
    });

    topupMutation.mutate(
      {
        amount, // Send face value - backend handles discount calculation
        productCode: selectedProduct.productCode,
        recipientPhone: phoneNumber,
        supplierSlug: offer?.supplierSlug,
        supplierMappingId: offer?.mappingId,
        useCashback,
        verificationToken, // Include verification token if biometric was used
        pin, // Include PIN if PIN verification was used
        offerId: selectedOfferId || undefined, // Include offer ID if eligible
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          // Successful transaction = Reset PIN attempts if PIN was used
          if (pin) recordPinAttempt(true);

          // Close BOTH modals and re-open checkout modal to show success state
          setShowPinModal(false);
          setShowBiometricModal(false);
          setIsCheckoutOpen(true);
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
        },
        onError: (error: any) => {
          console.error("[DataPlans] Transaction Failed", error);
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Transaction failed";

          // Check if it's a PIN error
          if (
            pin &&
            (msg.toLowerCase().includes("pin") ||
              msg.toLowerCase().includes("invalid"))
          ) {
            recordPinAttempt(false);
            setErrorMessage(msg);
            // Keep PIN modal open to show error
          } else {
            // Other error - close BOTH modals and let hook show toast
            setShowPinModal(false);
            setShowBiometricModal(false);
          }
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
          {filteredProducts.map((product) => {
            const supplierId = product.supplierOffers?.[0]?.supplierId || "";
            const markupPercent = markupMap.get(supplierId) || 0;

            return (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handlePlanClick(product)}
                markupPercent={markupPercent}
                isGuest={isGuest}
                isEligibleForOffer={
                  product.activeOffer
                    ? eligibleIds.has(product.activeOffer.id)
                    : false
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground py-10 text-center">
          No plans available for this selection.
        </div>
      )}

      {/* Checkout Modal - Show initially or after mutation completes, hide during processing */}
      {selectedProduct &&
        !showBiometricModal &&
        !showPinModal &&
        !showPinSetupModal &&
        !topupMutation.isPending && (
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

      {/* Biometric Verification Modal - Biometric First */}
      <BiometricVerificationModal
        open={showBiometricModal}
        onClose={() => {
          setShowBiometricModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={handleBiometricSuccess}
        onBiometricUnavailable={handleBiometricUnavailable}
        onNoPinSetup={handleNoPinSetup}
        transactionAmount={pendingPaymentData?.amount?.toString()}
        productCode={selectedProduct?.productCode}
        phoneNumber={phoneNumber}
        isVerifying={topupMutation.isPending}
      />

      {/* PIN Verification Modal - Fallback if Biometric Fails */}
      <PinVerificationModal
        open={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingPaymentData(null);
          setErrorMessage("");
        }}
        onSuccess={handlePinEntrySuccess}
        useCashback={pendingPaymentData?.useCashback || false}
        reason="transaction"
        transactionAmount={pendingPaymentData?.amount?.toString()}
        productCode={selectedProduct?.productCode}
        phoneNumber={phoneNumber}
        isVerifying={topupMutation.isPending}
        errorMessage={errorMessage}
        onForgotPin={() =>
          router.push(
            "/dashboard/profile/security/pin?returnUrl=/dashboard/data"
          )
        }
      />

      {/* PIN Setup Modal - If user hasn't set up PIN yet */}
      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => {
          setShowPinSetupModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={handlePinSetupSuccess}
      />
    </div>
  );
}
