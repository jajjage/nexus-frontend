/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { userService } from "@/services/user.service";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Copy, Eye, EyeOff, Loader2, Plus, Share2 } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

interface BalanceCardProps {
  balance: number;
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
  virtualAccountNumber?: string;
  virtualAccountBankName?: string;
  virtualAccountAccountName?: string;
  onAccountCreated?: () => void;
}

export function BalanceCard({
  balance,
  isVisible,
  setIsVisible,
  virtualAccountNumber,
  virtualAccountBankName,
  virtualAccountAccountName,
  onAccountCreated,
}: BalanceCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only check for virtualAccountNumber - bank name and account name might be null/pending
  const hasVirtualAccount = !!virtualAccountNumber;

  const formattedBalance = balance.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const accountDetailsText = hasVirtualAccount
    ? `Account Name: ${virtualAccountAccountName}\nAccount Number: ${virtualAccountNumber}\nBank: ${virtualAccountBankName}`
    : "";

  const handleCopy = () => {
    if (virtualAccountNumber) {
      navigator.clipboard.writeText(virtualAccountNumber);
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

  // Create virtual account mutation - now without BVN
  const createAccountMutation = useMutation({
    mutationFn: () => userService.createVirtualAccount({}),
    onSuccess: (response) => {
      toast.success(
        response.message || "Virtual account created successfully!"
      );
      // Call onAccountCreated to refetch user data
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

  // Track if we've already attempted to create an account in this dialog session
  const hasAttemptedCreationRef = useRef(false);

  // Handle dialog open/close - auto-create virtual account when dialog opens
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);

    if (
      open &&
      !hasVirtualAccount &&
      !hasAttemptedCreationRef.current &&
      !createAccountMutation.isPending
    ) {
      hasAttemptedCreationRef.current = true;
      createAccountMutation.mutate();
    }

    // Reset the flag when dialog closes
    if (!open) {
      hasAttemptedCreationRef.current = false;
    }
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

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-full bg-white/20 px-3 text-xs backdrop-blur-sm hover:bg-white/30 md:h-10 md:gap-2 md:px-4 md:text-sm">
              <Plus className="size-3.5 md:size-4" />
              <span>Add Money</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[340px] max-w-[95vw] p-0 sm:max-w-md">
            <DialogHeader className="px-4 pt-6 pb-2">
              <DialogTitle className="text-center">
                {hasVirtualAccount ? "Add Money" : "Creating Virtual Account"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {hasVirtualAccount
                  ? "Transfer to the account below to fund your wallet."
                  : "Please wait while we set up your virtual account."}
              </DialogDescription>
            </DialogHeader>

            {hasVirtualAccount ? (
              // Show account details
              <>
                <div className="space-y-4 p-4 pb-2">
                  {virtualAccountAccountName && (
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Account Name
                      </p>
                      <p className="text-lg font-semibold">
                        {virtualAccountAccountName}
                      </p>
                    </div>
                  )}
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      Account Number
                    </p>
                    <p className="text-2xl font-bold tracking-widest">
                      {virtualAccountNumber}
                    </p>
                  </div>
                  {virtualAccountBankName && (
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="text-muted-foreground text-sm">Bank</p>
                      <p className="text-lg font-semibold">
                        {virtualAccountBankName}
                      </p>
                    </div>
                  )}
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
              // Show loading state while creating account
              <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <Loader2 className="text-primary h-12 w-12 animate-spin" />
                <p className="text-muted-foreground text-center">
                  Creating your virtual account...
                </p>
                <p className="text-muted-foreground text-center text-sm">
                  This may take a few seconds
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
