import { JobListTable } from "@/components/features/admin/jobs/JobListTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

// Loading skeleton for jobs table
function JobTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
      <Suspense fallback={<JobTableSkeleton />}>
        <JobListTable />
      </Suspense>
    </div>
  );
}
