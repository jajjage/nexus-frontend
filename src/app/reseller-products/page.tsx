"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { getResolvedProductPrice } from "@/utils/reseller-products";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function ResellerProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "data" | "airtime">(
    "all"
  );
  const [selectedOperator, setSelectedOperator] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch all active products for tenant
  const { data, isLoading } = useProducts({
    isActive: true,
    perPage: 200,
  });

  const products = data?.products || [];

  // Filter products based on search, product type, and operator
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.operator?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === "all" || product.productType === selectedType;

      const matchesOperator =
        selectedOperator === "all" || product.operatorId === selectedOperator;

      return matchesSearch && matchesType && matchesOperator;
    });
  }, [products, searchQuery, selectedType, selectedOperator]);

  // Get unique operators from returned tenant products
  const operators = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach((p) => {
      if (p.operator && !unique.has(p.operatorId)) {
        unique.set(p.operatorId, p.operator.name);
      }
    });
    return Array.from(unique.entries());
  }, [products]);

  // Handle copying product code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export filtered products as CSV
  const exportCSV = () => {
    const headers = [
      "Product Name",
      "Product Code",
      "Type",
      "Operator",
      "Price (NGN)",
      "Data (MB)",
      "Validity (Days)",
      "Status",
    ];

    const rows = filteredProducts.map((p) => [
      p.name,
      p.productCode,
      p.productType,
      p.operator?.name || "N/A",
      getResolvedProductPrice(p) ?? "Variable",
      p.dataMb || "N/A",
      p.validityDays || "N/A",
      p.isActive ? "Active" : "Inactive",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reseller-products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header Banner */}
      <div className="border-b bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Tenant Isolated API
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Reseller Product Catalog
              </h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
                Discover available data bundles, airtime plans, and API product
                codes for integration.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
              <Button asChild variant="default" className="gap-2">
                <Link href="/reseller-api-docs">
                  <ExternalLink className="h-4 w-4" /> View API Docs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls & Search */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, code, or operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-4 pl-10 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
            </div>

            {/* Product Type Filter */}
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as "all" | "data" | "airtime")
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Product Types</option>
              <option value="data">Data Bundles</option>
              <option value="airtime">Airtime</option>
            </select>

            {/* Operator Filter */}
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Operators</option>
              {operators.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredProducts.length}
              </span>{" "}
              of {products.length} products
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Loading catalog...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              No products found matching your criteria
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search terms or filter selections.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden border border-slate-200 bg-white transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {product.operator?.name || "Network Operator"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        product.productType === "data" ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {product.productType === "data"
                        ? "📊 Data"
                        : "📱 Airtime"}
                    </Badge>
                  </div>

                  {/* API Product Code */}
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/40">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-wider text-amber-800 uppercase dark:text-amber-300">
                        API Product Code
                      </p>
                      <button
                        onClick={() => handleCopyCode(product.productCode)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                      >
                        {copiedCode === product.productCode ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-600" />{" "}
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <code className="mt-1 block font-mono text-sm font-bold break-all text-amber-950 dark:text-amber-100">
                      {product.productCode}
                    </code>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Price
                    </p>
                    {(() => {
                      const price = getResolvedProductPrice(product) ?? 0;
                      return price > 0 ? (
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₦{price.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-slate-500 italic">
                          Variable Amount
                        </p>
                      );
                    })()}
                  </div>

                  {/* Product Details Grid */}
                  <div className="mb-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {product.dataMb ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                          Data
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {product.dataMb.toLocaleString()} MB
                        </p>
                      </div>
                    ) : null}
                    {product.validityDays ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                          Validity
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {product.validityDays} days
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Badge
                      variant={product.isActive ? "outline" : "destructive"}
                      className={
                        product.isActive
                          ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {product.isActive ? "✓ Available" : "✗ Unavailable"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Integration Instructions */}
        <div className="mt-12 rounded-xl border border-blue-200 bg-blue-50/70 p-6 dark:border-blue-900/50 dark:bg-blue-950/30">
          <h3 className="mb-3 text-lg font-bold text-blue-950 dark:text-blue-200">
            Integrating with the Reseller API
          </h3>
          <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span> Copy the{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold dark:bg-slate-800">
                product_code
              </code>{" "}
              for the bundle you want to purchase.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span> Include the code in your API
              request body:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold dark:bg-slate-800">
                {
                  '{ "product_code": "MTN_5GB_SME_SHARE", "phone_number": "08012345678" }'
                }
              </code>
              .
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span> Send your requests with your{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold dark:bg-slate-800">
                X-API-KEY
              </code>{" "}
              and{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold dark:bg-slate-800">
                X-Idempotency-Key
              </code>{" "}
              headers.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
