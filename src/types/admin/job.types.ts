/**
 * Admin Job Types
 * Based on ADMIN_GUIDE.md Job Management section
 */

// ============= Job Status =============

export type JobStatus = "queued" | "processing" | "completed" | "failed";

// ============= Job Entity =============

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  priority?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

// ============= API Responses =============

export interface JobListResponse {
  jobs: Job[];
  pagination: JobPagination;
}

export interface JobPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============= Query Params =============

export interface JobQueryParams {
  page?: number;
  limit?: number;
  status?: JobStatus;
  type?: string;
}
