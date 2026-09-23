"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  Key,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type V1DataPlan = {
  dataPlan?: number | null;
  planType?: string | null;
  name: string;
  apiPrice?: number | null;
  priceTags?: { api?: number | string | null } | null;
  dataMb?: number | null;
  validityDays?: number | null;
  operator?: { name?: string; code?: string; networkId?: number | null } | null;
};

export default function ResellerApiDocsPage() {
  const docsUrl = "/api/v1/docs/reseller/openapi.json";
  const [activeTab, setActiveTab] = useState<
    "overview" | "catalog" | "purchases" | "webhooks" | "snippets"
  >("overview");
  const [activeLanguage, setActiveLanguage] = useState<
    "curl" | "node" | "python" | "php"
  >("curl");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState("all");
  const [planSearch, setPlanSearch] = useState("");
  const [dataPlans, setDataPlans] = useState<V1DataPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "catalog") return;
    let cancelled = false;
    setPlansLoading(true);
    fetch("/api/v1/products?productType=data&isActive=true&perPage=500")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setDataPlans(payload?.data?.products || []);
      })
      .catch(() => {
        if (!cancelled) setDataPlans([]);
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const planTypes = useMemo(
    () => Array.from(new Set(dataPlans.map((plan) => plan.planType).filter(Boolean))) as string[],
    [dataPlans]
  );
  const filteredPlans = useMemo(() => {
    const query = planSearch.trim().toLowerCase();
    return dataPlans.filter((plan) => {
      const typeMatches = selectedPlanType === "all" || plan.planType === selectedPlanType;
      const text = `${plan.dataPlan || ""} ${plan.name} ${plan.operator?.name || ""} ${plan.planType || ""}`.toLowerCase();
      return typeMatches && (!query || text.includes(query));
    });
  }, [dataPlans, planSearch, selectedPlanType]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.nexusdatasub.com/api/data \\
  -H "Authorization: Token nx_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "phone": "08012345678",
    "data_plan": 1,
    "bypass": false,
    "request-id": "Data_998123"
  }'`,
    node: `import axios from 'axios';

const purchaseData = async () => {
  const response = await axios.post(
    'https://api.nexusdatasub.com/api/data',
    {
      network: 1,
      phone: '08012345678',
      data_plan: 1,
      bypass: false,
      'request-id': 'Data_998123'
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Token nx_live_xxxxxxxxxxxxxxxx'
      }
    }
  );
  console.log(response.data);
};`,
    python: `import requests
import time

url = "https://api.nexusdatasub.com/api/data"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Token nx_live_xxxxxxxxxxxxxxxx"
}
payload = {
    "network": 1,
    "phone": "08012345678",
    "data_plan": 1,
    "bypass": False,
    "request-id": "Data_998123"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    php: `<?php

$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.nexusdatasub.com/api/data",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode([
    "network" => 1,
    "phone" => "08012345678",
    "data_plan" => 1,
    "bypass" => false,
    "request-id" => "Data_998123"
  ]),
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "Authorization: Token nx_live_xxxxxxxxxxxxxxxx"
  ],
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;`,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header Banner */}
      <div className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Code2 className="h-3.5 w-3.5" /> Developer & Reseller API
                Portal
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Reseller API Documentation
              </h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
                Complete REST API reference for automated data bundle & airtime
                fulfillment with multi-tenant isolation.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/reseller-products">
                  <Layers className="h-4 w-4" /> View Product Catalog
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <a href={docsUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open OpenAPI JSON
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Key className="h-4 w-4" /> Auth & Account
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "catalog"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className="h-4 w-4" /> Catalog Endpoints
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "purchases"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Zap className="h-4 w-4" /> Purchase & Status
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "webhooks"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <RefreshCw className="h-4 w-4" /> Webhooks & Callbacks
          </button>
          <button
            onClick={() => setActiveTab("snippets")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "snippets"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Terminal className="h-4 w-4" /> Code Examples
          </button>
        </div>

        {/* Tab 1: Overview & Auth */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card className="border-violet-200 dark:border-violet-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-violet-600">ADEX + MSORG</Badge>
                  <CardTitle className="text-xl">Supplier protocol compatibility</CardTitle>
                </div>
                <CardDescription>
                  Your integration always uses the Nexus V1 contract. We route
                  each API key to its configured child supplier and adapt the
                  request to ADEX or MSORG internally.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                    <h4 className="font-bold text-slate-900 dark:text-white">ADEX network IDs</h4>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">MTN 1 · AIRTEL 2 · GLO 3 · 9MOBILE 4</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <h4 className="font-bold text-slate-900 dark:text-white">MSORG network IDs</h4>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">MTN 1 · GLO 2 · 9MOBILE 3 · AIRTEL 4 · SMILE 5</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Stable public request contract</h4>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                    Send the same payload regardless of whether the supplier
                    child belongs to ADEX or MSORG.
                  </p>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100">{`POST /api/data
Authorization: Token nx_live_xxxxxxxxx
Content-Type: application/json

{
  "network": 1,
  "phone": "07062723822",
  "data_plan": 1,
  "bypass": false,
  "request-id": "Data_12345678900"
}`}</pre>
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100">{`POST /api/topup
Authorization: Token nx_live_xxxxxxxxx
Content-Type: application/json

{
  "network": 1,
  "phone": "08166990365",
  "plan_type": "VTU",
  "amount": 100,
  "bypass": false,
  "request-id": "Airtime_12345678900"
}`}</pre>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">ADEX child supplier payload</h4>
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400">{`Data: { "network": 1, "phone": "07062723822", "data_plan": 1, "bypass": false, "request-id": "Data_12345678900" }
Airtime: { "network": 1, "phone": "08166990365", "plan_type": "VTU", "amount": 100, "bypass": false, "request-id": "Airtime_12345678900" }`}</pre>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">MSORG child supplier payload</h4>
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400">{`Data: { "network": 1, "mobile_number": "09095263835", "plan": 166, "Ported_number": true }
Airtime: { "network": 2, "amount": "100", "mobile_number": "08162269770", "Ported_number": true, "airtime_type": "VTU" }`}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Normalized response for both protocols</h4>
                  <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400">{`{
  "network": "MTN",
  "request-id": "Data_12345678900",
  "amount": "254.4",
  "status": "success",
  "message": "Purchase completed",
  "response": "Purchase completed",
  "phone_number": "09095263835",
  "oldbal": "30177.0",
  "newbal": "29922.6",
  "system": "API",
  "plan_type": "DATA",
  "wallet_vending": "wallet"
}`}</pre>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <strong>Important:</strong> MSORG&apos;s <code>plan</code>, <code>mobile_number</code>, <code>Ported_number</code>, and <code>airtime_type</code> fields are supplier-side fields. Public API consumers should continue sending <code>data_plan</code>, <code>phone</code>, and <code>plan_type</code>. Responses remain normalized to the ADEX-style public response contract, with synchronous success/failure and status polling for pending requests.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  Authentication & Security Headers
                </CardTitle>
                <CardDescription>
                  All Reseller API calls are tenant-isolated and authenticated
                  using your API Key.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Required HTTP Headers
                  </h4>
                  <ul className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <code className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                        Authorization: Token
                      </code>
                      <span>
                        Your existing API key (e.g.,{" "}
                        <code className="font-mono text-xs">
                          nx_live_xxxxxxxx
                        </code>
                        ). <code className="font-mono text-xs">X-API-KEY</code> remains supported.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                        X-Idempotency-Key
                      </code>
                      <span>
                        Unique random string per transaction to ensure retry
                        safety and prevent duplicate billing.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                        Content-Type
                      </code>
                      <span>
                        Must be{" "}
                        <code className="font-mono text-xs">
                          application/json
                        </code>
                        .
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Account & Wallet Endpoints */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Account & Wallet Endpoints
                  </h3>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-600">GET</Badge>
                      <code className="font-mono text-base font-bold text-slate-900 dark:text-white">
                        /api/v1/reseller/api/account
                      </code>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Returns reseller profile details, wallet balance, active
                      API keys count, and available endpoint URLs.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-600">GET</Badge>
                      <code className="font-mono text-base font-bold text-slate-900 dark:text-white">
                        /api/v1/reseller/api/wallet
                      </code>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Dedicated endpoint returning real-time reseller wallet
                      balance and currency.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Catalog Endpoints */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-xl">V1 Data Plans</CardTitle>
                    <CardDescription>
                      Choose a plan type to find the public <code>data_plan</code> value used by <code>/api/data</code>.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="sr-only" htmlFor="plan-type-filter">Plan type</label>
                    <select
                      id="plan-type-filter"
                      value={selectedPlanType}
                      onChange={(event) => setSelectedPlanType(event.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="all">All plan types</option>
                      {planTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <label className="sr-only" htmlFor="plan-search">Search plans</label>
                    <input
                      id="plan-search"
                      value={planSearch}
                      onChange={(event) => setPlanSearch(event.target.value)}
                      placeholder="Search plans..."
                      className="h-10 w-48 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Data plan</th>
                        <th className="px-4 py-3">Network</th>
                        <th className="px-4 py-3">Plan type</th>
                        <th className="px-4 py-3">Bundle</th>
                        <th className="px-4 py-3">API price</th>
                        <th className="px-4 py-3">Validity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {plansLoading ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading data plans…</td></tr>
                      ) : filteredPlans.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No plans match this filter.</td></tr>
                      ) : filteredPlans.map((plan) => (
                        <tr key={`${plan.dataPlan}-${plan.operator?.code}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-300">{plan.dataPlan ?? "—"}</td>
                          <td className="px-4 py-3 font-semibold">{plan.operator?.name || plan.operator?.code || "—"}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{plan.planType || "—"}</Badge></td>
                          <td className="px-4 py-3">{plan.name}<span className="ml-1 text-xs text-slate-500">{plan.dataMb ? `(${plan.dataMb}MB)` : ""}</span></td>
                          <td className="px-4 py-3 font-semibold">{plan.apiPrice == null && plan.priceTags?.api == null ? "—" : `₦${Number(plan.apiPrice ?? plan.priceTags?.api).toLocaleString()}`}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{plan.validityDays ? `${plan.validityDays} days` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
                  Showing {filteredPlans.length} of {dataPlans.length} data plans. Use the displayed <code>data_plan</code> with the matching network ID.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Networks & Plans</CardTitle>
                <CardDescription>These public network IDs are used in both v1 purchase payloads.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[['9MOBILE', 4], ['AIRTEL', 2], ['GLO', 3], ['MTN', 1]].map(([network, id]) => (
                    <div key={network} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network</div>
                      <div className="mt-1 flex items-center justify-between"><span className="font-bold">{network}</span><code className="rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">{id}</code></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    /api/v1/reseller/api/products
                  </code>
                </div>
                <CardDescription className="mt-1">
                  List tenant products complete with reseller API pricing,
                  product codes, and network metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Query Parameters
                </h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  <p>• productType: "data" | "airtime"</p>
                  <p>• operatorCode: "MTN" | "GLO" | "AIRTEL" | "9MOBILE"</p>
                  <p>• categorySlug: "sme" | "gifting" | "corporate"</p>
                  <p>• q: search string (e.g. "5GB")</p>
                  <p>• page: page number (default: 1)</p>
                  <p>• perPage: items per page (default: 100, max: 500)</p>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sample Response (200 OK)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400">
                  <pre>{`{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_4a72d8dd-b0f1",
        "productCode": "MTN_5GB_SME_SHARE",
        "name": "MTN 5GB SME Share",
        "productType": "data",
        "apiPrice": 1500,
        "isFixedPrice": true,
        "dataMb": 5120,
        "validityDays": 30,
        "operator": { "name": "MTN", "code": "MTN" }
      }
    ],
    "pagination": { "page": 1, "perPage": 100, "total": 1 }
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    /api/v1/reseller/api/products/:productCode
                  </code>
                </div>
                <CardDescription className="mt-1">
                  Inspect single product details and reseller API price by
                  productCode.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400">
                  <pre>{`{
  "success": true,
  "data": {
    "productCode": "MTN_5GB_SME_SHARE",
    "name": "MTN 5GB SME Share",
    "apiPrice": 1500,
    "isFixedPrice": true,
    "purchaseEndpoint": "/api/data",
    "purchaseField": "data_plan"
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Purchase & Status */}
        {activeTab === "purchases" && (
          <div className="space-y-6">
            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">V1</Badge>
                  <CardTitle className="text-xl">New Data & Airtime API</CardTitle>
                </div>
                <CardDescription>
                  The v1 endpoints use network IDs, data plans, VTU airtime, and a literal request-id for idempotency. They are compatible with both ADEX and MSORG child suppliers; protocol selection is handled internally. See the protocol compatibility section in Auth & Account for network mappings and supplier payloads. The legacy reseller endpoint below remains available.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Available Parameters — data</h4>
                  <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400">{`{
  "network": 1,
  "phone": "234XXXXXXXXXX",
  "data_plan": 1,
  "bypass": false,
  "request-id": "Data_12345678900"
}`}</pre>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">POST /api/data</h4>
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100">{`curl -X POST "https://api.nexusdatasub.com/api/data" \\
  -H "Authorization: Token nx_live_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "phone": "07062723822",
    "data_plan": 1,
    "bypass": false,
    "request-id": "Data_12345678900"
  }'`}</pre>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">POST /api/topup</h4>
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100">{`curl -X POST "https://api.nexusdatasub.com/api/topup" \\
  -H "Authorization: Token nx_live_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "phone": "08166990365",
    "plan_type": "VTU",
    "amount": 100,
    "bypass": false,
    "request-id": "Airtime_12345678900"
  }'`}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Expected response</h4>
                  <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400">{`{
  "network": "MTN",
  "request-id": "Data_1234567890",
  "amount": 100,
  "dataplan": "500MB",
  "status": "success",
  "message": "Yello! You have gifted 500MB to 2347013397088.",
  "response": "Yello! You have gifted 500MB to 2347013397088.",
  "phone_number": "07013397088",
  "oldbal": 110325,
  "newbal": 110225,
  "system": "API",
  "plan_type": "GIFTING",
  "wallet_vending": "wallet"
}`}</pre>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Use a unique <code>request-id</code> for every purchase. Reusing the same ID with the same payload is safe; reusing it with different purchase details is rejected.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-600 hover:bg-slate-700">
                    LEGACY
                  </Badge>
                  <code className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    /api/v1/reseller/api/purchases
                  </code>
                </div>
                  <CardDescription className="mt-1">
                  Backward-compatible fixed-price purchase endpoint. New
                  integrations should use the V1 data/topup endpoints above.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Request Body (JSON)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-slate-100">
                  <pre>{`{
  "product_code": "MTN_5GB_SME_SHARE",
  "phone_number": "08012345678",
  "client_reference": "ORDER_REF_99120"
}`}</pre>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Response (200 / 202 Accepted)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400">
                  <pre>{`{
  "success": true,
  "message": "Purchase request accepted",
  "data": {
    "requestId": "req_8921a4f0-12ab",
    "status": "pending",
    "productCode": "MTN_5GB_SME_SHARE",
    "phoneNumber": "08012345678",
    "amount": 1500,
    "clientReference": "ORDER_REF_99120",
    "isFinal": false
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    /api/v1/reseller/api/purchases/:requestId
                  </code>
                </div>
                <CardDescription className="mt-1">
                  Poll purchase fulfillment status by external request ID.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-blue-300">
                  <pre>{`{
  "success": true,
  "data": {
    "requestId": "req_8921a4f0-12ab",
    "status": "completed",
    "isFinal": true,
    "productCode": "MTN_5GB_SME_SHARE",
    "recipientPhone": "08012345678",
    "amount": 1500
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    /api/v1/reseller/api/purchases/analytics/overview
                  </code>
                </div>
                <CardDescription className="mt-1">
                  Retrieve purchase status counts and volume analytics overview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-blue-300">
                  <pre>{`{
  "success": true,
  "data": {
    "totalCount": 150,
    "completedCount": 142,
    "failedCount": 8,
    "totalVolume": 225000
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Webhooks & Callbacks */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  Webhook Configuration & HMAC Signatures
                </CardTitle>
                <CardDescription>
                  Configure webhooks to receive real-time push notifications
                  when purchase transactions reach final status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Webhook Endpoints
                  </h4>
                  <ul className="mt-3 space-y-3 text-sm">
                    <li>
                      <Badge className="mr-2 bg-blue-600">GET</Badge>
                      <code className="font-mono font-bold text-slate-900 dark:text-white">
                        /api/v1/reseller/webhook-config
                      </code>{" "}
                      — Get current webhook status & URL.
                    </li>
                    <li>
                      <Badge className="mr-2 bg-emerald-600">POST</Badge>
                      <code className="font-mono font-bold text-slate-900 dark:text-white">
                        /api/v1/reseller/webhook-config
                      </code>{" "}
                      — Register/update callback URL (
                      <code className="font-mono text-xs font-bold">
                        {'{ "callbackUrl": "https://yourdomain.com/webhook" }'}
                      </code>
                      ).
                    </li>
                    <li>
                      <Badge className="mr-2 bg-purple-600">POST</Badge>
                      <code className="font-mono font-bold text-slate-900 dark:text-white">
                        /api/v1/reseller/webhook-config/secret/rotate
                      </code>{" "}
                      — Generate new HMAC secret.
                    </li>
                  </ul>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Webhook Payload Example
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-slate-100">
                  <pre>{`{
  "event": "purchase.status_changed",
  "deliveryId": "del_7781a-9920",
  "timestamp": "2026-07-28T15:00:00.000Z",
  "data": {
    "requestId": "req_8921a4f0-12ab",
    "status": "completed",
    "isFinal": true,
    "productCode": "MTN_5GB_SME_SHARE",
    "amount": 1500,
    "recipientPhone": "08012345678"
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 5: Code Examples */}
        {activeTab === "snippets" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Integration Code Snippets</CardTitle>
                  <CardDescription>
                    Copy ready-to-run code samples for your preferred language.
                  </CardDescription>
                </div>
                <div className="mt-4 flex gap-2 sm:mt-0">
                  {(["curl", "node", "python", "php"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLanguage(lang)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                        activeLanguage === lang
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <button
                  onClick={() =>
                    copyToClipboard(
                      codeSnippets[activeLanguage],
                      activeLanguage
                    )
                  }
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                >
                  {copiedSnippet === activeLanguage ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Code
                    </>
                  )}
                </button>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-5 font-mono text-sm text-slate-100">
                  <pre>{codeSnippets[activeLanguage]}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
