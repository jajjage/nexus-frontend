# Reseller Purchase Analytics Endpoints

This document defines the new analytics endpoints for reseller API purchases and explains how frontend apps should integrate them.

## Purpose

Track reseller API purchase outcomes by status:

- `success`
- `failed`
- `pending`
- `reversed`

Status normalization rule used by backend:

- `completed` is counted as `success`.

Data source precedence:

1. `topup_requests.status` (when linked row exists)
2. `reseller_api_orders.status_snapshot`
3. fallback: `pending`

## 1) Admin Endpoint

- Method/Path: `GET /api/v1/admin/analytics/reseller-api/purchases/overview`
- Auth: Admin JWT (`Authorization: Bearer <token>`)
- Permission: `analytics.view_transactions`

### Query Parameters

- `fromDate` (optional): `YYYY-MM-DD`
- `toDate` (optional): `YYYY-MM-DD`
- `userId` (optional): reseller user id filter

If no dates are provided, backend returns all-time data.

### Response Shape

```json
{
  "success": true,
  "message": "Reseller API purchase analytics retrieved successfully",
  "data": {
    "period": {
      "fromDate": "2026-03-01",
      "toDate": "2026-03-31"
    },
    "scope": {
      "userId": "optional-reseller-user-id"
    },
    "totals": {
      "totalRequests": 250,
      "totalAmount": 188000
    },
    "breakdownByStatus": {
      "success": 200,
      "failed": 20,
      "pending": 25,
      "reversed": 5
    },
    "amountByStatus": {
      "success": 160000,
      "failed": 15000,
      "pending": 10000,
      "reversed": 3000
    },
    "derived": {
      "successRate": "80.0%"
    }
  }
}
```

## 2) Reseller Self Endpoint

- Method/Path: `GET /api/v1/reseller/api/purchases/analytics/overview`
- Auth: Reseller JWT only (`Authorization: Bearer <token>`)
- Permission: `reseller.api_access`

### Query Parameters

- `fromDate` (optional): `YYYY-MM-DD`
- `toDate` (optional): `YYYY-MM-DD`

This endpoint is always scoped to the authenticated reseller user.

### Response Shape

Same shape as admin endpoint.

## Validation and Error Rules

- Invalid date format returns `400`:
  - `fromDate` and `toDate` must be `YYYY-MM-DD`.
- Invalid range returns `400`:
  - `fromDate` cannot be greater than `toDate`.
- Missing/invalid auth token returns `401`.
- Missing permission returns `403`.

## Frontend Integration Guide

## A) Admin dashboard integration

Use this endpoint for:

- global reseller API health summary
- per-reseller drill-down (using `userId`)

Recommended UI cards:

- Total requests
- Total amount
- Success rate
- Status counts
- Amount by status

Recommended charts:

- Donut chart: `breakdownByStatus`
- Bar chart: `amountByStatus`

## B) Reseller dashboard integration

Use self endpoint for:

- reseller account-level API purchase performance
- date-range filtering for recent activity

Recommended UI:

- Summary cards using `totals` and `derived.successRate`
- Status chips from `breakdownByStatus`
- Amount distribution from `amountByStatus`

## C) Query behavior

- Default load:
  - Call endpoint without `fromDate`/`toDate` for all-time.
- Date filter flow:
  - Send both `fromDate` and `toDate` as `YYYY-MM-DD`.
  - Validate on frontend before request.

## D) TypeScript frontend model

```ts
type ResellerPurchaseAnalytics = {
  period: {
    fromDate: string | null;
    toDate: string | null;
  };
  scope: {
    userId: string | null;
  };
  totals: {
    totalRequests: number;
    totalAmount: number;
  };
  breakdownByStatus: {
    success: number;
    failed: number;
    pending: number;
    reversed: number;
  };
  amountByStatus: {
    success: number;
    failed: number;
    pending: number;
    reversed: number;
  };
  derived: {
    successRate: string;
  };
};
```

## E) Client-side handling notes

- Do not recalculate `successRate` on frontend unless needed for custom formatting; backend already returns normalized value.
- Show numeric values directly; amount fields are already rounded to 2 decimals by backend.
- `totalRequests` includes all statuses in range. Status buckets include only:
  - `success` (including `completed`)
  - `failed`
  - `pending`
  - `reversed`

## F) Example fetch calls

Admin:

```ts
await api.get("/admin/analytics/reseller-api/purchases/overview", {
  params: { fromDate: "2026-03-01", toDate: "2026-03-31", userId },
});
```

Reseller self:

```ts
await api.get("/reseller/api/purchases/analytics/overview", {
  params: { fromDate: "2026-03-01", toDate: "2026-03-31" },
});
```

## G) QA checklist

- Admin endpoint works with and without `userId`.
- Reseller endpoint only returns authenticated reseller scope.
- `completed` records are counted in `success`.
- Invalid date format/range shows backend `400` message in UI.
- Unauthorized users cannot access endpoint data.
