# Frontend Integration: Reseller Purchase API (Updated Contract)

This guide explains how frontend should integrate the updated reseller purchase API after recent backend changes.

## What Changed

The purchase request payload is now minimal and backend-priced.

- Removed from request body: `amount`, `callbackUrl`, `callback_url`, camelCase legacy fields.
- Required request body fields now:
  - `product_code`
  - `customer_reference`
  - `phone_number`
- Backend resolves amount from `product_code` (fixed-price only).

## Endpoints

### 1) Create purchase

- `POST /api/v1/reseller/api/purchases`
- Auth: `X-API-KEY`
- Required header: `X-Idempotency-Key`
- Optional query:
  - `waitForFinal=true|false`
  - `waitTimeoutMs=0..30000`

Request:

```json
{
  "product_code": "MTN-DATA-1GB",
  "customer_reference": "order-123",
  "phone_number": "08011112222"
}
```

### 2) Poll purchase status

- `GET /api/v1/reseller/api/purchases/:requestId`
- Auth: `X-API-KEY`

### 3) Webhook config (dashboard JWT flow, not API key)

- `GET /api/v1/reseller/api/webhook-config`
- `PUT /api/v1/reseller/api/webhook-config`
- `POST /api/v1/reseller/api/webhook-config/rotate-secret`

Do not send callback URL in purchase request. Configure it here instead.

## Frontend Request Contract

Use this request type for purchase creation:

```ts
type CreateResellerPurchaseRequest = {
  product_code: string;
  customer_reference: string;
  phone_number: string;
};
```

Use this response type:

```ts
type ResellerPurchaseStatus = {
  requestId: string;
  topupRequestId: string | null;
  status: string;
  isFinal: boolean;
  idempotencyKey: string;
  clientReference: string | null;
  callbackConfigured: boolean;
  callbackUrl: string | null;
  amount: number;
  productCode: string;
  recipientPhone: string;
  createdAt: string;
  updatedAt: string;
};
```

## UI Behavior

1. User selects product and enters phone number.
2. FE sends only `product_code`, `customer_reference`, `phone_number`.
3. FE generates a unique `X-Idempotency-Key` per submit.
4. If create returns `202`, start polling `/purchases/:requestId` every 2-3s until `isFinal=true`.
5. If create returns `200`, render final status immediately.

## Error Handling Map

- `400`: invalid payload, missing idempotency key, or range/dynamic product code.
- `401`: invalid/missing API key.
- `403`: missing `reseller.api_access`.
- `404`: unknown/inactive `product_code` or unknown `requestId`.
- `409`: ambiguous product mapping for `product_code`.
- `503` (`CIRCUIT_OPEN`): supplier unavailable; show retry message.

## Migration Notes (From Old Frontend)

Remove these fields from purchase body immediately:

- `productCode`
- `recipientPhone`
- `clientReference`
- `amount`
- `callbackUrl`
- `callback_url`

Replace with:

- `product_code`
- `customer_reference`
- `phone_number`

## Integration Checklist

- Purchase form sends new snake_case payload only.
- Idempotency header is always present.
- Polling is enabled for non-final responses.
- UI displays backend `amount` from response (not client-calculated amount).
- Webhook URL management uses webhook-config endpoints, not purchase payload.
