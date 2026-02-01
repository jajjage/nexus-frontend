"use client";

import { BiometricVerificationModal } from "@/components/auth/BiometricVerificationModal";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useTopup } from "@/hooks/useTopup";
import { useTransaction } from "@/hooks/useWallet";
import { useSecurityStore } from "@/store/securityStore";
import { Product } from "@/types/product.types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PinSetupModal } from "../../security/pin-setup-modal";
import { CheckoutModal } from "../shared/checkout-modal";
import { NetworkDetector } from "../shared/network-detector";
import { ShareTransactionDialog } from "../transactions/share-transaction-dialog";
import { AirtimeInputForm } from "./airtime-input-form";

// Network Logos Map
const NETWORK_LOGOS: Record<string, string> = {
  MTN: "/images/MTN.jpg",
  Glo: "/images/glo.jpg",
  Airtel: "/images/Airtel.png",
  "9mobile": "/images/9Mobile.png",
};

// Define the generic product for dynamic airtime (fallback)
const GENERAL_AIRTIME_PRODUCT: Product = {
  id: "general-airtime",
  productCode: "GENERAL_AIRTIME",
  name: "Airtime Top-up",
  productType: "airtime",
  operatorId: "general",
  operator: {
    name: "General",
    countryCode: "NG",
    logoUrl: "", // Will be dynamically set based on detection
  },
  denomAmount: "0",
  minAmount: 50,
  maxAmount: 50000,
  has_cashback: true,
  cashback_percentage: 0, // Default to 0, let real product override
  isActive: true,
  metadata: {},
  createdAt: new Date().toISOString(),
  supplierOffers: [],
  dataMb: null,
  validityDays: null,
};

export function AirtimePlans() {
  const router = useRouter();
  const { user, refetch: refetchUser } = useAuth();
  const { recordPinAttempt } = useSecurityStore();
  const topupMutation = useTopup();
  const queryClient = useQueryClient();

  // State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [isPhoneNumberExplicitlyEntered, setIsPhoneNumberExplicitlyEntered] =
    useState(false);

  // Fetch actual airtime products to get cashback metadata
  const { data: productsData } = useProducts({
    productType: "airtime",
    isActive: true,
  });

  const products = useMemo(
    () => productsData?.products || [],
    [productsData?.products]
  );

  // Derive current product based on detected network
  const currentProduct = useMemo(() => {
    if (!detectedNetwork || products.length === 0) return null;
    const matched = products.find((p) =>
      p.operator.name.toLowerCase().includes(detectedNetwork.toLowerCase())
    );
    return matched || null;
  }, [detectedNetwork, products]);

  // Debugging logs
  useEffect(() => {
    console.log("[AirtimePlans] Debug Info:", {
      detectedNetwork,
      productsCount: products.length,
      productOperators: products.map((p) => p.operator?.name),
      matchedProduct: currentProduct
        ? {
            name: currentProduct.name,
            has_cashback: currentProduct.has_cashback,
            cashback_percent: currentProduct.cashback_percentage,
          }
        : "None",
    });
  }, [detectedNetwork, products, currentProduct]);

  // Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Verification Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    useCashback: boolean;
    amount?: number;
    verificationToken?: string;
    pin?: string;
  } | null>(null);

  // Share dialog state
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(
    null
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Update current product based on detected network
  const handleNetworkDetected = useCallback((networkKey: string) => {
    setDetectedNetwork(networkKey);
  }, []);

  const currentLogo = detectedNetwork
    ? NETWORK_LOGOS[detectedNetwork]
    : undefined;

  const handleCheckout = (amount: number) => {
    if (!isPhoneNumberExplicitlyEntered) {
      toast.error("Please enter a phone number first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error("Please enter a valid phone number.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Create a specific product instance for this transaction
    // Use metadata from the REAL product if found, otherwise generic
    const baseProduct = currentProduct || GENERAL_AIRTIME_PRODUCT;

    const transactionProduct = {
      ...baseProduct,
      // IMPORTANT: We still send GENERAL_AIRTIME as the code to the backend
      // But we display the correct name/logo/cashback to the user
      productCode: "GENERAL_AIRTIME",
      denomAmount: amount.toString(),
      name: detectedNetwork ? `${detectedNetwork} Airtime` : "Airtime Top-up",
      // Explicitly disable offers for airtime flow as per requirement
      activeOffer: undefined,
      // Clear supplier offers to force CheckoutModal to use denomAmount (user input) as price
      // otherwise it might use the "0" supplierPrice from the generic product
      supplierOffers: [],
    };

    setSelectedProduct(transactionProduct);
    setIsSuccess(false);
    setIsFailed(false);
    setFailureMessage("");
    setIsCheckoutOpen(true);
  };

  // Handle Payment Initiation
  const handlePayment = (useCashback: boolean) => {
    if (!selectedProduct) return;

    const amount = parseFloat(selectedProduct.denomAmount);
    const payableAmount = useCashback
      ? Math.max(0, amount - (user?.cashback?.availableBalance || 0))
      : amount;

    setPendingPaymentData({ useCashback, amount: payableAmount });
    setIsCheckoutOpen(false);
    setShowBiometricModal(true);
  };

  // Handle Biometric Success
  const handleBiometricSuccess = (verificationToken: string) => {
    if (pendingPaymentData) {
      setPendingPaymentData({ ...pendingPaymentData, verificationToken });
      proceedWithPayment(pendingPaymentData.useCashback, verificationToken);
    }
  };

  // Handle PIN Success
  const handlePinEntrySuccess = (pin: string) => {
    setErrorMessage("");
    if (pendingPaymentData) {
      proceedWithPayment(pendingPaymentData.useCashback, undefined, pin);
    } else {
      setShowPinModal(false);
    }
  };

  // Execute Payment
  const proceedWithPayment = (
    useCashback: boolean,
    verificationToken?: string,
    pin?: string
  ) => {
    if (!selectedProduct) return;

    const amount = parseFloat(selectedProduct.denomAmount);

    topupMutation.mutate(
      {
        productCode: "GENERAL_AIRTIME",
        amount,
        recipientPhone: phoneNumber,
        useCashback,
        verificationToken,
        pin,
      },
      {
        onSuccess: (response) => {
          setIsSuccess(true);
          if (response.data?.transactionId) {
            setLastTransactionId(response.data.transactionId);
          }
          if (pin) recordPinAttempt(true);
          setShowPinModal(false);
          setShowBiometricModal(false);
          setIsCheckoutOpen(true);
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Transaction failed.";

          if (
            pin &&
            (msg.toLowerCase().includes("pin") ||
              msg.toLowerCase().includes("invalid"))
          ) {
            recordPinAttempt(false);
            setErrorMessage(msg);
          } else {
            setShowPinModal(false);
            setShowBiometricModal(false);
            setIsFailed(true);
            setFailureMessage(msg);
            setIsCheckoutOpen(true);
          }
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Airtime Top-up</h2>
        <p className="text-muted-foreground">
          Instant airtime for all networks. Auto-detected.
        </p>
      </div>

      <div className="grid gap-6">
        <NetworkDetector
          phoneNumber={phoneNumber}
          onPhoneNumberChange={setPhoneNumber}
          onNetworkDetected={handleNetworkDetected}
          onExplicitEntry={setIsPhoneNumberExplicitlyEntered}
          selectedNetworkLogo={currentLogo}
          recentNumbers={user?.recentlyUsedNumbers || []}
        />

        <AirtimeInputForm
          product={currentProduct || GENERAL_AIRTIME_PRODUCT}
          phoneNumber={phoneNumber}
          onCheckout={handleCheckout}
          disabled={!phoneNumber || phoneNumber.length < 11}
        />
      </div>

      {selectedProduct &&
        !showPinModal &&
        !showBiometricModal &&
        !showPinSetupModal &&
        !topupMutation.isPending && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            product={selectedProduct}
            phoneNumber={phoneNumber}
            networkName={detectedNetwork || "Unknown Network"}
            userBalance={parseFloat(user?.balance || "0")}
            userCashbackBalance={user?.cashback?.availableBalance || 0}
            onConfirm={handlePayment}
            isProcessing={topupMutation.isPending}
            isSuccess={isSuccess}
            isFailed={isFailed}
            failureMessage={failureMessage}
            onRetry={() => {
              setIsFailed(false);
              setFailureMessage("");
              if (pendingPaymentData) setShowBiometricModal(true);
            }}
            markupPercent={0} // No markup for airtime typically, or handled by backend
            onShare={isSuccess ? () => setIsShareDialogOpen(true) : undefined}
          />
        )}

      <BiometricVerificationModal
        open={showBiometricModal}
        onClose={() => {
          setShowBiometricModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={handleBiometricSuccess}
        onBiometricUnavailable={() => {
          setShowBiometricModal(false);
          setShowPinModal(true);
        }}
        onNoPinSetup={() => {
          setShowBiometricModal(false);
          setShowPinSetupModal(true);
        }}
        transactionAmount={pendingPaymentData?.amount?.toString()}
        productCode="GENERAL_AIRTIME"
        phoneNumber={phoneNumber}
        isVerifying={topupMutation.isPending}
      />

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
        productCode="GENERAL_AIRTIME"
        phoneNumber={phoneNumber}
        isVerifying={topupMutation.isPending}
        errorMessage={errorMessage}
        onForgotPin={() =>
          router.push(
            "/dashboard/profile/security/pin?returnUrl=/dashboard/airtime"
          )
        }
      />

      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => {
          setShowPinSetupModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={() => {
          setShowPinSetupModal(false);
          setShowPinModal(true);
          refetchUser();
        }}
      />

      {lastTransactionId && (
        <AirtimeShareDialogWithTransaction
          transactionId={lastTransactionId}
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}
    </div>
  );
}

function AirtimeShareDialogWithTransaction({
  transactionId,
  isOpen,
  onClose,
}: {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useTransaction(transactionId);
  const transaction = data?.data;

  if (!isOpen || isLoading || !transaction) return null;

  return (
    <ShareTransactionDialog
      isOpen={isOpen}
      onClose={onClose}
      transaction={transaction}
    />
  );
}
