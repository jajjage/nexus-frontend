"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error Caught:", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-amber-100 p-3 dark:bg-amber-900/20">
        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-foreground mb-2 text-xl font-bold">
        Failed to load dashboard content
      </h2>
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">
        There was an error processing your request. You can try to reload this
        section or return to the main dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
