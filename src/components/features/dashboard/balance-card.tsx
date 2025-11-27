"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Copy, Share2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface BalanceCardProps {
  balance: number;
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
  accountName: string;
  accountNumber: string;
  providerName: string;
}

export function BalanceCard({
  balance,
  isVisible,
  setIsVisible,
  accountName,
  accountNumber,
  providerName,
}: BalanceCardProps) {
  const formattedBalance = balance.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const accountDetailsText = `Account Name: ${accountName}\nAccount Number: ${accountNumber}\nBank: ${providerName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    toast.success("Account number copied to clipboard!");
  };

  const handleShare = async () => {
    if (navigator.share) {
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
      // Fallback for browsers that don't support Web Share API
      handleCopy();
      toast.info("Sharing not supported, account number copied instead.");
    }
  };

  return (
    <Card className="bg-primary text-primary-foreground relative z-10 w-full rounded-t-2xl rounded-b-none p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm opacity-90">Available Balance</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible((prev) => !prev)}
              className="text-primary-foreground/90 h-auto w-auto p-0 hover:bg-transparent hover:text-white"
              aria-label={isVisible ? "Hide balance" : "Show balance"}
            >
              {isVisible ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </Button>
          </div>
          <p className="mt-1 text-3xl font-bold">
            {isVisible ? formattedBalance : "••••••••"}
          </p>
        </div>

        <Drawer>
          <DrawerTrigger asChild>
            <Button className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
              <Plus className="size-4" />
              <span>Add Money</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>Add Money</DrawerTitle>
                <DrawerDescription>
                  Transfer to the account below to fund your wallet.
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 p-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Account Name</p>
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
              <div className="grid grid-cols-2 gap-4 p-4">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="mr-2 size-4" /> Copy
                </Button>
                <Button onClick={handleShare}>
                  <Share2 className="mr-2 size-4" /> Share
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </Card>
  );
}
