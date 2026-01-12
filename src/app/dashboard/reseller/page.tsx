"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { FileUp, Key, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * Reseller Hub Page
 * Main entry point for reseller-specific features
 */
export default function ResellerHubPage() {
  const { user, isLoading } = useAuth();

  // Check if user is a reseller
  if (!isLoading && user?.role !== "reseller") {
    redirect("/dashboard");
  }

  const features = [
    {
      title: "Bulk Topup",
      description: "Process multiple topups in a single batch (up to 50)",
      icon: FileUp,
      href: "/dashboard/reseller/bulk-topup",
      color: "text-blue-500",
    },
    {
      title: "API Keys",
      description: "Manage API keys for your integrations",
      icon: Key,
      href: "/dashboard/reseller/api-keys",
      color: "text-amber-500",
    },
    {
      title: "Performance Bonus",
      description: "View your monthly performance bonuses",
      icon: TrendingUp,
      href: "/dashboard/transactions?filter=bonus",
      color: "text-green-500",
    },
  ];

  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Reseller Hub</h1>
          <p className="text-muted-foreground mt-2">
            Tools to help you run your reseller business
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div
                  className={`bg-muted mb-2 flex size-12 items-center justify-center rounded-lg ${feature.color}`}
                >
                  <feature.icon className="size-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={feature.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
