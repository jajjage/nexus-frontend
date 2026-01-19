import { WebhookListTable } from "@/components/features/admin/webhooks/WebhookListTable";
import { WebhookStatsCards } from "@/components/features/admin/webhooks/WebhookStatsCards";

/**
 * Admin Webhooks List Page
 * Route: /admin/dashboard/webhooks
 */
export default function AdminWebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Webhook Reconciliation
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage incoming payment webhooks.
        </p>
      </div>
      <WebhookStatsCards />
      <WebhookListTable />
    </div>
  );
}
