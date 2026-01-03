"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSettlement } from "@/hooks/admin/useAdminSettlements";
import { format } from "date-fns";
import { ArrowLeft, Building2, Calendar, FileText } from "lucide-react";
import Link from "next/link";

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

interface SettlementDetailViewProps {
  settlementId: string;
}

export function SettlementDetailView({
  settlementId,
}: SettlementDetailViewProps) {
  const { data, isLoading, isError, refetch } =
    useAdminSettlement(settlementId);

  const settlement = data?.data;

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

  if (isError || !settlement) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load settlement details
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/settlements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settlements
          </Link>
        </Button>
      </div>

      {/* Info Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settlement Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Settlement Details
            </CardTitle>
            <CardDescription>Information about this settlement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Settlement ID" value={settlement.id} mono />
            <InfoRow
              label="Provider"
              value={settlement.providerName || settlement.providerId}
            />
            <InfoRow
              label="Settlement Date"
              value={format(new Date(settlement.settlementDate), "PPP")}
            />
            <InfoRow label="Reference" value={settlement.reference} mono />
            {settlement.createdAt && (
              <InfoRow
                label="Created At"
                value={format(new Date(settlement.createdAt), "PPpp")}
              />
            )}
          </CardContent>
        </Card>

        {/* Amount Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Amount Breakdown
            </CardTitle>
            <CardDescription>Financial summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted flex justify-between rounded-lg p-4">
              <span className="text-muted-foreground">Gross Amount</span>
              <span className="text-xl font-bold">
                {formatCurrency(settlement.amount)}
              </span>
            </div>
            <div className="border-destructive/20 bg-destructive/5 flex justify-between rounded-lg border p-4">
              <span className="text-muted-foreground">Fees</span>
              <span className="text-destructive text-xl font-medium">
                - {formatCurrency(settlement.fees)}
              </span>
            </div>
            <div className="flex justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <span className="font-medium">Net Amount</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(settlement.netAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Raw Report (if available) */}
        {settlement.rawReport && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Raw Report
              </CardTitle>
              <CardDescription>Original settlement report data</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted max-h-64 overflow-auto rounded-md p-4 text-sm">
                {JSON.stringify(settlement.rawReport, null, 2)}
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
