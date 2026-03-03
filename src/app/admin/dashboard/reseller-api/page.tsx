import { ResellerApiCircuitBreakersPanel } from "@/components/features/admin/reseller-api/ResellerApiCircuitBreakersPanel";
import { ResellerApiDeliveriesTable } from "@/components/features/admin/reseller-api/ResellerApiDeliveriesTable";
import { ResellerApiOverviewCards } from "@/components/features/admin/reseller-api/ResellerApiOverviewCards";

export default function AdminResellerApiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reseller API</h1>
        <p className="text-muted-foreground">
          Monitor callback health, delivery attempts, and circuit breaker state.
        </p>
      </div>

      <ResellerApiOverviewCards />
      <ResellerApiDeliveriesTable />
      <ResellerApiCircuitBreakersPanel />
    </div>
  );
}
