# Frontend Agent Integration Guide

## Audience
This guide is for the Next.js frontend and covers:

- public signup with `agentCode`
- normal authenticated user agent flows
- admin agent management flows

It matches the current backend routes already mounted in `src/app.ts`.

---

## 1. Backend Routes You Can Use

### Public

- `GET /api/v1/agent/code/validate?code=AGENT-ABC123`
- `POST /api/v1/auth/register`

### Authenticated User

- `POST /api/v1/dashboard/agent/account/activate`
- `GET /api/v1/dashboard/agent/account`
- `POST /api/v1/dashboard/agent/account/deactivate`
- `POST /api/v1/dashboard/agent/account/regenerate-code`
- `GET /api/v1/dashboard/agent/stats`
- `GET /api/v1/dashboard/agent/customers`
- `GET /api/v1/dashboard/agent/commissions`
- `GET /api/v1/dashboard/agent/available-balance`
- `POST /api/v1/dashboard/agent/withdraw`

### Admin

- `POST /api/v1/dashboard/agent/products/:productId/commission`
- `PUT /api/v1/dashboard/agent/products/:productId/commission`
- `DELETE /api/v1/dashboard/agent/products/:productId/commission`
- `GET /api/v1/dashboard/agent/products`
- `GET /api/v1/dashboard/agents`
- `GET /api/v1/dashboard/agents/:agentUserId/details`
- `GET /api/v1/dashboard/agents/:agentUserId/customers`
- `GET /api/v1/dashboard/agents/:agentUserId/commissions`
- `POST /api/v1/dashboard/agents/:agentUserId/disable`
- `POST /api/v1/dashboard/agents/:agentUserId/enable`

### Important

- referral routes are disabled for now
- signup should send `agentCode`, not `referralCode`

---

## 2. Suggested Next.js Structure

```text
src/
  lib/
    api.ts
    agent.ts
  app/
    signup/page.tsx
    dashboard/agent/page.tsx
    dashboard/agent/customers/page.tsx
    dashboard/agent/commissions/page.tsx
    admin/agents/page.tsx
    admin/agents/[agentUserId]/page.tsx
    admin/agent-products/page.tsx
```

---

## 3. Shared API Client

```ts
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}
```

---

## 4. Public Signup Flow

## Goal

Allow users to open a link like:

```text
/signup?agentCode=AGENT-ABC123
```

Then validate it, show a friendly message, and submit it during registration.

### Read and validate the code

```ts
// src/lib/agent.ts
import { apiFetch } from './api';

export async function validateAgentCode(code: string) {
  return apiFetch<{
    success: boolean;
    message: string;
    data: {
      agentCode: string;
      agentUserId: string;
      isValid: true;
    };
  }>(`/api/v1/agent/code/validate?code=${encodeURIComponent(code)}`);
}
```

```tsx
// app/signup/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { validateAgentCode } from '@/lib/agent';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [agentCode, setAgentCode] = useState('');
  const [agentValid, setAgentValid] = useState<boolean | null>(null);

  useEffect(() => {
    const code = searchParams.get('agentCode');
    if (!code) return;

    const normalized = code.trim().toUpperCase();
    setAgentCode(normalized);

    validateAgentCode(normalized)
      .then(() => setAgentValid(true))
      .catch(() => setAgentValid(false));
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
        fullName: formData.get('fullName'),
        phoneNumber: formData.get('phoneNumber'),
        agentCode: agentCode || undefined,
      }),
    });
  }

  return null;
}
```

### UX recommendation

- if `agentCode` is valid, show `You are signing up under an agent`
- if invalid, do not block signup unless product wants that behavior
- keep the code in local form state and submit it with registration

---

## 5. Normal User Flow

## Goal

Any normal signed-in user can choose to become an agent, get an agent code, and track customers and commissions.

### Activate agent account

```ts
export async function activateAgent() {
  return apiFetch('/api/v1/dashboard/agent/account/activate', {
    method: 'POST',
  });
}
```

### Fetch agent dashboard data

```ts
export async function getAgentAccount() {
  return apiFetch('/api/v1/dashboard/agent/account');
}

export async function getAgentStats() {
  return apiFetch('/api/v1/dashboard/agent/stats');
}

export async function getAgentCustomers(page = 1, limit = 20) {
  return apiFetch(
    `/api/v1/dashboard/agent/customers?page=${page}&limit=${limit}`
  );
}

export async function getAgentCommissions(page = 1, limit = 20) {
  return apiFetch(
    `/api/v1/dashboard/agent/commissions?page=${page}&limit=${limit}`
  );
}

export async function getAgentAvailableBalance() {
  return apiFetch('/api/v1/dashboard/agent/available-balance');
}

export async function withdrawAgentCommissions(amount: number) {
  return apiFetch('/api/v1/dashboard/agent/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}
```

### Recommended user pages

- `Become an Agent`
- `Agent Overview`
- `My Agent Customers`
- `My Agent Commissions`

### Recommended user UI blocks

- current agent code
- copy code button
- share signup link button
- total customers
- total commissions earned
- available balance
- withdraw button
- recent commissions table

### Share link format

Frontend can generate:

```text
${NEXT_PUBLIC_APP_URL}/signup?agentCode=${agentCode}
```

---

## 6. Admin Flow

## Goal

Admins manage commission rules and inspect or disable agents.

### Product commission setup

```ts
export async function getAgentProductCommissions() {
  return apiFetch('/api/v1/dashboard/agent/products');
}

export async function attachAgentCommission(
  productId: string,
  payload: { commissionType: 'fixed' | 'percentage'; commissionValue: number }
) {
  return apiFetch(`/api/v1/dashboard/agent/products/${productId}/commission`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAgentCommission(
  productId: string,
  payload: { commissionType?: 'fixed' | 'percentage'; commissionValue?: number }
) {
  return apiFetch(`/api/v1/dashboard/agent/products/${productId}/commission`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function removeAgentCommission(productId: string) {
  return apiFetch(`/api/v1/dashboard/agent/products/${productId}/commission`, {
    method: 'DELETE',
  });
}
```

### Agent management

```ts
export async function getAgents(page = 1, limit = 20) {
  return apiFetch(`/api/v1/dashboard/agents?page=${page}&limit=${limit}`);
}

export async function getAgentDetails(agentUserId: string) {
  return apiFetch(`/api/v1/dashboard/agents/${agentUserId}/details`);
}

export async function getAgentCustomersAdmin(agentUserId: string) {
  return apiFetch(`/api/v1/dashboard/agents/${agentUserId}/customers`);
}

export async function getAgentCommissionsAdmin(agentUserId: string) {
  return apiFetch(`/api/v1/dashboard/agents/${agentUserId}/commissions`);
}

export async function disableAgent(agentUserId: string) {
  return apiFetch(`/api/v1/dashboard/agents/${agentUserId}/disable`, {
    method: 'POST',
  });
}

export async function enableAgent(agentUserId: string) {
  return apiFetch(`/api/v1/dashboard/agents/${agentUserId}/enable`, {
    method: 'POST',
  });
}
```

### Recommended admin pages

- `Agent Commission Products`
- `Agents List`
- `Agent Details`

### Recommended admin columns

- agent user id
- agent code
- active status
- total customers
- total earned
- withdrawn amount
- available balance
- created at

---

## 7. Suggested TypeScript Shapes

```ts
export type AgentAccount = {
  id: string;
  userId: string;
  agentCode: string;
  isActive: boolean;
  commissionCapType: 'indefinite' | 'time_limited' | 'purchase_limited';
  commissionCapValue: number | null;
  commissionCapExpiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentStats = {
  totalCustomers: number;
  activeCustomers: number;
  totalCommissionsEarned: number;
  claimedCommissionsAmount: number;
  withdrawnCommissionsAmount: number;
  availableBalanceAmount: number;
};
```

---

## 8. Route Guards

### Normal user dashboard

- if `GET /api/v1/dashboard/agent/account` returns `404`, show `Become an Agent`
- after activation, route user into the agent dashboard

### Admin dashboard

- only render admin pages for admin-authenticated users
- hide admin agent tooling from standard users

---

## 9. Recommended Rollout Order

1. Public signup `agentCode` capture and validation.
2. User agent activation and dashboard.
3. Admin product commission configuration.
4. Admin agent list and detail pages.

---

## 10. Final Notes

- do not send `referralCode` from Next.js signup anymore
- use `agentCode` consistently in query params, form state, and API payloads
- treat `/api/v1/agent/code/validate` as the only public pre-signup validation endpoint for this feature
