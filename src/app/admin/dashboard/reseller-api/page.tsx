import { ResellerApiPurchaseAnalyticsSection } from "@/components/features/admin/reseller-api/ResellerApiPurchaseAnalyticsSection";
import { ResellerApiCircuitBreakersPanel } from "@/components/features/admin/reseller-api/ResellerApiCircuitBreakersPanel";
import { ResellerApiDeliveriesTable } from "@/components/features/admin/reseller-api/ResellerApiDeliveriesTable";
import { ResellerApiOverviewCards } from "@/components/features/admin/reseller-api/ResellerApiOverviewCards";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminResellerApiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reseller API</h1>
          <p className="text-muted-foreground">
            Monitor callback health, delivery attempts, and circuit breaker
            state.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/reseller-api/docs">
            View API Documentation
          </Link>
        </Button>
      </div>

      <ResellerApiPurchaseAnalyticsSection />
      <ResellerApiOverviewCards />
      <ResellerApiDeliveriesTable />
      <ResellerApiCircuitBreakersPanel />
    </div>
  );
}
