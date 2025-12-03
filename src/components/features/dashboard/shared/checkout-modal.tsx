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
import { Check, ChevronRight, Info, X } from "lucide-react";
import { useState } from "react";

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
}

export function CheckoutModal({
  isOpen,
  onClose,
  product,
  phoneNumber,
  networkLogo,
  networkName,
  userBalance = 0,
  userCashbackBalance = 0,
  onConfirm,
  isProcessing,
  isSuccess = false,
}: CheckoutModalProps) {
  const [useCashback, setUseCashback] = useState(false);

  // Price calculations
  const faceValue = parseFloat(product.denomAmount || "0");
  const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
    ? parseFloat(product.supplierOffers[0].supplierPrice)
    : faceValue;

  // Calculate selling price (margin logic from card)
  let sellingPrice = faceValue;
  if (supplierPrice < faceValue) {
    const margin = faceValue - supplierPrice;
    sellingPrice = faceValue - margin / 2;
  }

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

  const isInsufficientBalance = userBalance < payableAmount;

  const handleConfirm = () => {
    onConfirm(useCashback);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md gap-0 p-0 sm:rounded-2xl">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="size-10 stroke-[3]" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              Transaction Successful
            </h2>
            <p className="text-muted-foreground mb-8">
              Your data top-up for{" "}
              <span className="text-foreground font-medium">{phoneNumber}</span>{" "}
              is on its way!
            </p>
            <Button size="lg" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-2">
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
            <div className="bg-muted/10 flex flex-col space-y-4 border-t px-6 py-6">
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
                <span className="text-muted-foreground">Recipient Mobile</span>
                <span className="font-medium">{phoneNumber}</span>
              </div>

              {/* Plan */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Bundle</span>
                <span className="font-medium">{product.name}</span>
              </div>

              {/* Base Price */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  ₦
                  {sellingPrice.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Voucher - Upcoming Feature */}
              {/* <button className="flex items-center justify-between text-sm group">
            <span className="text-muted-foreground">Voucher</span>
            <div className="flex items-center gap-1 font-medium text-blue-600 transition-colors group-hover:text-blue-700">
              <span>
                -₦
                {voucherAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <ChevronRight className="size-4" />
            </div>
          </button> */}

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
            <div className="flex flex-col gap-3 px-6 pt-4 pb-8">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
