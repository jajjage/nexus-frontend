import { OperatorListTable } from "@/components/features/admin/operators/OperatorListTable";

/**
 * Admin Operators List Page
 * Route: /admin/dashboard/operators
 */
export default function AdminOperatorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Operator Management
        </h1>
        <p className="text-muted-foreground">
          Manage network operators in the system.
        </p>
      </div>
      <OperatorListTable />
    </div>
  );
}
