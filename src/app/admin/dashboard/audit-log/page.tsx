import { AuditLogTable } from "@/components/features/admin/audit";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Track all admin actions and system changes
        </p>
      </div>
      <AuditLogTable />
    </div>
  );
}
