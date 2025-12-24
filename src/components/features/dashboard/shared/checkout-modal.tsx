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
import { Check, ChevronRight, Info, X } from "lucide-react";
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
  const sellingPrice = supplierPrice + supplierPrice * actualMarkup;

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
          {isSuccess ? "Transaction Successful" : "Confirm Purchase"}
        </DialogTitle>
        <AnimatePresence mode="wait">
          {isSuccess ? (
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
                Transaction Successful
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-muted-foreground mb-8"
              >
                Your data top-up for{" "}
                <span className="text-foreground font-medium">
                  {phoneNumber}
                </span>{" "}
                is on its way!
              </motion.p>
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
                {sellingPrice < faceValue && (
                  <span className="text-muted-foreground text-sm line-through">
                    ₦
                    {faceValue.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
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
                    <span>Mobile Data</span>
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
                  <span className="text-muted-foreground">Amount to Paid</span>
                  <span className="font-medium">
                    ₦
                    {sellingPrice.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

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
