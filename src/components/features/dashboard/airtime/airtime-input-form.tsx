"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/types/product.types";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";

interface AirtimeInputFormProps {
  product: Product;
  phoneNumber: string;
  onCheckout: (amount: number) => void;
  disabled?: boolean;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export function AirtimeInputForm({
  product,
  phoneNumber,
  onCheckout,
  disabled = false,
}: AirtimeInputFormProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string>("");

  const minAmount = product.minAmount || 50;
  const maxAmount = product.maxAmount || 50000;
  const cashbackPercent = product.has_cashback
    ? product.cashback_percentage || 0
    : 0;

  // Validate amount on change
  useEffect(() => {
    if (amount === "") {
      setError("");
      return;
    }

    if (amount < minAmount) {
      setError(`Minimum amount is ₦${minAmount}`);
    } else if (amount > maxAmount) {
      setError(`Maximum amount is ₦${maxAmount.toLocaleString()}`);
    } else {
      setError("");
    }
  }, [amount, minAmount, maxAmount]);

  const handleQuickSelect = (val: number) => {
    setAmount(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount === "number" && !error && amount >= minAmount) {
      onCheckout(amount);
    }
  };

  const cashbackAmount =
    typeof amount === "number" ? (amount * cashbackPercent) / 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
            <span className="text-primary text-sm font-bold">₦</span>
          </div>
          Enter Amount
        </CardTitle>
        <CardDescription>
          Buying airtime for <span className="font-mono">{phoneNumber}</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                ₦
              </span>
              <Input
                id="amount"
                type="number"
                placeholder={`Min: ${minAmount} - Max: ${maxAmount}`}
                className="pl-7 text-lg font-medium"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === "" ? "" : Number(val));
                }}
                min={minAmount}
                max={maxAmount}
                disabled={disabled}
              />
            </div>
            {error && (
              <p className="text-destructive text-xs font-medium">{error}</p>
            )}

            {/* Quick Select Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {QUICK_AMOUNTS.map((val) => (
                <Badge
                  key={val}
                  variant={amount === val ? "default" : "outline"}
                  className="hover:bg-primary/90 hover:text-primary-foreground cursor-pointer px-3 py-1 text-sm"
                  onClick={() => !disabled && handleQuickSelect(val)}
                >
                  ₦{val}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cashback Preview */}
          {cashbackPercent > 0 &&
            typeof amount === "number" &&
            amount >= minAmount &&
            !error && (
              <div className="rounded-lg border bg-emerald-50/50 p-3 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wallet className="h-4 w-4" />
                  <span>Cashback Reward</span>
                </div>
                <p className="mt-1 text-xs">
                  You will earn{" "}
                  <span className="font-bold">
                    ₦{cashbackAmount.toFixed(2)}
                  </span>{" "}
                  ({cashbackPercent}%) cashback on this transaction.
                </p>
              </div>
            )}
        </CardContent>
        <CardFooter className="pt-6">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              disabled ||
              !!error ||
              amount === "" ||
              (typeof amount === "number" && amount < minAmount)
            }
          >
            Buy Airtime
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
