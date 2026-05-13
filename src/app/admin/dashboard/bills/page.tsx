import { BillPaymentAnalyticsSection } from "@/components/features/admin/bills/BillPaymentAnalyticsSection";
import { BillPaymentsListTable } from "@/components/features/admin/bills/BillPaymentsListTable";
import { SupplierBillerMappingsTable } from "@/components/features/admin/bills/SupplierBillerMappingsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, History, PlugZap } from "lucide-react";
import { Suspense } from "react";

export default function AdminBillsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bills & Cable</h1>
        <p className="text-muted-foreground">
          Monitor bill payments, inspect provider responses, and manage supplier
          service mappings.
        </p>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Snapshot
          </TabsTrigger>
          <TabsTrigger value="mappings" className="flex items-center gap-2">
            <PlugZap className="h-4 w-4" />
            Supplier Mappings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <BillPaymentsListTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <BillPaymentAnalyticsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="mappings" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <SupplierBillerMappingsTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
