"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PurchaseStatus } from "@/types/reseller.types";
import { format } from "date-fns";

interface PurchaseStatusMonitorProps {
  purchases: PurchaseStatus[];
  activeRequestId: string | null;
  pollingState: {
    isPolling: boolean;
    intervalMs: number;
    startedAt: string | null;
  };
  lastError: string | null;
}

function renderTimeline(purchase: PurchaseStatus) {
  const normalizedStatus = purchase.status.toLowerCase();
  const isPending = !purchase.isFinal;
  const isFailure =
    normalizedStatus.includes("failed") ||
    normalizedStatus.includes("reversed");
  const finalLabel = isFailure ? "failed/reversed" : "completed";

  const steps = [
    { label: "created", done: true },
    {
      label: "pending",
      done: !purchase.isFinal || normalizedStatus !== "created",
    },
    { label: finalLabel, done: purchase.isFinal },
  ];

  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <span
            className={
              step.done
                ? "rounded-full bg-green-500 px-2 py-0.5 text-white"
                : "text-muted-foreground rounded-full border px-2 py-0.5"
            }
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="text-muted-foreground">-&gt;</span>
          ) : null}
        </div>
      ))}
      {isPending ? (
        <Badge variant="outline" className="ml-auto">
          Polling
        </Badge>
      ) : null}
    </div>
  );
}

export function PurchaseStatusMonitor({
  purchases,
  activeRequestId,
  pollingState,
  lastError,
}: PurchaseStatusMonitorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Status Monitor</CardTitle>
        <CardDescription>
          Polling interval: {(pollingState.intervalMs / 1000).toFixed(1)}s
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{lastError}</p>
        ) : null}

        {purchases.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No requests yet. Submit a purchase to start monitoring.
          </p>
        ) : (
          purchases.map((purchase) => {
            const isActive = activeRequestId === purchase.requestId;
            return (
              <div key={purchase.requestId} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-xs">{purchase.requestId}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(purchase.createdAt), "PPpp")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={purchase.isFinal ? "default" : "secondary"}>
                      {purchase.status}
                    </Badge>
                    <Badge variant="outline">
                      {purchase.isFinal ? "Final" : "Pending"}
                    </Badge>
                    {isActive && pollingState.isPolling ? (
                      <Badge variant="outline">Live</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Product:</span>{" "}
                    {purchase.productCode}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Amount:</span> ₦
                    {purchase.amount.toLocaleString()}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Recipient:</span>{" "}
                    {purchase.recipientPhone}
                  </p>
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground font-sans text-sm">
                      Idempotency:
                    </span>{" "}
                    {purchase.idempotencyKey}
                  </p>
                </div>

                {renderTimeline(purchase)}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
