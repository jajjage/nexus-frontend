import { WebhookDetailView } from "@/components/features/admin/webhooks/WebhookDetailView";

/**
 * Admin Webhook Detail Page
 * Route: /admin/dashboard/webhooks/[id]
 */
export default async function AdminWebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WebhookDetailView webhookId={id} />;
}
