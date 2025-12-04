"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function ReferralsPage() {
  const { user, isLoading } = useAuth();
  const [isCopied, setIsCopied] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const referralCode = user.accountNumber || "REF123456";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Nexus Data",
          text: `Use my referral code ${referralCode} to get started with Nexus Data!`,
          url: referralLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast.error("Could not share link.");
      }
    } else {
      handleCopy();
      toast.info("Sharing not supported, link copied instead.");
    }
  };

  // Mock data for referrals - this would come from your API in a real implementation
  const referrals = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "Active",
      joined: "2025-01-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "Active",
      joined: "2025-01-10",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      status: "Pending",
      joined: "2025-01-05",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-muted-foreground">
          Earn rewards by referring friends
        </p>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to earn referral rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="bg-muted flex-1 rounded-lg p-3 font-mono text-sm break-all">
              {referralLink}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={isCopied}
              >
                {isCopied ? (
                  "Copied!"
                ) : (
                  <>
                    <Copy className="mr-2 size-4" /> Copy
                  </>
                )}
              </Button>
              <Button onClick={handleShare}>
                <Share2 className="mr-2 size-4" /> Share
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            Earn ₦100 for each successful referral when they make their first
            purchase
          </p>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <p className="text-2xl font-bold">3</p>
            <p className="text-muted-foreground text-sm">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <p className="text-2xl font-bold">2</p>
            <p className="text-muted-foreground text-sm">Active Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <p className="text-2xl font-bold">₦2,500</p>
            <p className="text-muted-foreground text-sm">
              Earned from Referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle>Referred Users</CardTitle>
          <CardDescription>
            Users who joined using your referral code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <h4 className="font-medium">{referral.name}</h4>
                  <p className="text-muted-foreground text-sm">
                    {referral.email}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      referral.status === "Active"
                        ? "text-green-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {referral.status}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Joined {new Date(referral.joined).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
