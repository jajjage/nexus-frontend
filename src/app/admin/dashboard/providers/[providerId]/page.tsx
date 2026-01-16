import { ProviderDetailView } from "@/components/features/admin/providers";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  return <ProviderDetailView providerId={providerId} />;
}
