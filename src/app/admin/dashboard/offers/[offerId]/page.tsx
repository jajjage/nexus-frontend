import { OfferDetailView } from "@/components/features/admin/offers/OfferDetailView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offer Details | Admin Dashboard",
  description: "View and manage offer details",
};

interface OfferDetailPageProps {
  params: Promise<{ offerId: string }>;
}

export default async function OfferDetailPage({
  params,
}: OfferDetailPageProps) {
  const { offerId } = await params;

  return <OfferDetailView offerId={offerId} />;
}
