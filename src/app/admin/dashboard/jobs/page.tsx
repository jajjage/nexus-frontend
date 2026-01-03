import { JobListTable } from "@/components/features/admin/jobs/JobListTable";

/**
 * Admin Jobs List Page
 * Route: /admin/dashboard/jobs
 */
export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage background jobs.
        </p>
      </div>
      <JobListTable />
    </div>
  );
}
