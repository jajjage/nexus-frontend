import { ProviderListTable } from "@/components/features/admin/providers";

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Providers</h1>
        <p className="text-muted-foreground">
          Manage payment providers for virtual account generation and incoming
          payments.
        </p>
      </div>
      <ProviderListTable />
    </div>
  );
}
