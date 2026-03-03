"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResellerApiCircuitBreakers } from "@/hooks/admin/useAdminResellerApi";
import { ResellerApiCircuitBreaker } from "@/types/admin/reseller-api.types";
import { formatDistanceToNow } from "date-fns";

const stateVariant = (
  state: string
): "default" | "secondary" | "destructive" | "outline" => {
  const normalized = state.toLowerCase();
  if (normalized === "open") return "destructive";
  if (normalized === "half_open") return "secondary";
  return "default";
};

export function ResellerApiCircuitBreakersPanel() {
  const { data, isLoading, isError } = useResellerApiCircuitBreakers();

  if (!data && isLoading) {
    return (
      <Card>
        <CardHeader>
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
        <CardHeader>
          <CardTitle>Circuit Breakers</CardTitle>
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
      <CardHeader>
        <CardTitle>Circuit Breakers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No circuit breaker records available.
          </p>
        ) : (
          breakers.map((breaker: ResellerApiCircuitBreaker) => (
            <div
              key={`${breaker.supplier}-${breaker.state}`}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{breaker.supplier}</p>
                <p className="text-muted-foreground text-xs">
                  failures: {breaker.failureCount} | successes:{" "}
                  {breaker.successCount}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={stateVariant(breaker.state)}>
                  {breaker.state}
                </Badge>
                {breaker.openedAt ? (
                  <span className="text-muted-foreground text-xs">
                    opened{" "}
                    {formatDistanceToNow(new Date(breaker.openedAt), {
                      addSuffix: true,
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
