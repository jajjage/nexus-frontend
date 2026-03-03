"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResellerApiCallbacksOverview } from "@/hooks/admin/useAdminResellerApi";
import { Activity, CheckCircle2, Clock3, XCircle } from "lucide-react";

export function ResellerApiOverviewCards() {
  const { data, isLoading, isError } = useResellerApiCallbacksOverview();

  if (!data && isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-red-500">
          Failed to load callback overview.
        </CardContent>
      </Card>
    );
  }

  const overview = data.data;

  const cards = [
    {
      label: "Total Callbacks",
      value: overview.total,
      icon: Activity,
      valueClassName: "text-foreground",
    },
    {
      label: "Delivered",
      value: overview.delivered,
      icon: CheckCircle2,
      valueClassName: "text-green-600",
    },
    {
      label: "Pending",
      value: overview.pending,
      icon: Clock3,
      valueClassName: "text-blue-600",
    },
    {
      label: "Failed",
      value: overview.failed,
      icon: XCircle,
      valueClassName: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
            <card.icon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.valueClassName}`}>
              {card.value.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
