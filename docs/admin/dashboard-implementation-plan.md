# Dashboard Feature Implementation Plan

## 1. Overview

Enhance the admin dashboard with real-time stats from the backend API.

## 2. API Endpoints

| Endpoint                       | Method | Description                               |
| ------------------------------ | ------ | ----------------------------------------- |
| `/admin/dashboard/stats`       | GET    | Total users, transactions, topup requests |
| `/admin/dashboard/failed-jobs` | GET    | Paginated list of failed jobs             |
| `/admin/users/inactive`        | GET    | Users inactive since specified date       |

## 3. Proposed Changes

### Types (`src/types/admin/dashboard.types.ts`)

```typescript
interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalTopupRequests: number;
}

interface FailedJob {
  id: string;
  name: string;
  error: string;
  failedAt: string;
}

interface InactiveUser {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
}
```

---

### Service (`src/services/admin/dashboard.service.ts`)

- `getStats()` → GET `/admin/dashboard/stats`
- `getFailedJobs(params)` → GET `/admin/dashboard/failed-jobs`
- (Already exists) `getInactiveUsers(inactiveSince)` in user.service.ts

---

### Hooks (`src/hooks/admin/useAdminDashboard.ts`)

- `useDashboardStats()` - Fetches stats with 2-min stale time
- `useFailedJobs(params)` - Paginated failed jobs query

---

### UI Components

#### Dashboard Stats Cards

Replace placeholder `--` values with real data.

#### Inactive Users Widget

A new card showing users who haven't logged in recently (e.g., 30 days).
Uses the `getInactiveUsers` API already in `user.service.ts`.

## 4. Verification

- Unit tests for service methods
- Component renders real stats from API
