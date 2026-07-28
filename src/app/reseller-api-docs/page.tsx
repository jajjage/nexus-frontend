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
import { useState } from "react";

export default function ResellerApiDocsPage() {
  const docsUrl = "/api/v1/docs/reseller/openapi.json";
  const [activeTab, setActiveTab] = useState<
    "overview" | "catalog" | "purchases" | "webhooks" | "snippets"
  >("overview");
  const [activeLanguage, setActiveLanguage] = useState<
    "curl" | "node" | "python" | "php"
  >("curl");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.nexusdata.ng/api/v1/reseller/api/purchases \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: res_live_xxxxxxxxxxxxxxxx" \\
  -H "X-Idempotency-Key: tx_req_1234567890" \\
  -d '{
    "product_code": "MTN_5GB_SME_SHARE",
    "phone_number": "08012345678",
    "client_reference": "REF_998123"
  }'`,
    node: `import axios from 'axios';

const purchaseData = async () => {
  const response = await axios.post(
    'https://api.nexusdata.ng/api/v1/reseller/api/purchases',
    {
      product_code: 'MTN_5GB_SME_SHARE',
      phone_number: '08012345678',
      client_reference: 'REF_998123'
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'res_live_xxxxxxxxxxxxxxxx',
        'X-Idempotency-Key': \`tx_\${Date.now()}\`
      }
    }
  );
  console.log(response.data);
};`,
    python: `import requests
import time

url = "https://api.nexusdata.ng/api/v1/reseller/api/purchases"
headers = {
    "Content-Type": "application/json",
    "X-API-KEY": "res_live_xxxxxxxxxxxxxxxx",
    "X-Idempotency-Key": f"tx_{int(time.time())}"
}
payload = {
    "product_code": "MTN_5GB_SME_SHARE",
    "phone_number": "08012345678",
    "client_reference": "REF_998123"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    php: `<?php

$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.nexusdata.ng/api/v1/reseller/api/purchases",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode([
    "product_code" => "MTN_5GB_SME_SHARE",
    "phone_number" => "08012345678",
    "client_reference" => "REF_998123"
  ]),
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "X-API-KEY: res_live_xxxxxxxxxxxxxxxx",
    "X-Idempotency-Key: tx_" . time()
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
                        X-API-KEY
                      </code>
                      <span>
                        Your secret reseller API Key (e.g.,{" "}
                        <code className="font-mono text-xs">
                          res_live_xxxxxxxx
                        </code>
                        ).
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
    "purchaseEndpoint": "/api/v1/reseller/api/purchases",
    "purchaseField": "product_code"
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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-600 hover:bg-emerald-700">
                    POST
                  </Badge>
                  <code className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    /api/v1/reseller/api/purchases
                  </code>
                </div>
                <CardDescription className="mt-1">
                  Submit a fixed-price product purchase request using
                  product_code and phone_number.
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
