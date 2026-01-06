"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/user.service";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Copy, Eye, EyeOff, Loader2, Plus, Share2 } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface BalanceCardProps {
  balance: number;
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
  accountName?: string;
  accountNumber?: string;
  providerName?: string;
  onAccountCreated?: () => void;
}

// BVN Validation: Must be exactly 11 digits and start with "22"
const validateBvn = (bvn: string): { valid: boolean; error?: string } => {
  // Remove any whitespace
  const cleanBvn = bvn.trim();

  // Check if it's only digits
  if (!/^\d+$/.test(cleanBvn)) {
    return { valid: false, error: "BVN must contain only numbers" };
  }

  // Check length - must be exactly 11 digits
  if (cleanBvn.length !== 11) {
    return { valid: false, error: "BVN must be exactly 11 digits" };
  }

  // Check if it starts with "22"
  if (!cleanBvn.startsWith("22")) {
    return { valid: false, error: "BVN must start with 22" };
  }

  return { valid: true };
};

export function BalanceCard({
  balance,
  isVisible,
  setIsVisible,
  accountName,
  accountNumber,
  providerName,
  onAccountCreated,
}: BalanceCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bvn, setBvn] = useState("");
  const [bvnError, setBvnError] = useState<string | null>(null);

  const hasVirtualAccount = !!(accountNumber && accountName && providerName);

  const formattedBalance = balance.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const accountDetailsText = hasVirtualAccount
    ? `Account Name: ${accountName}\nAccount Number: ${accountNumber}\nBank: ${providerName}`
    : "";

  const handleCopy = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber);
      toast.success("Account number copied to clipboard!");
    }
  };

  const handleShare = async () => {
    if (navigator.share && hasVirtualAccount) {
      try {
        await navigator.share({
          title: "My Account Details",
          text: accountDetailsText,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast.error("Could not share details.");
      }
    } else {
      handleCopy();
      toast.info("Sharing not supported, account number copied instead.");
    }
  };

  // Create virtual account mutation
  const createAccountMutation = useMutation({
    mutationFn: (bvnValue: string) =>
      userService.createVirtualAccount({ bvn: bvnValue }),
    onSuccess: (response) => {
      toast.success(
        response.message || "Virtual account created successfully!"
      );
      setBvn("");
      setBvnError(null);
      // Call onAccountCreated to refetch user data - dialog stays open
      // Once user data is refetched, hasVirtualAccount will be true
      // and the dialog will automatically show the account details
      onAccountCreated?.();
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to create virtual account"
      );
    },
  });

  const handleBvnChange = (value: string) => {
    // Only allow digits and limit to 11 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 11);
    setBvn(cleanValue);

    // Clear error when user starts typing
    if (bvnError) {
      setBvnError(null);
    }
  };

  const handleSubmitBvn = () => {
    const validation = validateBvn(bvn);
    if (!validation.valid) {
      setBvnError(validation.error || "Invalid BVN");
      return;
    }

    createAccountMutation.mutate(bvn);
  };

  return (
    <Card className="bg-primary text-primary-foreground relative z-10 w-full rounded-t-2xl rounded-b-none p-4 shadow-lg md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-90 md:text-sm">Available Balance</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible((prev) => !prev)}
              className="text-primary-foreground/90 h-auto w-auto p-0 hover:bg-transparent hover:text-white"
              aria-label={isVisible ? "Hide balance" : "Show balance"}
            >
              {isVisible ? (
                <Eye className="size-4 md:size-5" />
              ) : (
                <EyeOff className="size-4 md:size-5" />
              )}
            </Button>
          </div>
          <p className="mt-0.5 text-2xl font-bold md:mt-1 md:text-3xl">
            {isVisible ? formattedBalance : "••••••••"}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-full bg-white/20 px-3 text-xs backdrop-blur-sm hover:bg-white/30 md:h-10 md:gap-2 md:px-4 md:text-sm">
              <Plus className="size-3.5 md:size-4" />
              <span>Add Money</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[340px] max-w-[95vw] p-0 sm:max-w-md">
            <DialogHeader className="px-4 pt-6 pb-2">
              <DialogTitle className="text-center">
                {hasVirtualAccount ? "Add Money" : "Create Virtual Account"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {hasVirtualAccount
                  ? "Transfer to the account below to fund your wallet."
                  : "Enter your BVN to create a virtual account for funding your wallet."}
              </DialogDescription>
            </DialogHeader>

            {hasVirtualAccount ? (
              // Show account details
              <>
                <div className="space-y-4 p-4 pb-2">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      Account Name
                    </p>
                    <p className="text-lg font-semibold">{accountName}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      Account Number
                    </p>
                    <p className="text-2xl font-bold tracking-widest">
                      {accountNumber}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-muted-foreground text-sm">Bank</p>
                    <p className="text-lg font-semibold">{providerName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 pt-0 pb-6">
                  <Button variant="outline" onClick={handleCopy}>
                    <Copy className="mr-2 size-4" /> Copy
                  </Button>
                  <Button onClick={handleShare}>
                    <Share2 className="mr-2 size-4" /> Share
                  </Button>
                </div>
              </>
            ) : (
              // Show BVN form
              <div className="space-y-4 p-4 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                  <Input
                    id="bvn"
                    type="text"
                    inputMode="numeric"
                    placeholder="22XXXXXXXXX"
                    value={bvn}
                    onChange={(e) => handleBvnChange(e.target.value)}
                    className={bvnError ? "border-destructive" : ""}
                    maxLength={11}
                  />
                  {bvnError && (
                    <p className="text-destructive text-sm">{bvnError}</p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Your BVN is 11 digits and starts with 22. We use this to
                    verify your identity and create your virtual account.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitBvn}
                  disabled={
                    bvn.length !== 11 || createAccountMutation.isPending
                  }
                >
                  {createAccountMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Virtual Account"
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
