import { CreateOperatorForm } from "@/components/features/admin/operators/CreateOperatorForm";

/**
 * Admin Create Operator Page
 * Route: /admin/dashboard/operators/new
 */
export default function AdminCreateOperatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Operator</h1>
        <p className="text-muted-foreground">
          Add a new network operator to the system.
        </p>
      </div>
      <CreateOperatorForm />
    </div>
  );
}
