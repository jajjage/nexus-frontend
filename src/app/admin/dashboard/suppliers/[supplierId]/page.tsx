import { SupplierDetailView } from "@/components/features/admin/suppliers/SupplierDetailView";

/**
 * Admin Supplier Detail Page
 * Route: /admin/dashboard/suppliers/[supplierId]
 */
export default async function AdminSupplierDetailPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = await params;

  return <SupplierDetailView supplierId={supplierId} />;
}
