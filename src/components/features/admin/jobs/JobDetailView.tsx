"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminJob,
  useDeleteJob,
  useRetryJob,
} from "@/hooks/admin/useAdminJobs";
import { JobStatus } from "@/types/admin/job.types";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Status configuration
const statusConfig: Record<
  JobStatus,
  {
    icon: React.ElementType;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  queued: { icon: Clock, color: "text-muted-foreground", variant: "secondary" },
  processing: { icon: Play, color: "text-blue-500", variant: "default" },
  completed: { icon: CheckCircle, color: "text-green-500", variant: "outline" },
  failed: {
    icon: AlertTriangle,
    color: "text-red-500",
    variant: "destructive",
  },
};

interface JobDetailViewProps {
  jobId: string;
}

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useAdminJob(jobId);
  const retryMutation = useRetryJob();
  const deleteMutation = useDeleteJob();

  const job = data?.data;

  const handleDelete = () => {
    deleteMutation.mutate(jobId, {
      onSuccess: () => {
        router.push("/admin/dashboard/jobs");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load job details</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = statusConfig[job.status].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <Badge variant={statusConfig[job.status].variant} className="text-sm">
            <StatusIcon className="mr-1 h-3 w-3" />
            {job.status}
          </Badge>
        </div>

        {job.status === "failed" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => retryMutation.mutate(jobId)}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retry Job
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Job
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The job record will be
                    permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Job Info Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Information about this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Job ID" value={job.id} mono />
            <InfoRow label="Type" value={job.type} />
            <InfoRow
              label="Attempts"
              value={`${job.attempts} / ${job.maxAttempts}`}
            />
            {job.priority !== undefined && (
              <InfoRow label="Priority" value={job.priority.toString()} />
            )}
            <InfoRow
              label="Created"
              value={format(new Date(job.createdAt), "PPpp")}
            />
            {job.startedAt && (
              <InfoRow
                label="Started"
                value={format(new Date(job.startedAt), "PPpp")}
              />
            )}
            {job.completedAt && (
              <InfoRow
                label="Completed"
                value={format(new Date(job.completedAt), "PPpp")}
              />
            )}
            {job.failedAt && (
              <InfoRow
                label="Failed"
                value={format(new Date(job.failedAt), "PPpp")}
              />
            )}
          </CardContent>
        </Card>

        {/* Error Card (only for failed jobs) */}
        {job.status === "failed" && job.error && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-destructive/10 rounded-md p-4 text-sm break-words whitespace-pre-wrap">
                {job.error}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Payload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
            <CardDescription>Job input data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-64 overflow-auto rounded-md p-4 text-sm">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Result Card (only for completed jobs) */}
        {job.status === "completed" && job.result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Result
              </CardTitle>
              <CardDescription>Job output data</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted max-h-64 overflow-auto rounded-md p-4 text-sm">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper component
function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
