import { CreateSettlementForm } from "@/components/features/admin/settlements/CreateSettlementForm";

/**
 * Admin Create Settlement Page
 * Route: /admin/dashboard/settlements/new
 */
export default function AdminCreateSettlementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Settlement</h1>
        <p className="text-muted-foreground">
          Record a new provider settlement.
        </p>
      </div>
      <CreateSettlementForm />
    </div>
  );
}
