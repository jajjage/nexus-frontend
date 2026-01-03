import { JobDetailView } from "@/components/features/admin/jobs/JobDetailView";

/**
 * Admin Job Detail Page
 * Route: /admin/dashboard/jobs/[jobId]
 */
export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return <JobDetailView jobId={jobId} />;
}
