# Frontend Agent Withdrawal Web Guide

## Audience

This guide is for the web frontend team.

It covers:

- user withdrawal to wallet
- user withdrawal request to bank
- admin review and processing of bank withdrawal requests

All routes below are already mounted in `src/app.ts` under `/api/v1/dashboard`.

---

## 1. Core Rule To Understand First

There are now two withdrawal paths:

1. `wallet`
   The withdrawal is processed immediately and the agent wallet is credited right away.

2. `bank`
   The user only creates a withdrawal request.
   Admin later moves it through `pending -> processing -> success` or `failed`.
   The agent commission balance is deducted only when admin marks the request as `success`.

Important frontend implication:

- `pending` and `processing` bank requests do not reserve funds on the backend
- do not subtract pending bank requests from the displayed available balance unless product explicitly wants a frontend-only "requested total" indicator

---

## 2. Endpoints

### User-facing

- `GET /api/v1/dashboard/agent/available-balance`
- `POST /api/v1/dashboard/agent/withdraw`
- `GET /api/v1/dashboard/agent/bank-withdrawals?page=1&limit=20&status=pending`

### Admin-facing

- `GET /api/v1/dashboard/agents/bank-withdrawals?page=1&limit=20&status=pending&agentUserId=<id>`
- `PATCH /api/v1/dashboard/agents/bank-withdrawals/:withdrawalRequestId`

### Auth

- all endpoints require the normal dashboard JWT/cookie auth flow
- admin endpoints require `manage_agents` permission or `admin` role

---

## 3. Shared Response Shape

Successful responses use:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "statusCode": 200
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error message",
  "errors": [],
  "statusCode": 400
}
```

Frontend should display `message`.

---

## 4. User Flow

## 4.1 Recommended screens

- `Agent Wallet Withdraw Modal`
- `Agent Bank Withdraw Modal`
- `Agent Bank Withdrawal History Table`

Recommended dashboard sections:

- available balance card
- withdraw CTA
- method selector: `Wallet` or `Bank`
- bank request history with status badge

---

## 4.2 Wallet withdrawal

### Request

```http
POST /api/v1/dashboard/agent/withdraw
Content-Type: application/json
```

```json
{
  "method": "wallet",
  "amount": 500
}
```

Optional targeted withdrawal:

```json
{
  "method": "wallet",
  "amount": 500,
  "specificCommissionIds": ["commission-id-1", "commission-id-2"]
}
```

### Success response

```json
{
  "success": true,
  "message": "Successfully withdrawn $500.00 from 3 commission(s)",
  "data": {
    "success": true,
    "totalWithdrawn": 500,
    "withdrawals": [
      {
        "commissionId": "uuid",
        "amountWithdrawn": 200,
        "status": "withdrawn"
      }
    ],
    "message": "Successfully withdrawn $500.00 from 3 commission(s)"
  },
  "statusCode": 200
}
```

### UX behavior

- show success toast
- refetch:
  - agent stats
  - available balance
  - commissions list
- no admin action is needed

---

## 4.3 Bank withdrawal request

### Request

```http
POST /api/v1/dashboard/agent/withdraw
Content-Type: application/json
```

```json
{
  "method": "bank",
  "amount": 500,
  "bankName": "Access Bank",
  "bankCode": "044",
  "accountName": "John Agent",
  "accountNumber": "0123456789",
  "narration": "Weekly commission payout",
  "requestNotes": "Please process before Friday"
}
```

Optional targeted withdrawal:

```json
{
  "method": "bank",
  "amount": 500,
  "bankName": "Access Bank",
  "accountName": "John Agent",
  "accountNumber": "0123456789",
  "specificCommissionIds": ["commission-id-1", "commission-id-2"],
  "metadata": {
    "source": "web-dashboard"
  }
}
```

### Required fields for bank method

- `amount`
- `bankName`
- `accountName`
- `accountNumber`

### Success response

```json
{
  "success": true,
  "message": "Agent bank withdrawal request created successfully",
  "data": {
    "request": {
      "id": "uuid",
      "agentUserId": "uuid",
      "amount": 500,
      "status": "pending",
      "bankName": "Access Bank",
      "bankCode": "044",
      "accountName": "John Agent",
      "accountNumber": "0123456789",
      "narration": "Weekly commission payout",
      "requestNotes": "Please process before Friday",
      "adminNotes": null,
      "failureReason": null,
      "processedBreakdown": null,
      "requestedAt": "2026-04-19T12:00:00.000Z"
    },
    "availableBalance": 1200
  },
  "statusCode": 201
}
```

### UX behavior

- show success toast: `Bank withdrawal request submitted`
- append the new request to history
- keep available balance driven by backend `GET /agent/available-balance`
- explain in UI: `Your balance is deducted only after admin approves and completes the transfer`

---

## 4.4 Fetch bank withdrawal history

### Request

```http
GET /api/v1/dashboard/agent/bank-withdrawals?page=1&limit=20&status=pending
```

### Response shape

```json
{
  "success": true,
  "message": "Agent bank withdrawal requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": "uuid",
        "agentUserId": "uuid",
        "amount": 500,
        "status": "processing",
        "bankName": "Access Bank",
        "bankCode": "044",
        "accountName": "John Agent",
        "accountNumber": "0123456789",
        "narration": "Weekly payout",
        "requestNotes": "Urgent",
        "adminNotes": "Transfer queued",
        "failureReason": null,
        "processedBy": "admin-user-id",
        "specificCommissionIds": null,
        "processedBreakdown": null,
        "metadata": {
          "requestedVia": "agent_dashboard"
        },
        "requestedAt": "2026-04-19T12:00:00.000Z",
        "processedAt": null,
        "createdAt": "2026-04-19T12:00:00.000Z",
        "updatedAt": "2026-04-19T12:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  },
  "statusCode": 200
}
```

### Recommended status badges

- `pending`: gray or amber
- `processing`: blue
- `success`: green
- `failed`: red

### Recommended table columns

- request date
- amount
- bank name
- account number masked
- account name
- status
- narration
- request notes
- admin notes
- failure reason

Mask account number in the list view. Show full value only inside a protected detail drawer if product wants that.

---

## 5. Web API helpers

```ts
// src/lib/agentWithdrawal.ts
import { apiFetch } from "./api";

export function getAgentAvailableBalance() {
  return apiFetch("/api/v1/dashboard/agent/available-balance");
}

export function withdrawToWallet(
  amount: number,
  specificCommissionIds?: string[]
) {
  return apiFetch("/api/v1/dashboard/agent/withdraw", {
    method: "POST",
    body: JSON.stringify({
      method: "wallet",
      amount,
      specificCommissionIds,
    }),
  });
}

export function requestBankWithdrawal(payload: {
  amount: number;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  narration?: string;
  requestNotes?: string;
  specificCommissionIds?: string[];
  metadata?: Record<string, unknown>;
}) {
  return apiFetch("/api/v1/dashboard/agent/withdraw", {
    method: "POST",
    body: JSON.stringify({
      method: "bank",
      ...payload,
    }),
  });
}

export function getAgentBankWithdrawals(params?: {
  page?: number;
  limit?: number;
  status?: "pending" | "processing" | "success" | "failed";
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch(`/api/v1/dashboard/agent/bank-withdrawals${suffix}`);
}
```

---

## 6. Admin Panel Flow

## 6.1 Recommended screens

- `Agent Bank Withdrawals List`
- `Agent Bank Withdrawal Details Drawer`
- `Agent Bank Withdrawal Processing Action Bar`

Recommended filters:

- status
- agent user id
- date range on the frontend side if needed

---

## 6.2 List requests

### Request

```http
GET /api/v1/dashboard/agents/bank-withdrawals?page=1&limit=20&status=pending
```

Optional filter:

```http
GET /api/v1/dashboard/agents/bank-withdrawals?page=1&limit=20&agentUserId=<uuid>
```

### Recommended columns

- request id
- agent user id
- amount
- status
- bank name
- account name
- masked account number
- request date
- processed date

### Recommended row actions

- `Mark Processing`
- `Mark Success`
- `Mark Failed`
- `View Details`

---

## 6.3 Update request status

### Mark processing

```http
PATCH /api/v1/dashboard/agents/bank-withdrawals/:withdrawalRequestId
Content-Type: application/json
```

```json
{
  "status": "processing",
  "adminNotes": "Queued for transfer"
}
```

### Mark success

```json
{
  "status": "success",
  "adminNotes": "Transferred via bank portal"
}
```

When admin marks `success`:

- backend deducts the amount from agent commissions
- backend stores the processed breakdown
- frontend should refetch:
  - admin request list
  - agent detail page if open
  - agent commissions if open

### Mark failed

```json
{
  "status": "failed",
  "adminNotes": "Transfer rejected by bank",
  "failureReason": "Account number mismatch"
}
```

When admin marks `failed`:

- no commission deduction happens
- frontend should show `failureReason` prominently

---

## 6.4 Admin API helpers

```ts
// src/lib/adminAgentWithdrawal.ts
import { apiFetch } from "./api";

export function getAdminAgentBankWithdrawals(params?: {
  page?: number;
  limit?: number;
  status?: "pending" | "processing" | "success" | "failed";
  agentUserId?: string;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  if (params?.agentUserId) search.set("agentUserId", params.agentUserId);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch(`/api/v1/dashboard/agents/bank-withdrawals${suffix}`);
}

export function processAgentBankWithdrawal(
  withdrawalRequestId: string,
  payload: {
    status: "processing" | "success" | "failed";
    adminNotes?: string;
    failureReason?: string;
  }
) {
  return apiFetch(
    `/api/v1/dashboard/agents/bank-withdrawals/${withdrawalRequestId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}
```

---

## 7. Suggested React Query keys

```ts
export const agentWithdrawalKeys = {
  balance: ["agent-withdrawal", "balance"],
  bankRequests: (params?: unknown) => [
    "agent-withdrawal",
    "bank-requests",
    params,
  ],
  adminBankRequests: (params?: unknown) => [
    "admin-agent-withdrawal",
    "bank-requests",
    params,
  ],
};
```

After successful mutations, invalidate:

- `balance`
- `bankRequests`
- `adminBankRequests`
- existing agent stats query
- existing commissions query

---

## 8. Recommended validation

### User form validation

- `amount > 0`
- `amount <= displayed available balance`
- require `bankName` for bank method
- require `accountName` for bank method
- require `accountNumber` for bank method
- keep `accountNumber` numeric-only if product wants stricter UX

### Admin form validation

- allow only `processing`, `success`, `failed`
- require `failureReason` when marking failed in the UI even though backend does not strictly force it

---

## 9. Error handling

Common user-facing messages:

- `Amount must be greater than 0`
- `Method must be wallet or bank`
- `Bank name is required`
- `Account name is required`
- `Account number is required`
- `Insufficient available commission balance`
- `No available commissions found for withdrawal`

Common admin-facing messages:

- `Agent bank withdrawal request not found`
- `This withdrawal request has already been finalized`
- `Only pending withdrawal requests can be moved to processing`
- `Could not process full withdrawal amount: insufficient available balance`

Recommended UX:

- show toast for quick feedback
- show inline form error for validation failures
- keep server message visible for admin processing failures

---

## 10. Recommended user copy

Wallet method helper text:

`Withdraw instantly into your app wallet.`

Bank method helper text:

`Submit a bank payout request. Admin will review and process it. Your commission balance is deducted only after the request is completed successfully.`

Pending badge helper text:

`Awaiting admin review`

Processing badge helper text:

`Transfer is being processed by admin`

Failed badge helper text:

`This payout was not completed. You can submit another request after reviewing the reason.`
