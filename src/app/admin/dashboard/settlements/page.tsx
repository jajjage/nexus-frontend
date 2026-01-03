import { SettlementListTable } from "@/components/features/admin/settlements/SettlementListTable";

/**
 * Admin Settlements List Page
 * Route: /admin/dashboard/settlements
 */
export default function AdminSettlementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Settlement Management
        </h1>
        <p className="text-muted-foreground">
          View and manage provider settlements.
        </p>
      </div>
      <SettlementListTable />
    </div>
  );
}
