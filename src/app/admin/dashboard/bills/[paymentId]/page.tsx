import { BillPaymentDetailView } from "@/components/features/admin/bills/BillPaymentDetailView";

export default function AdminBillPaymentDetailPage({
  params,
}: {
  params: { paymentId: string };
}) {
  return <BillPaymentDetailView paymentId={params.paymentId} />;
}
