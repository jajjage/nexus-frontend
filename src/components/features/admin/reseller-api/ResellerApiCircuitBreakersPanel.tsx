"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useResetCircuitBreaker,
  useResellerApiCircuitBreakers,
  useToggleCircuitBreaker,
} from "@/hooks/admin/useAdminResellerApi";
import { ResellerApiCircuitBreaker } from "@/types/admin/reseller-api.types";
import { formatDistanceToNow } from "date-fns";
import { Power, RefreshCw, RotateCcw } from "lucide-react";

const stateVariant = (
  state: string
): "default" | "secondary" | "destructive" | "outline" => {
  const normalized = state.toLowerCase();
  if (normalized === "open") return "destructive";
  if (normalized === "half_open") return "secondary";
  if (normalized === "disabled") return "outline";
  return "default";
};

export function ResellerApiCircuitBreakersPanel() {
  const { data, isLoading, isError, refetch, isRefetching } =
    useResellerApiCircuitBreakers();
  const resetMutation = useResetCircuitBreaker();
  const toggleMutation = useToggleCircuitBreaker();

  const handleReset = (supplierKey?: string) => {
    resetMutation.mutate(supplierKey ? { supplierKey } : {});
  };

  const handleToggleSupplier = (
    supplierKey: string,
    currentDisabled: boolean
  ) => {
    toggleMutation.mutate({
      enabled: currentDisabled,
      supplierKey,
    });
  };

  if (!data && isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Circuit Breakers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Circuit Breakers</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Failed to load circuit breaker state.
          </p>
        </CardContent>
      </Card>
    );
  }

  const breakers = data?.data?.breakers ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            Circuit Breakers
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Monitor and manage provider circuit states and auto-blocking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleReset()}
            disabled={resetMutation.isPending}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No circuit breaker records available.
          </p>
        ) : (
          breakers.map((breaker: ResellerApiCircuitBreaker) => {
            const supplierKey = breaker.supplierKey || breaker.supplier;
            const isBreakerDisabled = breaker.state === "disabled";

            return (
              <div
                key={`${supplierKey}-${breaker.state}`}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{breaker.supplier}</p>
                    <Badge variant={stateVariant(breaker.state)}>
                      {breaker.state.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Failures:{" "}
                    <span className="text-foreground font-medium">
                      {breaker.failureCount}
                    </span>{" "}
                    | Successes:{" "}
                    <span className="text-foreground font-medium">
                      {breaker.successCount}
                    </span>
                    {breaker.openedAt ? (
                      <span>
                        {" • "}
                        opened{" "}
                        {formatDistanceToNow(new Date(breaker.openedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    ) : null}
                  </p>
                  {breaker.lastFailureReason ? (
                    <p className="text-destructive max-w-md truncate text-xs">
                      Reason: {breaker.lastFailureReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset(supplierKey)}
                    disabled={resetMutation.isPending}
                    title="Reset circuit state to CLOSED"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Reset
                  </Button>
                  <Button
                    variant={isBreakerDisabled ? "default" : "ghost"}
                    size="sm"
                    onClick={() =>
                      handleToggleSupplier(supplierKey, isBreakerDisabled)
                    }
                    disabled={toggleMutation.isPending}
                    title={
                      isBreakerDisabled
                        ? "Enable Circuit Protection"
                        : "Disable Circuit Protection"
                    }
                  >
                    <Power className="mr-1 h-3.5 w-3.5" />
                    {isBreakerDisabled ? "Enable" : "Disable"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
