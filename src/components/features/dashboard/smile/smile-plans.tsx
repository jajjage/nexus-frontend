/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BiometricVerificationModal } from "@/components/auth/BiometricVerificationModal";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useEligibleOffers } from "@/hooks/useUserOffers";
import { useTransaction } from "@/hooks/useWallet";
import { useSecurityStore } from "@/store/securityStore";
import {
  convertDenomAmountToNumber,
  getResolvedProductPrice,
} from "@/utils/reseller-products";
import { Product, ProductCategory } from "@/types/product.types";
import { useQueryClient } from "@tanstack/react-query";
import { Grid, LayoutList, Smile, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckoutModal } from "../shared/checkout-modal";
import { ProductCard } from "../shared/product-card";
import { ShareTransactionDialog } from "../transactions/share-transaction-dialog";
import { CategoryTabs } from "../data/category-tabs";

const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: "smile", name: "Smile", slug: "smile", priority: 1, isActive: true },
  { id: "kirani", name: "Kirani", slug: "kirani", priority: 2, isActive: true },
  { id: "ratel", name: "Ratel", slug: "ratel", priority: 3, isActive: true },
  { id: "alpha", name: "Alpha", slug: "alpha", priority: 4, isActive: true },
];

type SmilePlansProps = {
  returnUrl?: string;
};

export function SmilePlans({
  returnUrl = "/dashboard/smile",
}: SmilePlansProps) {
  const router = useRouter();
  const { user, refetch: refetchUser } = useAuth();
  const { recordPinAttempt } = useSecurityStore();
  const topupMutation = useTopup();
  const queryClient = useQueryClient();

  const [recipient, setRecipient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("smile");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch categories for productType="plan"
  const { data: fetchedCategories = [], isLoading: isCategoriesLoading } =
    useCategories("plan");

  const categories = useMemo(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      return fetchedCategories;
    }
    return DEFAULT_CATEGORIES;
  }, [fetchedCategories]);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMarkupPercent, setSelectedMarkupPercent] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    useCashback: boolean;
    amount?: number;
    verificationToken?: string;
    pin?: string;
  } | null>(null);

  const [lastTransactionId, setLastTransactionId] = useState<string | null>(
    null
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch all products of productType="plan"
  const { data, isLoading, error } = useProducts(
    { productType: "plan", isActive: true },
    { staleTime: 5 * 60 * 1000 }
  );

  const products = useMemo(() => data?.products || [], [data?.products]);

  const isGuest = !user;
  const { eligibleIds } = useEligibleOffers(!isGuest);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const markupMap = useSupplierMarkupMap();

  // Set default category
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].slug);
    }
  }, [categories, selectedCategory]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    const targetCat = selectedCategory.toLowerCase();

    const planProducts = products.filter((p: Product) => {
      if (p.productType?.toLowerCase() !== "plan") return false;

      const pCatSlug =
        p.category?.slug?.toLowerCase() ||
        (p as any).categorySlug?.toLowerCase() ||
        "";
      const pCatName = p.category?.name?.toLowerCase() || "";
      const pCatId = p.categoryId?.toLowerCase() || "";

      return (
        pCatSlug === targetCat || pCatName === targetCat || pCatId === targetCat
      );
    });

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated = planProducts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Sort by price
    return deduplicated.sort((a, b) => {
      const aPrice =
        getResolvedProductPrice(a) ??
        convertDenomAmountToNumber(a.denomAmount) ??
        0;
      const bPrice =
        getResolvedProductPrice(b) ??
        convertDenomAmountToNumber(b.denomAmount) ??
        0;
      return aPrice - bPrice;
    });
  }, [products, selectedCategory]);

  const handlePlanClick = (product: Product) => {
    if (!recipient.trim() || recipient.trim().length < 4) {
      toast.error("Please enter a phone number or account ID first.", {
        description: "We need a valid identifier to proceed.",
        duration: 4000,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSelectedProduct(product);
    setIsSuccess(false);
    setIsFailed(false);
    setFailureMessage("");

    const supplierId = product.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    setSelectedMarkupPercent(markup);

    if (product.activeOffer) {
      const isEligible = eligibleIds.has(product.activeOffer.id);
      setSelectedOfferId(isEligible ? product.activeOffer.id : null);
    } else {
      setSelectedOfferId(null);
    }

    setIsCheckoutOpen(true);
  };

  const handleBiometricSuccess = (verificationToken: string) => {
    if (pendingPaymentData) {
      setPendingPaymentData({
        ...pendingPaymentData,
        verificationToken,
      });
      proceedWithPayment(pendingPaymentData.useCashback, verificationToken);
    }
  };

  const handleBiometricUnavailable = useCallback(() => {
    setShowBiometricModal(false);
    setShowPinModal(true);
  }, []);

  const handleNoPinSetup = useCallback(() => {
    setShowBiometricModal(false);
    setShowPinSetupModal(true);
  }, []);

  const handlePinSetupSuccess = useCallback(() => {
    setShowPinSetupModal(false);
    setShowPinModal(true);
    refetchUser();
  }, [refetchUser]);

  const handlePinEntrySuccess = (pin: string) => {
    setErrorMessage("");
    if (pendingPaymentData) {
      proceedWithPayment(pendingPaymentData.useCashback, undefined, pin);
    } else {
      setShowPinModal(false);
    }
  };

  const handlePayment = (useCashback: boolean) => {
    if (!selectedProduct) return;

    const basePrice =
      getResolvedProductPrice(selectedProduct) ??
      convertDenomAmountToNumber(selectedProduct.denomAmount);

    const userCashbackBalance = user?.cashback?.availableBalance || 0;
    const payableAmount = useCashback
      ? Math.max(0, basePrice - userCashbackBalance)
      : basePrice;

    setPendingPaymentData({ useCashback, amount: payableAmount });
    setIsCheckoutOpen(false);
    setShowBiometricModal(true);
  };

  const proceedWithPayment = (
    useCashback: boolean,
    verificationToken?: string,
    pin?: string
  ) => {
    if (!selectedProduct) return;

    const amount =
      getResolvedProductPrice(selectedProduct) ??
      convertDenomAmountToNumber(selectedProduct.denomAmount);
    const offer = selectedProduct.supplierOffers?.[0];

    topupMutation.mutate(
      {
        amount,
        productCode: selectedProduct.productCode,
        recipientPhone: recipient.trim(),
        supplierSlug: offer?.supplierSlug,
        supplierMappingId: offer?.mappingId,
        useCashback,
        verificationToken,
        pin,
        offerId: selectedOfferId || undefined,
        allowOperatorMismatch: true,
      },
      {
        onSuccess: (response) => {
          setIsSuccess(true);
          const txId =
            response.data?.transactionId ||
            response.data?.id ||
            response.data?.transaction_id ||
            response.data?.topupRequestId ||
            response.data?.requestId;
          if (txId) {
            setLastTransactionId(txId);
          }
          if (pin) recordPinAttempt(true);

          setShowPinModal(false);
          setShowBiometricModal(false);
          setIsCheckoutOpen(true);
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Transaction failed. Please try again.";

          if (
            pin &&
            (msg.toLowerCase().includes("pin") ||
              msg.toLowerCase().includes("invalid"))
          ) {
            const isExceeded = recordPinAttempt(false);
            if (isExceeded) {
              setShowPinModal(false);
              setShowBiometricModal(false);
              setIsCheckoutOpen(false);
              toast.error(
                "3 incorrect PIN attempts. Redirecting to change PIN page..."
              );
              router.push(
                `/dashboard/profile/security/pin?returnUrl=${encodeURIComponent(returnUrl)}`
              );
            } else {
              setErrorMessage(msg);
            }
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

  const handleRetry = () => {
    setIsFailed(false);
    setFailureMessage("");
    setIsCheckoutOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Recipient Input Card */}
      <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
        <label className="text-foreground mb-2 block text-sm font-medium">
          {selectedCategory === "smile"
            ? "Phone Number or Account ID"
            : "Recipient Phone Number"}
        </label>
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder={
              selectedCategory === "smile"
                ? "e.g. 08012345678 or Account ID"
                : "e.g. 08012345678"
            }
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="h-11 pr-10 text-sm"
          />
          {recipient && (
            <button
              type="button"
              onClick={() => setRecipient("")}
              className="text-muted-foreground hover:text-foreground absolute right-3 p-1"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs Header with View Mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-hidden">
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            isLoading={isCategoriesLoading}
          />
        </div>
        <div className="ml-4 flex items-center gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="size-4" />
          </Button>
        </div>
      </div>

      {/* Product Grid */}
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
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <Smile className="text-muted-foreground/50 mb-3 size-12" />
          <h3 className="text-foreground text-base font-semibold">
            No {selectedCategory.toUpperCase()} plans available
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Plans in this category will appear here once available.
          </p>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedProduct &&
        !showBiometricModal &&
        !showPinModal &&
        !showPinSetupModal &&
        !topupMutation.isPending && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            product={selectedProduct}
            phoneNumber={recipient.trim()}
            networkName={selectedCategory.toUpperCase()}
            userBalance={parseFloat(user?.balance || "0")}
            userCashbackBalance={user?.cashback?.availableBalance || 0}
            onConfirm={handlePayment}
            isProcessing={topupMutation.isPending}
            isSuccess={isSuccess}
            isFailed={isFailed}
            failureMessage={failureMessage}
            onRetry={handleRetry}
            markupPercent={selectedMarkupPercent}
            onShare={
              isSuccess
                ? () => {
                    setIsShareDialogOpen(true);
                  }
                : undefined
            }
          />
        )}

      {/* Biometric Verification Modal */}
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
        phoneNumber={recipient.trim()}
        isVerifying={topupMutation.isPending}
      />

      {/* PIN Verification Modal */}
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
        phoneNumber={recipient.trim()}
        isVerifying={topupMutation.isPending}
        errorMessage={errorMessage}
        onForgotPin={() =>
          router.push(
            `/dashboard/profile/security/pin?returnUrl=${encodeURIComponent(returnUrl)}`
          )
        }
      />

      {/* PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => {
          setShowPinSetupModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={handlePinSetupSuccess}
      />

      {/* Share Dialog */}
      {lastTransactionId && (
        <ShareDialogWithTransaction
          transactionId={lastTransactionId}
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}
    </div>
  );
}

function ShareDialogWithTransaction({
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
