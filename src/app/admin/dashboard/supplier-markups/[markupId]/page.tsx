import { SupplierMarkupDetailView } from "@/components/features/admin/supplier-markups/SupplierMarkupDetailView";

/**
 * Admin Supplier Markup Detail Page
 * Route: /admin/dashboard/supplier-markups/[markupId]
 */
export default async function AdminSupplierMarkupDetailPage({
  params,
}: {
  params: Promise<{ markupId: string }>;
}) {
  const { markupId } = await params;

  return <SupplierMarkupDetailView markupId={markupId} />;
}
