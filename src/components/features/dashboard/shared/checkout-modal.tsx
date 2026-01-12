"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Product } from "@/types/product.types";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  phoneNumber: string;
  networkLogo?: string;
  networkName?: string;
  userBalance?: number;
  userCashbackBalance?: number;
  onConfirm: (useCashback: boolean) => void;
  isProcessing: boolean;
  isSuccess?: boolean;
  isFailed?: boolean;
  failureMessage?: string;
  onRetry?: () => void;
  markupPercent?: number;
}

export function CheckoutModal({
  isOpen,
  onClose,
  product,
  phoneNumber,
  networkLogo,
  userBalance = 0,
  userCashbackBalance = 0,
  onConfirm,
  isProcessing,
  isSuccess = false,
  isFailed = false,
  failureMessage = "Transaction failed. Please try again.",
  onRetry,
  markupPercent = 0,
}: CheckoutModalProps) {
  const [useCashback, setUseCashback] = useState(false);
  console.log("userCashbackBalance: ", useCashback);
  // Reset useCashback state when the modal closes or when a new product is selected
  useEffect(() => {
    if (!isOpen) {
      setUseCashback(false);
    }
  }, [isOpen]);

  // Price calculations
  const faceValue = parseFloat(product.denomAmount || "0");
  const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
    ? parseFloat(product.supplierOffers[0].supplierPrice)
    : faceValue;

  // Calculate selling price: supplierPrice + (supplierPrice * markup%)
  // markupPercent can be either decimal (0.10) or percentage (10)
  // If it's less than 1, treat as decimal; otherwise divide by 100
  const actualMarkup = markupPercent < 1 ? markupPercent : markupPercent / 100;
  const baseSellingPrice = supplierPrice + supplierPrice * actualMarkup;

  // Check for active offer discount
  // If product.discountedPrice is provided and less than base price, use it
  const hasOfferDiscount =
    product.discountedPrice !== undefined &&
    product.discountedPrice !== null &&
    product.discountedPrice < baseSellingPrice;

  // Use discounted price if offer is active, otherwise use base selling price
  const sellingPrice = hasOfferDiscount
    ? product.discountedPrice
    : baseSellingPrice;

  // Original price (for strikethrough display)
  const originalPrice = hasOfferDiscount ? baseSellingPrice : faceValue;

  // Calculate Cashback usage
  // If useCashback is true, deduct the available cashback balance from the selling price
  const payableAmount = useCashback
    ? Math.max(0, sellingPrice - userCashbackBalance)
    : sellingPrice;

  // Bonus logic (Earn Cashback)
  const bonusAmount =
    product.has_cashback && product.cashback_percentage
      ? sellingPrice * (product.cashback_percentage / 100)
      : 0;
  console.log(product.has_cashback, product.cashback_percentage);
  const isInsufficientBalance = userBalance < payableAmount;

  const handleConfirm = () => {
    onConfirm(useCashback);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-[calc(100%-2rem)] p-4 sm:max-w-md sm:rounded-2xl sm:p-6"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {isSuccess
            ? `${product.productType === "data" ? "Data" : "Airtime"} Purchase Successful`
            : isFailed
              ? `${product.productType === "data" ? "Data" : "Airtime"} Purchase Failed`
              : "Confirm Purchase"}
        </DialogTitle>
        <AnimatePresence mode="wait">
          {isFailed ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center px-6 py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              >
                <XCircle className="size-10 stroke-2" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mb-2 text-2xl font-bold tracking-tight"
              >
                {product.productType === "data"
                  ? "Data Purchase Failed"
                  : "Airtime Purchase Failed"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-muted-foreground mb-4 max-w-[280px]"
              >
                {failureMessage}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="mb-6 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  Your wallet was not charged. Please try again or contact
                  support if the issue persists.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex w-full gap-3"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                >
                  Close
                </Button>
                {onRetry && (
                  <Button size="lg" className="flex-1" onClick={onRetry}>
                    Try Again
                  </Button>
                )}
              </motion.div>
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center px-6 py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600"
              >
                <Check className="size-10 stroke-3" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mb-2 text-2xl font-bold tracking-tight"
              >
                {product.productType === "data"
                  ? "Data Purchase Successful!"
                  : "Airtime Purchase Successful!"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-muted-foreground mb-4"
              >
                {product.productType === "data" ? (
                  <>
                    <span className="text-foreground font-semibold">
                      {product.name}
                    </span>{" "}
                    has been credited to{" "}
                    <span className="text-foreground font-medium">
                      {phoneNumber}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-foreground font-semibold">
                      ₦{faceValue.toLocaleString("en-NG")}
                    </span>{" "}
                    airtime has been sent to{" "}
                    <span className="text-foreground font-medium">
                      {phoneNumber}
                    </span>
                  </>
                )}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="bg-muted/50 mb-6 rounded-lg px-4 py-3"
              >
                <p className="text-muted-foreground text-sm">
                  {product.productType === "data"
                    ? "Your data bundle is now active and ready to use."
                    : "Your airtime has been credited instantly."}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Button size="lg" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <DialogHeader className="pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    className="bg-muted/50 hover:bg-muted rounded-full p-2 transition-colors"
                    disabled={isProcessing}
                  >
                    <X className="size-4" />
                  </button>
                  <DialogTitle className="text-center text-base font-semibold">
                    Confirm Purchase
                  </DialogTitle>
                  <div className="size-8" /> {/* Spacer for centering */}
                </div>
              </DialogHeader>

              {/* Hero Price Section */}
              <div className="flex flex-col items-center justify-center pb-6">
                <h2 className="text-4xl font-bold tracking-tight">
                  ₦
                  {payableAmount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                {hasOfferDiscount && (
                  <>
                    <span className="text-muted-foreground text-sm line-through">
                      ₦
                      {originalPrice.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    {product.activeOffer?.title && (
                      <span className="mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {product.activeOffer.title}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Transaction Details List */}
              <div className="bg-muted/10 flex flex-col space-y-4 border-t py-6">
                {/* Product */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product Name</span>
                  <div className="flex items-center gap-2 font-medium">
                    {networkLogo && (
                      <Avatar className="size-5">
                        <AvatarImage
                          src={networkLogo}
                          className="object-contain"
                        />
                        <AvatarFallback>N</AvatarFallback>
                      </Avatar>
                    )}
                    <span>
                      {product.productType === "data"
                        ? "Mobile Data"
                        : "Airtime Recharge"}
                    </span>
                  </div>
                </div>

                {/* Recipient */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Recipient Mobile
                  </span>
                  <span className="font-medium">{phoneNumber}</span>
                </div>

                {/* Plan */}
                {product.productType === "data" ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data Bundle</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Airtime</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                )}

                {/* Base Price */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {hasOfferDiscount ? "Original Price" : "Amount to Paid"}
                  </span>
                  <span
                    className={`font-medium ${hasOfferDiscount ? "text-muted-foreground line-through" : ""}`}
                  >
                    ₦
                    {(hasOfferDiscount
                      ? originalPrice
                      : sellingPrice
                    ).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Offer Discount */}
                {hasOfferDiscount && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        Offer Discount
                        {product.activeOffer?.discountType === "percentage" &&
                          ` (${product.activeOffer.discountValue}%)`}
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -₦
                        {(originalPrice - sellingPrice).toLocaleString(
                          "en-NG",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-muted-foreground">
                        Amount to Pay
                      </span>
                      <span className="font-bold">
                        ₦
                        {sellingPrice.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </>
                )}

                {/* Wallet Promo Toggle (Use Cashback) */}
                {userCashbackBalance > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Use Cashback (₦
                      {userCashbackBalance.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                      )
                    </span>
                    <Switch
                      checked={useCashback}
                      onCheckedChange={setUseCashback}
                      className="data-[state=checked]:bg-green-500"
                      disabled={isProcessing}
                    />
                  </div>
                )}

                {/* Rewards (Bonus to Earn) */}
                {bonusAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bonus to Earn</span>
                    <span className="font-bold text-green-600">
                      +₦
                      {bonusAmount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      Cashback
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-3 pt-4 pb-8">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Payment Method</Label>
                  <button className="text-primary flex items-center text-xs font-medium hover:underline">
                    All <ChevronRight className="size-3" />
                  </button>
                </div>

                <div className="bg-card hover:border-primary/50 relative flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">
                        Available Balance (₦
                        {userBalance.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                        )
                      </span>
                      <Info className="text-muted-foreground size-3.5" />
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Wallet -₦
                      {payableAmount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full">
                    <Check className="size-3.5" />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="mt-4 w-full text-base font-semibold"
                  onClick={handleConfirm}
                  disabled={isProcessing || isInsufficientBalance}
                  variant={isInsufficientBalance ? "destructive" : "default"}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      <span>Processing...</span>
                    </div>
                  ) : isInsufficientBalance ? (
                    "Insufficient Balance"
                  ) : (
                    "Pay"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
