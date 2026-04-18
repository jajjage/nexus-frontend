# Agent Integration Implementation Plan

**Objective:** Replace referral system with agent system in the frontend, integrating with existing backend agent API routes.

**Scope:** User dashboard, admin dashboard, and public signup flow.

---

## Phase 1: Foundation & Service Layer

### 1.1 Create Agent Service (`src/services/agent.service.ts`)

**Deliverables:**

- Implement all public agent endpoints from backend
- Implement authenticated user agent endpoints
- Implement admin agent management endpoints

**Key Functions:**

```typescript
// Public validation
export const agentService = {
  validateCode: (code: string) => {
    /* GET /agent/code/validate */
  },

  // User agent endpoints
  activateAgent: () => {
    /* POST /dashboard/agent/account/activate */
  },
  getAgentAccount: () => {
    /* GET /dashboard/agent/account */
  },
  deactivateAgent: () => {
    /* POST /dashboard/agent/account/deactivate */
  },
  regenerateCode: () => {
    /* POST /dashboard/agent/account/regenerate-code */
  },
  getAgentStats: () => {
    /* GET /dashboard/agent/stats */
  },
  getAgentCustomers: (page, limit) => {
    /* GET /dashboard/agent/customers */
  },
  getAgentCommissions: (page, limit) => {
    /* GET /dashboard/agent/commissions */
  },
  getAvailableBalance: () => {
    /* GET /dashboard/agent/available-balance */
  },
  withdrawCommissions: (amount) => {
    /* POST /dashboard/agent/withdraw */
  },

  // Admin endpoints
  getAdminProductCommissions: () => {
    /* GET /dashboard/agent/products */
  },
  attachProductCommission: (productId, payload) => {
    /* POST */
  },
  updateProductCommission: (productId, payload) => {
    /* PUT */
  },
  removeProductCommission: (productId) => {
    /* DELETE */
  },
  getAgents: (page, limit) => {
    /* GET /dashboard/agents */
  },
  getAgentDetails: (agentUserId) => {
    /* GET /dashboard/agents/:agentUserId/details */
  },
  getAgentCustomersAdmin: (agentUserId) => {
    /* GET /dashboard/agents/:agentUserId/customers */
  },
  getAgentCommissionsAdmin: (agentUserId) => {
    /* GET /dashboard/agents/:agentUserId/commissions */
  },
  disableAgent: (agentUserId) => {
    /* POST /dashboard/agents/:agentUserId/disable */
  },
  enableAgent: (agentUserId) => {
    /* POST /dashboard/agents/:agentUserId/enable */
  },
};
```

**Dependencies:** `src/lib/api-client.ts` (existing Axios client with token refresh)

---

### 1.2 Create Agent Types (`src/types/agent.types.ts`)

**Deliverables:**

```typescript
export interface AgentAccount {
  id: string;
  userId: string;
  agentCode: string;
  isActive: boolean;
  commissionCapType: "indefinite" | "time_limited" | "purchase_limited";
  commissionCapValue: number | null;
  commissionCapExpiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStats {
  totalCustomers: number;
  activeCustomers: number;
  totalCommissionsEarned: number;
  claimedCommissionsAmount: number;
  withdrawnCommissionsAmount: number;
  availableBalanceAmount: number;
}

export interface AgentValidationResponse {
  success: boolean;
  message: string;
  data: {
    agentCode: string;
    agentUserId: string;
    isValid: boolean;
  };
}

// Additional types for customers, commissions, products, etc.
```

---

## Phase 2: Hooks & Custom Logic

### 2.1 Create Agent Hooks (`src/hooks/useAgent.ts`)

**Deliverables:**

- Query key factory: `agentKeys`
- Custom hooks for all agent operations

**Query Key Factory:**

```typescript
export const agentKeys = {
  all: ["agent"],
  account: () => [...agentKeys.all, "account"],
  stats: () => [...agentKeys.all, "stats"],
  customers: (page: number, limit: number) => [
    ...agentKeys.all,
    "customers",
    page,
    limit,
  ],
  commissions: (page: number, limit: number) => [
    ...agentKeys.all,
    "commissions",
    page,
    limit,
  ],
  availableBalance: () => [...agentKeys.all, "availableBalance"],
};
```

**Custom Hooks:**

```typescript
export function useAgentAccount() {
  /* useQuery */
}
export function useAgentStats() {
  /* useQuery */
}
export function useAgentCustomers(page, limit) {
  /* useQuery */
}
export function useAgentCommissions(page, limit) {
  /* useQuery */
}
export function useAvailableBalance() {
  /* useQuery */
}
export function useActivateAgent() {
  /* useMutation */
}
export function useDeactivateAgent() {
  /* useMutation */
}
export function useRegenerateAgentCode() {
  /* useMutation */
}
export function useWithdrawCommissions() {
  /* useMutation */
}
```

---

## Phase 3: Update Register Form

### 3.1 Modify Register Form (`src/components/features/auth/register-form.tsx`)

**Current State:**

- Uses `referralCode` field
- Calls `useValidateReferralCode()` hook
- Sends `referralCode` to backend

**Changes:**

1. Replace `referralCode` with `agentCode` in form schema
2. Replace `useValidateReferralCode()` with agent code validation
3. Update form field label from "Referral Code" to "Agent Code" (optional field)
4. Modify submission to send `agentCode` instead of `referralCode`
5. Update validation messages to use "agent" terminology

**Key Steps:**

```typescript
// Before
const urlCode = searchParams.get("code") || searchParams.get("ref");
const { mutateAsync: validateCode } = useValidateReferralCode();

// After
const urlCode = searchParams.get("agentCode");
const { mutateAsync: validateCode } = useValidateAgentCode();

// Update schema
agentCode: z.string().optional(),

// Update submission
const dataToSend = {
  email: rest.email,
  password: rest.password,
  phoneNumber: normalizedPhone,
  fullName: rest.fullName,
  agentCode: rest.agentCode, // Changed from referralCode
};
```

**Dependencies:** New `useValidateAgentCode()` hook

---

## Phase 4: User Agent Dashboard

### 4.1 Create Agent Activation Flow

**New Component:** `src/components/features/dashboard/agent/become-agent-card.tsx`

**Deliverables:**

- Card showing "Become an Agent" CTA
- Displayed when user has no agent account
- Button triggers activation mutation
- Shows loading state and success toast

---

### 4.2 Create Agent Dashboard Pages

**New Pages:**

| Page              | Route                          | Purpose                    |
| ----------------- | ------------------------------ | -------------------------- |
| Agent Overview    | `/dashboard/agent`             | Main agent dashboard       |
| Agent Customers   | `/dashboard/agent/customers`   | List of referred customers |
| Agent Commissions | `/dashboard/agent/commissions` | Commission history         |

**Components for Each Page:**

#### 4.2.1 Agent Overview (`src/app/dashboard/agent/page.tsx`)

**UI Blocks:**

- Agent Info Card (code, status, activation date)
- Copy Code Button
- Share Link Button (generates `/signup?agentCode=XXX`)
- Quick Stats (total customers, earned, available, withdrawn)
- CTA to withdraw commissions
- Recent commissions preview table

**Dependencies:**

- `useAgentAccount()`
- `useAgentStats()`
- `useRegenerateAgentCode()`
- `useWithdrawCommissions()`

#### 4.2.2 Customers List (`src/app/dashboard/agent/customers/page.tsx`)

**UI Blocks:**

- Paginated table of customers
- Columns: customer name, phone, signup date, status
- Filter/search functionality
- No-data state

**Dependencies:**

- `useAgentCustomers(page, limit)`

#### 4.2.3 Commissions List (`src/app/dashboard/agent/commissions/page.tsx`)

**UI Blocks:**

- Paginated table of commissions
- Columns: transaction date, amount, status, product
- Filter by date range
- Total earned/withdrawn stats

**Dependencies:**

- `useAgentCommissions(page, limit)`
- `useAvailableBalance()`

---

### 4.3 Update User Dashboard Navigation

**File:** `src/components/features/dashboard/desktop-sidebar.tsx`

**Changes:**

- Replace "Referral" menu item with "Agent"
- Update icon if needed (keep Users icon or use briefcase)
- Update href from `/dashboard/referrals` to `/dashboard/agent`

**Current:**

```typescript
{ label: "Referral", icon: Users, href: "/dashboard/referrals" }
```

**New:**

```typescript
{ label: "Agent", icon: Users, href: "/dashboard/agent" }
```

---

## Phase 5: Admin Agent Management

### 5.1 Create Admin Agent Pages

**New Pages:**

| Page                | Route                         | Purpose                       |
| ------------------- | ----------------------------- | ----------------------------- |
| Agents List         | `/admin/agents`               | View all agents               |
| Agent Details       | `/admin/agents/[agentUserId]` | View single agent             |
| Commission Products | `/admin/agent-products`       | Configure product commissions |

**Directory Structure:**

```
src/app/admin/
  agents/
    page.tsx (list)
    [agentUserId]/
      page.tsx (detail)
  agent-products/
    page.tsx
```

#### 5.1.1 Agents List (`src/app/admin/agents/page.tsx`)

**UI Blocks:**

- Paginated table of all agents
- Columns:
  - Agent ID
  - Agent Code
  - User Email/Name
  - Active Status (toggle button)
  - Total Customers
  - Total Earned
  - Withdrawn Amount
  - Available Balance
  - Actions (View Details, Disable/Enable)
- Filter by status, date range
- Search by agent code, user email

**Dependencies:**

- Query hook for agent list
- Mutation hooks for enable/disable

#### 5.1.2 Agent Details (`src/app/admin/agents/[agentUserId]/page.tsx`)

**UI Blocks:**

- Agent info card (code, email, activation date, status)
- Enable/Disable toggle
- Customers list (paginated)
- Commissions list (paginated)
- Stats summary

**Dependencies:**

- Query hooks for agent details, customers, commissions

#### 5.1.3 Commission Products (`src/app/admin/agent-products/page.tsx`)

**UI Blocks:**

- Paginated table of products
- Columns:
  - Product name/ID
  - Commission Type (Fixed/Percentage)
  - Commission Value
  - Actions (Edit, Remove, View Details)
- Modal/Form to add/edit commission rules
- Search by product name

**Dependencies:**

- Query hook for products
- Mutation hooks for CRUD operations

---

### 5.2 Update Admin Navigation

**File:** `src/components/features/admin/admin-sidebar.tsx` (or similar)

**Changes:**

- Add "Agents" menu item pointing to `/admin/agents`
- Add "Agent Products" menu item pointing to `/admin/agent-products`

---

## Phase 6: Update Public Referral Routes

### 6.1 Redirect Referral Links to Agent

**File:** `src/app/referral/[code]/page.tsx`

**Current Behavior:**

```typescript
redirect(`/register?ref=${code}`);
```

**New Behavior:**

```typescript
redirect(`/register?agentCode=${code}`);
```

---

### 6.2 Keep Backward Compatibility (Optional)

**File:** `src/app/(auth)/register/page.tsx`

**Changes:** Support both query params during transition:

- Accept `?agentCode=` (primary)
- Accept `?ref=` (legacy, map to agentCode)
- Accept `?code=` (legacy, map to agentCode)

---

## Phase 7: Testing

### 7.1 Unit Tests

**Test Files:**

- `__test__/services/agent.service.test.ts` - API function mocks
- `__test__/hooks/useAgent.test.ts` - Hook rendering, data fetching
- `__test__/lib/agent.test.ts` - Utility functions (if any)

### 7.2 Component Tests

**Test Files:**

- `__test__/components/features/auth/register-form.test.tsx` - Agent code validation
- `__test__/components/features/dashboard/agent/*.test.tsx` - Dashboard pages

### 7.3 Integration Tests

**Test Files:**

- `__test__/integration/agent-signup.test.ts` - Public signup with agent code
- `__test__/integration/agent-user-flow.test.ts` - Activation, stats, commission
- `__test__/integration/agent-admin-flow.test.ts` - Admin management

---

## Phase 8: Migration Tasks

### 8.1 Handle Existing Referral References

**Cleanup:**

1. Remove/hide old referral dashboard pages (or archive)
2. Remove referral-related hooks if no longer needed
3. Remove referral service if not used elsewhere
4. Update docs to remove referral references

**Search & Replace:**

- Search for `referralCode` → replace with `agentCode` where applicable
- Search for `referral` → identify context, replace or deprecate

### 8.2 Update Documentation

**Files to Update/Create:**

- [x] This plan document (AGENT_INTEGRATION_IMPLEMENTATION_PLAN.md)
- [ ] Update CODEBASE_STANDARDS.md with agent integration examples
- [ ] Create AGENT_FEATURE_GUIDE.md with implementation details
- [ ] Update CODEBASE_ARCHITECTURE.md if needed

---

## Implementation Timeline

| Phase                          | Estimated Duration | Priority |
| ------------------------------ | ------------------ | -------- |
| Phase 1: Foundation & Services | 2-3 days           | High     |
| Phase 2: Hooks & Logic         | 1-2 days           | High     |
| Phase 3: Register Form         | 1 day              | High     |
| Phase 4: User Dashboard        | 3-4 days           | High     |
| Phase 5: Admin Dashboard       | 3-4 days           | Medium   |
| Phase 6: Public Routes         | 1 day              | Medium   |
| Phase 7: Testing               | 3-4 days           | Medium   |
| Phase 8: Migration & Cleanup   | 1-2 days           | Low      |
| **Total**                      | **15-21 days**     | -        |

---

## Rollout Strategy

### Recommended Rollout Order:

1. **Week 1:** Phase 1-3 (foundation, services, register form)
   - Deploy to staging
   - Test signup with agent code

2. **Week 2:** Phase 4 (user agent dashboard)
   - Activate feature flag for user agent features
   - Internal testing

3. **Week 3:** Phase 5 (admin dashboard)
   - Activate feature flag for admin
   - Admin testing

4. **Week 4:** Phase 6-8 (migration, cleanup, release)
   - Remove referral UI if approved
   - Full production rollout

---

## Feature Flags (Recommended)

To safely rollout without disrupting referrals:

```typescript
// src/lib/feature-flags.ts
export const AGENT_FEATURE_ENABLED =
  process.env.NEXT_PUBLIC_AGENT_ENABLED === "true";
export const ADMIN_AGENT_ENABLED =
  process.env.NEXT_PUBLIC_ADMIN_AGENT_ENABLED === "true";
export const HIDE_REFERRALS = process.env.NEXT_PUBLIC_HIDE_REFERRALS === "true";
```

---

## Breaking Changes & Considerations

### Breaking Changes:

- **Signup Parameter:** `referralCode` → `agentCode` in backend
- **Route Change:** `/dashboard/referrals` → `/dashboard/agent` (optional redirect)
- **Query Parameter:** `/register?ref=` → `/register?agentCode=`

### Backward Compatibility:

- Keep support for legacy `ref` and `code` query params temporarily
- Redirect old referral links to new agent structure
- Deprecate referral API gradually

### Data Migration:

- No data migration needed (agent and referral are separate systems)
- Old referral customers remain in referral system
- New signups via agent code create agent relationships

---

## Success Criteria

- [ ] Agent code validation works in signup
- [ ] Users can activate agent account
- [ ] Users see agent dashboard with correct stats
- [ ] Users can share agent links and track customers
- [ ] Admins can configure product commissions
- [ ] Admins can view and manage agents
- [ ] All tests pass
- [ ] No referral breakage during transition
- [ ] Mobile responsive UI on all agent pages
- [ ] Performance: Agent pages load in <2s

---

## Dependencies & Prerequisites

### External (Already Available):

- ✅ Backend agent API routes
- ✅ Axios client with token refresh (src/lib/api-client.ts)
- ✅ React Query setup (src/lib/react-query.ts)
- ✅ UI components (src/components/ui/)

### Internal (To Create):

- ❌ Agent service layer
- ❌ Agent types
- ❌ Agent hooks
- ❌ Agent components/pages

### Environment Variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_AGENT_ENABLED=true
NEXT_PUBLIC_ADMIN_AGENT_ENABLED=true
NEXT_PUBLIC_HIDE_REFERRALS=false (initially)
```

---

## Notes

- Backend already has all agent routes ready
- No backend changes needed; frontend purely integrates existing API
- Referral system remains independent; no conflict
- Agent and referral can coexist during transition phase
- Focus on user experience: clear CTAs, intuitive navigation, responsive design
