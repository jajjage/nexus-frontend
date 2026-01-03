import { ProductDetailView } from "@/components/features/admin/products/ProductDetailView";

/**
 * Admin Product Detail Page
 * Route: /admin/dashboard/products/[productId]
 */
export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ProductDetailView productId={productId} />;
}
