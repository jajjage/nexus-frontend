"use client";

import { NetworkSelector } from "@/components/features/dashboard/shared/network-selector";
import { ProductCard } from "@/components/features/dashboard/shared/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product.types";
import { Grid, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface PublicProductGridProps {
  productType: "data" | "airtime";
  title: string;
}

export function PublicProductGrid({
  productType,
  title,
}: PublicProductGridProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch products using public endpoint - only active products
  const { data, isLoading, error } = useProducts(
    { productType, isActive: true },
    { staleTime: 1000 * 60 * 5 } // 5 minutes
  );

  const products = data?.products || [];

  // Extract unique operators from products (for NetworkSelector which uses name-based selection)
  const operators = useMemo(() => {
    const opMap = new Map<string, { name: string; logoUrl: string }>();
    products.forEach((p) => {
      if (p.operator) {
        opMap.set(p.operator.name, {
          name: p.operator.name,
          logoUrl: p.operator.logoUrl,
        });
      }
    });
    return Array.from(opMap.values());
  }, [products]);

  // Filter products by selected network name
  const filteredProducts = useMemo(() => {
    if (!selectedNetwork) return products;
    return products.filter((p) => p.operator?.name === selectedNetwork);
  }, [products, selectedNetwork]);

  // Handle network selection (toggle)
  const handleNetworkSelect = (networkName: string) => {
    setSelectedNetwork(networkName === selectedNetwork ? "" : networkName);
  };

  // Handle product click - redirect to login if not authenticated
  const handleProductClick = (product: Product) => {
    if (!user) {
      router.push(
        `/login?redirect=/${productType === "data" ? "dashboard/data" : "dashboard/airtime"}`
      );
    } else {
      router.push(
        productType === "data" ? "/dashboard/data" : "/dashboard/airtime"
      );
    }
  };

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Selector */}
      {operators.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <NetworkSelector
            operators={operators}
            selectedNetwork={selectedNetwork}
            onSelect={handleNetworkSelect}
          />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted-foreground">
            {selectedNetwork
              ? "No products available for this network."
              : `No ${productType} products available.`}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : "flex flex-col gap-3"
          }
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
              isGuest={!user}
            />
          ))}
        </div>
      )}

      {/* CTA for non-authenticated users */}
      {!user && filteredProducts.length > 0 && (
        <div className="bg-primary/5 mt-6 rounded-xl p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">Ready to Purchase?</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Sign in or create an account to buy {productType} at the best rates.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Sign In
            </Button>
            <Button onClick={() => router.push("/register")}>
              Create Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
