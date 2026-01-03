import { OfferListTable } from "@/components/features/admin/offers/OfferListTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers | Admin Dashboard",
  description: "Manage promotional offers",
};

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Offer Management</h1>
        <p className="text-muted-foreground">
          Create and manage promotional offers for users.
        </p>
      </div>
      <OfferListTable />
    </div>
  );
}
