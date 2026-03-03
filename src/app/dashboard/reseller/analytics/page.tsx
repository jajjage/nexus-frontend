"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import {
  ResellerApiAccessFallback,
  ResellerPurchaseAnalyticsPanel,
} from "@/components/features/reseller";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useResellerApiAccess } from "@/hooks/useReseller";
import { ResellerPurchaseAnalyticsQueryParams } from "@/types/reseller.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function ResellerAnalyticsPage() {
  const { user, isLoading } = useAuth();
  const { canAccessApi } = useResellerApiAccess();

  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [queryParams, setQueryParams] =
    useState<ResellerPurchaseAnalyticsQueryParams>({});

  if (!isLoading && user?.role !== "reseller") {
    redirect("/dashboard");
  }

  const validateDates = () => {
    if (fromDateInput && !DATE_PATTERN.test(fromDateInput)) {
      return "fromDate must be in YYYY-MM-DD format.";
    }

    if (toDateInput && !DATE_PATTERN.test(toDateInput)) {
      return "toDate must be in YYYY-MM-DD format.";
    }

    if (fromDateInput && toDateInput && fromDateInput > toDateInput) {
      return "fromDate cannot be greater than toDate.";
    }

    return null;
  };

  const handleApplyFilters = () => {
    const error = validateDates();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setQueryParams({
      fromDate: fromDateInput || undefined,
      toDate: toDateInput || undefined,
    });
  };

  const handleClearFilters = () => {
    setFromDateInput("");
    setToDateInput("");
    setValidationError(null);
    setQueryParams({});
  };

  return (
    <>
      <div className="container mx-auto max-w-6xl px-4 py-8 pb-24">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reseller">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">API Purchase Analytics</h1>
            <p className="text-muted-foreground text-sm">
              Track success, failed, pending, and reversed API purchase
              outcomes.
            </p>
          </div>
        </div>

        {!isLoading && !canAccessApi ? (
          <ResellerApiAccessFallback />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="resellerFromDate">From Date</Label>
                <Input
                  id="resellerFromDate"
                  type="date"
                  value={fromDateInput}
                  onChange={(event) => setFromDateInput(event.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="resellerToDate">To Date</Label>
                <Input
                  id="resellerToDate"
                  type="date"
                  value={toDateInput}
                  onChange={(event) => setToDateInput(event.target.value)}
                  className="w-44"
                />
              </div>
              <Button onClick={handleApplyFilters}>Apply</Button>
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>

            {validationError ? (
              <Alert>
                <AlertTitle>Invalid date range</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            ) : null}

            <ResellerPurchaseAnalyticsPanel params={queryParams} />
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
