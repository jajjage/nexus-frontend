"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { convertDenomAmountToNumber } from "@/utils/reseller-products";
import { Download, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function ResellerProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "data" | "airtime">(
    "all"
  );
  const [selectedOperator, setSelectedOperator] = useState<string>("all");

  // Fetch all products
  const { data, isLoading } = useProducts({
    isActive: true,
    perPage: 200,
  });

  const products = data?.products || [];

  // Filter products based on search and type
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

  // Get unique operators
  const operators = useMemo(() => {
    const unique = new Map();
    products.forEach((p) => {
      if (p.operator && !unique.has(p.operatorId)) {
        unique.set(p.operatorId, p.operator.name);
      }
    });
    return Array.from(unique.entries());
  }, [products]);

  // Export as CSV
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
      typeof p.denomAmount === "number"
        ? p.denomAmount
        : p.denomAmount || "Variable",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Reseller Product Catalog
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Browse all available products and their API codes for integration
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Use the{" "}
            <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
              product_code
            </code>{" "}
            in your Reseller API requests
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-black placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Type Filter */}
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as "all" | "data" | "airtime")
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Product Types</option>
              <option value="data">Data Bundles</option>
              <option value="airtime">Airtime</option>
            </select>

            {/* Operator Filter */}
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Operators</option>
              {operators.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
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
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">
              No products found matching your criteria
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden bg-gray-900 transition-shadow hover:shadow-lg"
              >
                <div className="p-6 text-white">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-300">
                        {product.operator?.name || "Unknown Operator"}
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

                  {/* Product Code (Most Important for Resellers) */}
                  <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-900 p-3">
                    <p className="text-xs font-semibold tracking-wider text-yellow-300 uppercase">
                      API Product Code
                    </p>
                    <code className="font-mono text-base font-bold break-all text-yellow-100">
                      {product.productCode}
                    </code>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold tracking-wider text-gray-300 uppercase">
                      Price
                    </p>
                    {(() => {
                      const price = convertDenomAmountToNumber(
                        product.denomAmount
                      );
                      return price > 0 ? (
                        <p className="text-2xl font-bold text-green-400">
                          ₦{price.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-base text-gray-400 italic">
                          Variable/Range Product
                        </p>
                      );
                    })()}
                  </div>

                  {/* Details */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {product.dataMb && (
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-gray-300 uppercase">
                          Data
                        </p>
                        <p className="text-sm font-bold text-white">
                          {product.dataMb.toLocaleString()} MB
                        </p>
                      </div>
                    )}
                    {product.validityDays && (
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-gray-300 uppercase">
                          Validity
                        </p>
                        <p className="text-sm font-bold text-white">
                          {product.validityDays} days
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="border-t border-gray-700 pt-4">
                    <Badge
                      variant={product.isActive ? "default" : "destructive"}
                    >
                      {product.isActive ? "✓ Available" : "✗ Unavailable"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 text-lg font-bold text-blue-900">
            Using the Reseller API
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              ✓ Copy the <strong>Product Code</strong> from above
            </li>
            <li>
              ✓ Use it in your API request:{" "}
              <code className="rounded bg-white px-2 py-1 font-mono text-xs">
                product_code: "MTN_5GB_SME_SHARE"
              </code>
            </li>
            <li>
              ✓ Include your <strong>X-API-KEY</strong> and{" "}
              <strong>X-Idempotency-Key</strong> headers
            </li>
            <li>
              ✓ View the{" "}
              <a
                href="/reseller-api-docs"
                className="font-semibold underline hover:text-blue-900"
              >
                interactive API documentation
              </a>{" "}
              for complete integration details
            </li>
          </ul>
        </div>

        {/* Links */}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="/reseller-api-docs"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            View API Documentation
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-300"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
