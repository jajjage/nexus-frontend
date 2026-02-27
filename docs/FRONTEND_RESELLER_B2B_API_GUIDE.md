# Frontend Integration Guide: Reseller B2B API

This guide is for the frontend agent implementing reseller B2B purchase integration in dashboard/web app.

## Goal

Give reseller users a complete UI to:

- manage API keys,
- configure webhook endpoint + secret rotation,
- test/create purchases,
- monitor request status (pending to final),
- understand callback delivery state (admin/ops view).

---

## 1) Feature Gating and Access Rules

Use these checks before rendering UI:

- User role should be `reseller` (or allowed role from backend).
- User permissions must include `reseller.api_access`.

If permission is missing:

- hide API products section,
- show CTA: "Contact support to enable reseller API access."

---

## 2) Required Backend Endpoints

### Reseller dashboard/JWT endpoints

- `GET /api/v1/reseller/keys`
- `POST /api/v1/reseller/keys`
- `DELETE /api/v1/reseller/keys/:keyId`
- `GET /api/v1/reseller/api/webhook-config`
- `PUT /api/v1/reseller/api/webhook-config`
- `POST /api/v1/reseller/api/webhook-config/rotate-secret`

### Reseller API-key endpoints

- `POST /api/v1/reseller/api/purchases`
- `GET /api/v1/reseller/api/purchases/:requestId`

### Admin/ops endpoints (admin panel only)

- `GET /api/v1/admin/reseller-api/callbacks/overview`
- `GET /api/v1/admin/reseller-api/callbacks/deliveries`
- `GET /api/v1/admin/reseller-api/circuit-breakers`

---

## 3) UI Modules To Build

## A. API Key Management Screen

Actions:

- list keys (`GET /reseller/keys`)
- create key (`POST /reseller/keys`)
- revoke key (`DELETE /reseller/keys/:keyId`)

Important UX:

- show generated full key only once in secure modal.
- force copy/download action before closing modal.
- mask stored key values and show prefix only.

## B. Webhook Config Screen

Actions:

- load current config (`GET /reseller/api/webhook-config`)
- save URL + active toggle (`PUT /reseller/api/webhook-config`)
- rotate secret (`POST /reseller/api/webhook-config/rotate-secret`)

Important UX:

- URL validation before submit (http/https only).
- on first create and rotate: show secret once and warn user it cannot be re-shown.
- include "Test callback receiver" helper instructions for user.

## C. Purchase Test Console (Reseller API Playground)

Form fields:

- `productCode`
- `amount`
- `recipientPhone`
- `clientReference` (optional)
- `callbackUrl` (optional override)
- `waitForFinal` (toggle)
- `waitTimeoutMs` (number input)

Headers to send:

- `X-API-KEY`
- `X-Idempotency-Key` (generate UUID per submission unless user sets manual value)

Behavior:

- if response `202`, show status badge `pending` and start polling.
- if response `200`, show terminal status result.

## D. Purchase Status Monitor

For each request:

- show `requestId`, `status`, `isFinal`, `idempotencyKey`, `createdAt`.
- polling interval: 2-3 seconds while not final.
- stop polling when `isFinal === true`.
- show status timeline (created -> pending -> completed/failed/reversed).

---

## 4) State Management Contract

Use a normalized purchase type:

```ts
type PurchaseStatus = {
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

Store:

- `activeRequestId`
- `purchaseByRequestId`
- `pollingState`
- `lastError`

---

## 5) Error Mapping for Frontend

- `400`: invalid payload/missing idempotency key -> show form-level validation errors.
- `401`: invalid/expired auth -> force re-auth or key update.
- `403`: permission issue -> show access-block screen.
- `404`: unknown request id -> show "Request not found".
- `429`: throttle exceeded -> show retry with countdown.
- `503` with `code=CIRCUIT_OPEN`: show "Supplier temporarily unavailable, retry later."

---

## 6) Implementation Sequence (Suggested)

1. Build permission-aware navigation + reseller API section shell.
2. Implement API key management page.
3. Implement webhook config + rotate secret flow.
4. Build purchase console with idempotency key generation.
5. Add polling monitor and terminal status UI.
6. Add admin observability screens (if this frontend includes admin tools).

---

## 7) QA Checklist

- [ ] Reseller without `reseller.api_access` cannot access API UI.
- [ ] New API key displays only once.
- [ ] Webhook secret displays only on create/rotate.
- [ ] Duplicate idempotency key returns same order without duplicate effect.
- [ ] `waitForFinal=true` with short timeout falls back to `202` when still pending.
- [ ] Pending order transitions to final via polling.
- [ ] `503 CIRCUIT_OPEN` error renders correct retry messaging.
- [ ] Mobile view supports key copy, webhook form, and status cards.
