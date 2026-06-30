"use client";

import {
  ErrorLogsTable,
  ErrorStatsDashboard,
} from "@/components/features/admin/supplier-errors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart3, ListFilter } from "lucide-react";

export default function SupplierErrorsPage() {
  return (
    <div className="flex flex-col gap-4 p-2 md:gap-6 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-destructive text-3xl font-bold tracking-tight">
            Supplier Failure Analytics
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track API connection drops, out-of-SIM issues, and transaction rule
            rejections from suppliers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Failure Trends
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Failure Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 pt-4">
          <ErrorStatsDashboard />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 pt-4">
          <ErrorLogsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
