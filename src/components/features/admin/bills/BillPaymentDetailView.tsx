"use client";

import { BillPaymentStatusBadge } from "@/components/features/admin/bills/BillPaymentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminBillPayment } from "@/hooks/admin/useAdminBillPayments";
import { format } from "date-fns";
import { ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function JsonBlock({ value }: { value?: unknown }) {
  if (
    !value ||
    (typeof value === "object" && Object.keys(value).length === 0)
  ) {
    return <p className="text-muted-foreground text-sm">No payload</p>;
  }

  return (
    <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium break-words">
        {value || "-"}
      </span>
    </div>
  );
}

export function BillPaymentDetailView({ paymentId }: { paymentId: string }) {
  const { data, isLoading, isError } = useAdminBillPayment(paymentId);
  const payment = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Bill payment not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/dashboard/bills">Back to bills</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const copyReference = async () => {
    await navigator.clipboard.writeText(payment.externalReference);
    toast.success("Reference copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/admin/dashboard/bills">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Bill Payment</h1>
          <p className="text-muted-foreground">
            {payment.billerName || payment.billerCode} •{" "}
            {payment.customerIdentifier}
          </p>
        </div>
        <BillPaymentStatusBadge status={payment.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Amount" value={formatCurrency(payment.amount)} />
            <DetailRow
              label="Cost"
              value={
                payment.cost === null || payment.cost === undefined
                  ? "-"
                  : formatCurrency(payment.cost)
              }
            />
            <DetailRow
              label="Category"
              value={
                <Badge className="capitalize">{payment.categoryType}</Badge>
              }
            />
            <DetailRow label="Biller" value={payment.billerName} />
            <DetailRow
              label="Variation"
              value={payment.variationName || payment.variationCode}
            />
            <DetailRow
              label="Supplier"
              value={payment.supplierName || payment.supplierSlug}
            />
            <DetailRow
              label="Created"
              value={format(new Date(payment.createdAt), "PP p")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Name"
              value={payment.customerName || "Unverified"}
            />
            <DetailRow label="Identifier" value={payment.customerIdentifier} />
            <DetailRow label="Phone" value={payment.phone} />
            <DetailRow
              label="User"
              value={payment.userFullName || payment.userEmail}
            />
            <DetailRow label="Email" value={payment.userEmail} />
            <DetailRow label="User Phone" value={payment.userPhoneNumber} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="External Reference"
              value={
                <button
                  className="inline-flex items-center gap-1 text-right"
                  onClick={copyReference}
                >
                  {payment.externalReference}
                  <Copy className="h-3 w-3" />
                </button>
              }
            />
            <DetailRow
              label="Provider Reference"
              value={payment.providerReference}
            />
            <DetailRow label="Idempotency Key" value={payment.idempotencyKey} />
            <DetailRow label="Payment ID" value={payment.id} />
          </CardContent>
        </Card>
      </div>

      {payment.transaction && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="capitalize">
                      {payment.transaction.direction}
                    </TableCell>
                    <TableCell>{payment.transaction.method}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(payment.transaction.balanceAfter)}
                    </TableCell>
                    <TableCell>
                      {payment.transaction.reference || "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.transaction.createdAt), "PP p")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supplier Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.responses.length ? (
            <div className="space-y-4">
              {payment.responses.map((response) => (
                <div key={response.id} className="rounded-md border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {response.supplierName ||
                          response.supplierSlug ||
                          "Supplier"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {format(new Date(response.createdAt), "PP p")}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {response.responseCode || "No code"}
                    </Badge>
                  </div>
                  {response.responseMessage && (
                    <p className="mb-3 text-sm">{response.responseMessage}</p>
                  )}
                  <JsonBlock value={response.responsePayload} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No supplier responses.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Validation Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <JsonBlock value={payment.validationPayload} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Token Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <JsonBlock value={payment.tokenPayload} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
