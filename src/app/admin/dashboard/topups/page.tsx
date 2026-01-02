import { TopupListTable } from "@/components/features/admin/topups/TopupListTable";

/**
 * Admin Topup Requests List Page
 * Route: /admin/dashboard/topups
 */
export default function AdminTopupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Topup Requests</h1>
        <p className="text-muted-foreground">
          Manage and monitor user topup requests.
        </p>
      </div>
      <TopupListTable />
    </div>
  );
}
