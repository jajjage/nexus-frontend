"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeactivateReferralLink,
  useReferralLink,
  useRegenerateReferralCode,
} from "@/hooks/useReferrals";
import { Copy, Loader2, RefreshCw, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ReferralLinkSection() {
  const { data: linkData, isLoading, refetch } = useReferralLink();
  const { mutate: regenerateCode, isPending: isRegenerating } =
    useRegenerateReferralCode();
  const { mutate: deactivateLink, isPending: isDeactivating } =
    useDeactivateReferralLink();

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!linkData?.referralLink) return;
    navigator.clipboard.writeText(linkData.referralLink);
    toast.success("Referral link copied to clipboard!");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!linkData) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Nexus Data",
          text:
            linkData.sharingMessage ||
            `Use my code ${linkData.referralCode} to join!`,
          url: linkData.referralLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = () => {
    regenerateCode(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleDeactivate = () => {
    deactivateLink(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mt-4 h-4 w-64" />
        </CardContent>
      </Card>
    );
  }

  if (!linkData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground mb-4">No referral link active.</p>
          <Button onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Referral Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link to earn rewards when friends sign up.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Regenerate Code">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate Referral Code?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will invalidate your current referral link. Any old
                    links shared will no longer work. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerate}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Optional: Deactivate button if supported */}
            {/* <Button variant="ghost" size="icon" onClick={handleDeactivate} title="Deactivate">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button> */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Input
              readOnly
              value={linkData.referralLink || ""}
              className="pr-24 font-mono text-sm"
            />
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
                Code: {linkData.referralCode}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy} disabled={isCopied}>
              {isCopied ? (
                "Copied"
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </>
              )}
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        {/* QR Code Section - Optional, can be toggled */}
        {linkData.qrCodeUrl && (
          <div className="mt-6 flex justify-center">
            <img
              src={linkData.qrCodeUrl}
              alt="Referral QR Code"
              className="h-32 w-32 rounded border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
