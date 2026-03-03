"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

interface ResellerApiAccessFallbackProps {
  showProvisionWarning?: boolean;
}

export function ResellerApiAccessFallback({
  showProvisionWarning = false,
}: ResellerApiAccessFallbackProps) {
  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-100">
      <ShieldAlert className="size-4" />
      <AlertTitle className="flex items-center gap-2">
        Reseller API Access Required
        {showProvisionWarning ? (
          <Badge variant="outline" className="border-amber-400 text-amber-700">
            Dev Fallback Active
          </Badge>
        ) : null}
      </AlertTitle>
      <AlertDescription>
        Contact support to enable reseller API access.
      </AlertDescription>
    </Alert>
  );
}
