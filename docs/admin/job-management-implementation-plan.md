# Job Management Implementation Plan

## 1. Overview

Implement a dedicated Job Management page for the Admin Dashboard, allowing admins to view all background jobs (not just failed ones), monitor their status, and take actions like retry or delete.

**Reference**: `docs/ADMIN_GUIDE.md` (Section: Job Management)

## 2. API Endpoints

| Method | Endpoint                                    | Permission        | Description              |
| ------ | ------------------------------------------- | ----------------- | ------------------------ |
| GET    | `/admin/jobs/all`                           | `system.settings` | Get all jobs (paginated) |
| GET    | `/admin/jobs/:jobId`                        | `system.settings` | Get job by ID            |
| POST   | `/admin/dashboard/failed-jobs/:jobId/retry` | `system.settings` | Retry failed job         |
| DELETE | `/admin/dashboard/failed-jobs/:jobId`       | `system.settings` | Delete failed job        |

## 3. Architecture & Data Flow

### 3.1 Types (`src/types/admin/job.types.ts`)

```typescript
interface Job {
  id: string;
  type: string;
  status: "queued" | "processing" | "completed" | "failed";
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

interface JobListResponse {
  jobs: Job[];
  pagination: Pagination;
}

interface JobQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}
```

### 3.2 Service Layer (`src/services/admin/job.service.ts`)

- `getJobs(params)` → GET `/admin/jobs/all`
- `getJobById(jobId)` → GET `/admin/jobs/:jobId`
- Use existing: `retryJob(jobId)` from dashboard.service
- Use existing: `deleteJob(jobId)` from dashboard.service

### 3.3 React Query Hooks (`src/hooks/admin/useAdminJobs.ts`)

- `useAdminJobs(params)` - Paginated list of all jobs
- `useAdminJob(jobId)` - Single job detail
- Re-export: `useRetryJob`, `useDeleteJob` from useAdminDashboard

### 3.4 State Management

- **URL State**: Use search params for `page`, `limit`, `status` filter
- **Server State**: React Query for caching

## 4. Routes & Pages

| Route                           | Page          | Description             |
| ------------------------------- | ------------- | ----------------------- |
| `/admin/dashboard/jobs`         | JobListPage   | All jobs with filtering |
| `/admin/dashboard/jobs/[jobId]` | JobDetailPage | Single job details      |

## 5. UI/UX Components

### 5.1 JobListTable Component

- Columns: Type, Status (Badge), Attempts, Created At, Actions
- Status filters: All, Queued, Processing, Completed, Failed
- Row actions: View, Retry (if failed), Delete (if failed)
- Pagination controls

### 5.2 JobDetailView Component

- Job metadata (type, status, timestamps)
- Payload JSON viewer
- Error message (if failed)
- Result JSON viewer (if completed)
- Action buttons: Retry, Delete

### 5.3 Sidebar Update

Add "Jobs" item to admin sidebar navigation.

## 6. Implementation Checklist

### Phase 1: Types & Service ✅

- [x] Create `src/types/admin/job.types.ts`
- [x] Create `src/services/admin/job.service.ts`

### Phase 2: Hooks ✅

- [x] Create `src/hooks/admin/useAdminJobs.ts`

### Phase 3: UI Components ✅

- [x] Create `src/components/features/admin/jobs/JobListTable.tsx`
- [x] Create `src/components/features/admin/jobs/JobDetailView.tsx`

### Phase 4: Routes ✅

- [x] Create `src/app/admin/dashboard/jobs/page.tsx`
- [x] Create `src/app/admin/dashboard/jobs/[jobId]/page.tsx`

### Phase 5: Sidebar ✅

- [x] Add "Jobs", "Topups", "Roles" to `navItems` in admin layout

## 7. Testing Strategy

### 7.1 Manual Verification

1. Navigate to Jobs page via sidebar
2. Verify jobs list loads with pagination
3. Filter by status (Failed, Completed, etc.)
4. View job details
5. Retry a failed job
6. Delete a failed job
