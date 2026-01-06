import { ProviderDetailView } from "@/components/features/admin/providers";

export default function ProviderDetailPage({
  params,
}: {
  params: { providerId: string };
}) {
  return <ProviderDetailView providerId={params.providerId} />;
}
