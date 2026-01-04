"use client";

import {
  GmvOverviewCard,
  KeyMetricsCards,
  TopupPerformanceChart,
  TransactionOverviewCard,
  TransactionTypeChart,
  UserOverviewCard,
  WalletOverviewCard,
} from "@/components/features/admin/analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Wallet } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4 p-2 md:gap-6 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Business intelligence and performance metrics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet & Finance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Key Metrics Row */}
          <KeyMetricsCards />

          {/* User & Transaction Overview Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <UserOverviewCard />
            <TransactionOverviewCard />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TopupPerformanceChart />
            <TransactionTypeChart />
          </div>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="mt-6 space-y-6">
          {/* Wallet Overview - Full Width */}
          <WalletOverviewCard />

          {/* GMV vs Transaction comparison */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <GmvOverviewCard />
            <TransactionOverviewCard />
          </div>

          {/* Additional visualizations */}
          <TopupPerformanceChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
