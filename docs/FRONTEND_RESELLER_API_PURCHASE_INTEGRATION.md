# Frontend Reseller API Integration Guide

This guide shows frontend developers how to integrate the Reseller API purchase functionality into your React components.

---

## Table of Contents

1. [API Contract Overview](#api-contract-overview)
2. [Product Discovery](#product-discovery)
3. [Creating Purchases](#creating-purchases)
4. [Polling Status](#polling-status)
5. [Error Handling](#error-handling)
6. [UI Components Example](#ui-components-example)
7. [Complete Example](#complete-example)

---

## API Contract Overview

### Base URL

- Base API: `/api/v1`
- Reseller OpenAPI Spec: `/api/v1/docs/reseller/openapi.json`
- Reseller docs page: `/reseller-api-docs` (public)

### Authentication

The **Reseller API purchase endpoints** use API key authentication:

```http
X-API-KEY: <reseller_api_key>
X-Idempotency-Key: <unique_uuid_per_attempt>
Content-Type: application/json
```

---

## Product Discovery

### Fetch Products

Use the public product endpoint to discover available products. Filter for fixed-price products only (for Reseller API support).

#### Using the Hook

```typescript
import { useProducts } from '@/hooks/useProducts';
import { isFixedPriceProduct } from '@/utils/reseller-products';

export function ProductCatalog() {
  const { data, isLoading } = useProducts({
    productType: 'data',
    isActive: true,
    perPage: 100,
  });

  if (isLoading) return <div>Loading products...</div>;

  // Filter to only fixed-price products (Reseller API compatible)
  const fixedPriceProducts = data?.products.filter(isFixedPriceProduct) || [];

  return (
    <div>
      {fixedPriceProducts.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Price: {product.denomAmount}</p>
          <p>Data: {product.dataMb}MB</p>
          <p>Validity: {product.validityDays} days</p>
        </div>
      ))}
    </div>
  );
}
```

### Product Fields Reference

Product returned from `GET /api/v1/products`:

```typescript
type PublicProduct = {
  id: string;
  operatorId: string;
  productCode: string;
  name: string;
  productType: "airtime" | "data" | string;
  denomAmount: number | null; // Fixed price (null = variable/range)
  minAmount?: number; // For variable products
  maxAmount?: number; // For variable products
  discountedPrice?: number; // After offer applied
  dataMb: number | null; // For data products
  validityDays: number | null; // For data products
  isActive: boolean;
  metadata: Record<string, unknown>;
  slug?: string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  operator?: {
    name: string;
    code: string;
    countryCode?: string;
    logoUrl?: string;
  } | null;
};
```

### Purchase Eligibility Check

```typescript
import {
  isFixedPriceProduct,
  getProductPurchaseBlockReason,
} from "@/utils/reseller-products";

// Simple check
if (isFixedPriceProduct(product)) {
  // Can purchase via Reseller API
}

// Get reason if blocked
const blockReason = getProductPurchaseBlockReason(product);
if (blockReason) {
  console.log(`Cannot purchase: ${blockReason}`);
}
```

---

## Creating Purchases

### Request Payload

Create a purchase using the Reseller API with an API key:

```typescript
import { useCreateApiPurchase } from "@/hooks/useReseller";
import type { CreateApiPurchaseRequest } from "@/types/reseller.types";

const { mutate, isPending } = useCreateApiPurchase();

const handlePurchase = (
  apiKey: string,
  idempotencyKey: string,
  productCode: string,
  phoneNumber: string,
  customerRef: string
) => {
  const payload: CreateApiPurchaseRequest = {
    product_code: productCode,
    phone_number: phoneNumber,
    customer_reference: customerRef,
    // NOTE: Do NOT send 'amount' - backend resolves it from product_code
  };

  mutate(
    {
      payload,
      headers: {
        apiKey,
        idempotencyKey,
      },
      options: {
        waitForFinal: false, // false = get 202 immediately
        waitTimeoutMs: 0, // Don't wait for completion
      },
    },
    {
      onSuccess: (response) => {
        console.log("Purchase created:", response.data);
        const { requestId, status, isFinal } = response.data;

        if (isFinal) {
          console.log("Purchase completed:", status);
        } else {
          console.log("Purchase pending, poll requestId:", requestId);
        }
      },
      onError: (error) => {
        console.error("Purchase failed:", error);
      },
    }
  );
};
```

### Query Parameters

- `waitForFinal=true|false` - If true, wait for completion (timeout in waitTimeoutMs)
- `waitTimeoutMs=0..30000` - Max time to wait for completion

### Response Contract

**202 Accepted** (Purchase pending):

```json
{
  "success": true,
  "message": "Purchase request accepted",
  "data": {
    "requestId": "f4f4915f-2b95-4e3d-8f06-8c5f54126ab1",
    "topupRequestId": "2f016fcb-a9f5-4f7e-aa7a-00f9f2f3dcf5",
    "status": "pending",
    "isFinal": false,
    "idempotencyKey": "9a8f1331-7ec0-4ff6-b45b-4f6fa8e8d7ca",
    "clientReference": "partner-order-10001",
    "amount": 3500,
    "productCode": "MTN_5GB_SME_SHARE",
    "recipientPhone": "08011112222",
    "createdAt": "2026-03-30T09:15:11.000Z",
    "updatedAt": "2026-03-30T09:15:11.000Z"
  },
  "statusCode": 202
}
```

**200 OK** (Purchase completed):

```json
{
  "success": true,
  "message": "Purchase request completed",
  "data": {
    "requestId": "f4f4915f-2b95-4e3d-8f06-8c5f54126ab1",
    "status": "completed",
    "isFinal": true
    // ... rest of fields
  },
  "statusCode": 200
}
```

---

## Polling Status

### Poll for Completion

After receiving a 202, poll the status endpoint until `isFinal === true`:

```typescript
import { useApiPurchaseStatus } from '@/hooks/useReseller';

export function PurchaseStatusView({
  requestId,
  apiKey,
}: {
  requestId: string;
  apiKey: string;
}) {
  const { data, isLoading, error } = useApiPurchaseStatus(
    requestId,
    apiKey,
    {
      enabled: !!requestId && !!apiKey,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  );

  const purchase = data?.data;

  if (isLoading) return <div>Loading status...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!purchase) return <div>No data</div>;

  return (
    <div>
      <p>Status: {purchase.status}</p>
      <p>Amount: {purchase.amount}</p>
      <p>Phone: {purchase.recipientPhone}</p>

      {!purchase.isFinal && (
        <div className="animate-spin">Waiting for completion...</div>
      )}

      {purchase.isFinal && (
        <>
          {['success', 'completed'].includes(purchase.status) && (
            <div className="text-green-600">✓ Purchase successful!</div>
          )}
          {['failed', 'cancelled', 'reversed'].includes(purchase.status) && (
            <div className="text-red-600">✗ Purchase failed: {purchase.status}</div>
          )}
        </>
      )}
    </div>
  );
}

// Stop polling when isFinal is true
const { data } = useApiPurchaseStatus(requestId, apiKey, {
  enabled: !!requestId && !!apiKey && !currentPurchase?.isFinal,
  refetchInterval: currentPurchase?.isFinal ? false : 2000,
});
```

### Final Statuses

Stop polling when you receive one of these:

- `success` ✓
- `completed` ✓
- `failed` ✗
- `cancelled` ✗
- `reversed` ✗
- `isFinal === true` (any status)

---

## Error Handling

### Error Map

Use the error handling utility to map errors:

```typescript
import { mapResellerApiError } from '@/hooks/useReseller';
import { AxiosError } from 'axios';

catch (error: AxiosError) {
  const errorInfo = mapResellerApiError(error);

  if (errorInfo.status === 400) {
    console.error('Validation error:', errorInfo.message);
    // Invalid product_code, missing idempotency key, variable product sent
  }

  if (errorInfo.status === 401) {
    console.error('Auth failed:', errorInfo.message);
    // Invalid/missing API key
  }

  if (errorInfo.status === 403) {
    console.error('Permission denied:', errorInfo.message);
    // Missing reseller.api_access permission
  }

  if (errorInfo.status === 404) {
    console.error('Not found:', errorInfo.message);
    // product_code not found, inactive, or requestId not found
  }

  if (errorInfo.status === 409) {
    console.error('Ambiguous product:', errorInfo.message);
    // Ambiguous fixed product resolution
  }

  if (errorInfo.status === 429) {
    console.error('Rate limited:', errorInfo.retryAfterSeconds);
    // Too many requests
  }

  if (errorInfo.status === 503) {
    console.error('Supplier unavailable:', errorInfo.message);
    // Circuit breaker open
  }
}
```

---

## UI Components Example

### Purchase Form Component

```typescript
import { useState } from 'react';
import { useCreateApiPurchase } from '@/hooks/useReseller';
import { isFixedPriceProduct } from '@/utils/reseller-products';
import type { PublicProduct } from '@/types/product.types';
import { v4 as uuidv4 } from 'uuid';

interface ResellerPurchaseFormProps {
  product: PublicProduct;
  apiKey: string;
  onSuccess: (requestId: string) => void;
}

export function ResellerPurchaseForm({
  product,
  apiKey,
  onSuccess,
}: ResellerPurchaseFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const { mutate, isPending } = useCreateApiPurchase();

  const canPurchase = isFixedPriceProduct(product);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPurchase) {
      alert('This product cannot be purchased via Reseller API');
      return;
    }

    const idempotencyKey = uuidv4();

    mutate(
      {
        payload: {
          product_code: product.productCode,
          phone_number: phoneNumber,
          customer_reference: customerRef,
        },
        headers: {
          apiKey,
          idempotencyKey,
        },
        options: {
          waitForFinal: false,
        },
      },
      {
        onSuccess: (response) => {
          const requestId = response.data.requestId;
          onSuccess(requestId);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Product: {product.name}</label>
        <p>Price: ₦{product.denomAmount}</p>
      </div>

      <div>
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="080..."
          required
          disabled={!canPurchase}
        />
      </div>

      <div>
        <label htmlFor="customerRef">Customer Reference</label>
        <input
          id="customerRef"
          type="text"
          value={customerRef}
          onChange={(e) => setCustomerRef(e.target.value)}
          placeholder="Order ID or reference"
          required
          disabled={!canPurchase}
        />
      </div>

      <button type="submit" disabled={isPending || !canPurchase}>
        {isPending ? 'Processing...' : 'Purchase'}
      </button>

      {!canPurchase && (
        <p className="text-red-600">Variable/unsupported product</p>
      )}
    </form>
  );
}
```

---

## Complete Example

### Full Purchase Flow Component

```typescript
'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCreateApiPurchase, useApiPurchaseStatus } from '@/hooks/useReseller';
import { isFixedPriceProduct } from '@/utils/reseller-products';
import type { PublicProduct } from '@/types/product.types';
import { v4 as uuidv4 } from 'uuid';

export function ResellerPurchaseFlow() {
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);

  // Step 1: Fetch products
  const { data: productData, isLoading: productsLoading } = useProducts({
    productType: 'data',
    isActive: true,
    perPage: 50,
  });

  const fixedProducts =
    productData?.products.filter(isFixedPriceProduct) || [];

  // Step 2: Create purchase
  const { mutate: createPurchase, isPending: isCreating } =
    useCreateApiPurchase();

  const handleCreatePurchase = () => {
    if (!selectedProduct || !isFixedPriceProduct(selectedProduct)) {
      alert('Please select a valid product');
      return;
    }

    createPurchase(
      {
        payload: {
          product_code: selectedProduct.productCode,
          phone_number: phoneNumber,
          customer_reference: customerRef,
        },
        headers: {
          apiKey,
          idempotencyKey: uuidv4(),
        },
        options: { waitForFinal: false },
      },
      {
        onSuccess: (response) => {
          setRequestId(response.data.requestId);
        },
      }
    );
  };

  // Step 3: Poll status
  const { data: statusData, isLoading: statusLoading } = useApiPurchaseStatus(
    requestId || '',
    apiKey,
    {
      enabled: !!requestId,
      refetchInterval: requestId
        ? statusData?.data.isFinal
          ? false
          : 2000
        : false,
    }
  );

  const purchase = statusData?.data;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Step 1: Select Product */}
      {!requestId && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Select Product</h2>

          {productsLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="grid gap-4">
              {fixedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border cursor-pointer rounded ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <h3 className="font-semibold">{product.name}</h3>
                  <p>₦{product.denomAmount}</p>
                  {product.dataMb && <p>{product.dataMb}MB</p>}
                </div>
              ))}
            </div>
          )}

          {/* API Key and Purchase Form */}
          {selectedProduct && (
            <div className="mt-6 p-4 border border-gray-200 rounded">
              <div className="mb-4">
                <label className="block font-semibold mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Your reseller API key"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="08011112222"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">
                  Customer Reference
                </label>
                <input
                  type="text"
                  value={customerRef}
                  onChange={(e) => setCustomerRef(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Order ID or reference"
                />
              </div>

              <button
                onClick={handleCreatePurchase}
                disabled={isCreating || !apiKey || !phoneNumber}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
              >
                {isCreating ? 'Creating purchase...' : 'Create Purchase'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Purchase Status */}
      {requestId && purchase && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Purchase Status</h2>

          <div className="p-4 border border-gray-200 rounded">
            <div className="grid gap-2 mb-4">
              <p>
                <span className="font-semibold">Status:</span> {purchase.status}
              </p>
              <p>
                <span className="font-semibold">Request ID:</span>{' '}
                {purchase.requestId}
              </p>
              <p>
                <span className="font-semibold">Amount:</span> ₦{purchase.amount}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{' '}
                {purchase.recipientPhone}
              </p>
            </div>

            {!purchase.isFinal && (
              <div className="text-blue-600 flex items-center gap-2">
                <div className="animate-spin">⟳</div>
                <span>Waiting for completion...</span>
              </div>
            )}

            {purchase.isFinal && (
              <div>
                {['success', 'completed'].includes(purchase.status) ? (
                  <div className="text-green-600 font-semibold">
                    ✓ Purchase successful!
                  </div>
                ) : (
                  <div className="text-red-600 font-semibold">
                    ✗ Purchase {purchase.status}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setRequestId(null);
              setSelectedProduct(null);
              setPhoneNumber('');
              setCustomerRef('');
            }}
            className="mt-4 px-4 py-2 border rounded"
          >
            Start New Purchase
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Integration Checklist

When implementing Reseller API purchases:

- [ ] Import hooks: `useProducts`, `useCreateApiPurchase`, `useApiPurchaseStatus`
- [ ] Check product eligibility: use `isFixedPriceProduct()`
- [ ] Pass correct headers: `X-API-KEY`, `X-Idempotency-Key`
- [ ] Don't send `amount` in purchase request
- [ ] Generate unique idempotency key per attempt (use UUID)
- [ ] Handle 202 (pending) and poll for completion
- [ ] Implement error handling via `mapResellerApiError()`
- [ ] Show UI feedback for pending, success, and failed states
- [ ] Stop polling when `isFinal === true`
- [ ] Support data products (and fixed-price airtime when available)
- [ ] Block variable/range airtime products in UI

---

## API Responses Quick Reference

| Status | Meaning                   | Action                                   |
| ------ | ------------------------- | ---------------------------------------- |
| 200 OK | Purchase completed        | Stop polling, show success/failure state |
| 202    | Purchase pending          | Start polling with `requestId`           |
| 400    | Invalid request           | Check payload, product_code, headers     |
| 401    | Invalid API key           | Verify X-API-KEY header                  |
| 403    | Permission denied         | User needs `reseller.api_access`         |
| 404    | Product/request not found | Verify product_code or requestId         |
| 409    | Ambiguous product         | Use different product_code               |
| 429    | Rate limited              | Retry after delay                        |
| 503    | Supplier unavailable      | Circuit breaker open, retry later        |

---

## See Also

- [Reseller OpenAPI Spec](/api/v1/docs/reseller/openapi.json)
- [Interactive Swagger UI](/reseller-api-docs)
- [Product Utility Functions](../src/utils/reseller-products.ts)
- [Reseller Service](../src/services/reseller.service.ts)
- [Reseller Hooks](../src/hooks/useReseller.ts)
