"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BulkTopupResponseData } from "@/types/reseller.types";
import { CheckCircle, Download, XCircle } from "lucide-react";

interface BulkTopupReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: BulkTopupResponseData;
  onClearBatch: () => void;
}

export function BulkTopupReport({
  open,
  onOpenChange,
  results,
  onClearBatch,
}: BulkTopupReportProps) {
  const {
    batchId,
    successCount,
    failedCount,
    totalCost,
    results: items,
  } = results;

  // Export results as CSV
  const handleExport = () => {
    const headers = ["Phone", "Product", "Status", "TopupID/Reason"];
    const rows = items.map((item) => [
      item.recipientPhone,
      item.productCode,
      item.status,
      item.status === "success" ? item.topupId : item.reason,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-topup-${batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    onClearBatch();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Report</DialogTitle>
          <DialogDescription>Batch ID: {batchId}</DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {successCount}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Successful
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {failedCount}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
          </div>
          <div className="bg-muted rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">
              ₦{totalCost.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">Total Cost</div>
          </div>
        </div>

        {/* Results Table */}
        <div className="max-h-[300px] overflow-y-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">
                    {item.recipientPhone}
                  </TableCell>
                  <TableCell>{item.productCode}</TableCell>
                  <TableCell>
                    {item.status === "success" ? (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-600"
                      >
                        <CheckCircle className="mr-1 size-3" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 size-3" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.status === "success" ? item.topupId : item.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
