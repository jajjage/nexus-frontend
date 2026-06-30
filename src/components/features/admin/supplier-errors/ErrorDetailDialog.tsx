"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SupplierErrorLog } from "@/types/admin/supplierErrors.types";
import { format } from "date-fns";
import {
  AlertTriangle,
  Server,
  Cpu,
  Database,
  Calendar,
  Layers,
  Key,
  Info,
} from "lucide-react";

interface ErrorDetailDialogProps {
  errorLog: SupplierErrorLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ErrorDetailDialog({
  errorLog,
  open,
  onOpenChange,
}: ErrorDetailDialogProps) {
  if (!errorLog) return null;

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "infrastructure":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50";
      case "supplier_resource":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-900/50";
      case "business_logic":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "infrastructure":
        return (
          <Server className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        );
      case "supplier_resource":
        return (
          <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        );
      case "business_logic":
      default:
        return <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getLaymanExplanationHeader = (type: string) => {
    switch (type) {
      case "infrastructure":
        return "Supplier Connection & Availability Issues";
      case "supplier_resource":
        return "Supplier SIM Card Out of Service";
      case "business_logic":
      default:
        return "Incorrect Order Details or Account Rules";
    }
  };

  const getStatusBadgeColor = (code?: number | null) => {
    if (!code)
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    if (code >= 500)
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (code >= 400)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <DialogTitle>Supplier Error Details</DialogTitle>
          </div>
          <DialogDescription>
            Detailed analysis of the supplier transaction failure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Layman Explanation Card - Premium Visual design */}
          <div className="border-primary/10 bg-primary/5 dark:bg-primary/5 rounded-xl border p-5">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 dark:bg-primary/25 mt-0.5 rounded-lg p-2">
                <Info className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-primary text-sm font-semibold sm:text-base">
                  {getLaymanExplanationHeader(errorLog.error_type)}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {errorLog.layman_explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-card space-y-1 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Server className="h-3.5 w-3.5" /> Supplier
              </span>
              <p className="text-sm font-medium capitalize">
                {errorLog.supplier_slug}
              </p>
            </div>
            <div className="bg-card space-y-1 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Layers className="h-3.5 w-3.5" /> Error Type
              </span>
              <div className="pt-0.5">
                <Badge
                  variant="outline"
                  className={getTypeBadgeColor(errorLog.error_type)}
                >
                  <span className="mr-1 flex items-center">
                    {getTypeIcon(errorLog.error_type)}
                  </span>
                  {errorLog.error_type.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="bg-card space-y-1 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Key className="h-3.5 w-3.5" /> Status Code
              </span>
              <div className="pt-0.5">
                <Badge className={getStatusBadgeColor(errorLog.status_code)}>
                  {errorLog.status_code || "N/A"}
                </Badge>
              </div>
            </div>
            <div className="bg-card space-y-1 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Calendar className="h-3.5 w-3.5" /> Time
              </span>
              <p className="text-xs font-medium sm:text-sm">
                {format(new Date(errorLog.created_at), "MMM d, yyyy HH:mm:ss")}
              </p>
            </div>
          </div>

          {/* User friendly & Raw Message */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <h5 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Friendly Message
              </h5>
              <div className="bg-muted/30 rounded-lg border p-3 text-sm font-medium">
                {errorLog.user_friendly_message}
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Raw Supplier Response
              </h5>
              <div className="bg-muted/60 max-h-40 overflow-y-auto rounded-lg border p-3 font-mono text-xs break-all">
                {errorLog.raw_message}
              </div>
            </div>
          </div>

          {/* Context Details (Phone, Amount, User, etc.) */}
          {errorLog.metadata && (
            <div className="space-y-2">
              <h5 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Transaction Context
              </h5>
              <div className="bg-card grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                {errorLog.metadata.phone && (
                  <div className="flex justify-between border-b pb-2 text-sm sm:border-none sm:pb-0">
                    <span className="text-muted-foreground">Phone Number</span>
                    <span className="font-mono font-medium">
                      {errorLog.metadata.phone}
                    </span>
                  </div>
                )}
                {errorLog.metadata.productCode && (
                  <div className="flex justify-between border-b pb-2 text-sm sm:border-none sm:pb-0">
                    <span className="text-muted-foreground">Product Code</span>
                    <span className="font-mono font-medium">
                      {errorLog.metadata.productCode}
                    </span>
                  </div>
                )}
                {errorLog.metadata.amount && (
                  <div className="flex justify-between border-b pb-2 text-sm sm:border-none sm:pb-0">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      ₦{Number(errorLog.metadata.amount).toLocaleString()}
                    </span>
                  </div>
                )}
                {errorLog.metadata.userId && (
                  <div className="flex justify-between border-b pb-2 text-sm sm:border-none sm:pb-0">
                    <span className="text-muted-foreground">User ID</span>
                    <span
                      className="max-w-[150px] truncate font-mono text-xs font-medium"
                      title={errorLog.metadata.userId}
                    >
                      {errorLog.metadata.userId}
                    </span>
                  </div>
                )}
                {errorLog.topup_request_id && (
                  <div className="col-span-2 mt-2 flex justify-between border-t border-b pt-2 pb-2 text-sm sm:border-none sm:pb-0">
                    <span className="text-muted-foreground">
                      Topup Request ID
                    </span>
                    <span className="font-mono text-xs font-medium">
                      {errorLog.topup_request_id}
                    </span>
                  </div>
                )}
                {errorLog.bill_payment_id && (
                  <div className="col-span-2 mt-2 flex justify-between border-t border-b pt-2 pb-2 text-sm sm:border-none sm:pb-0">
                    <span className="text-muted-foreground">
                      Bill Payment ID
                    </span>
                    <span className="font-mono text-xs font-medium">
                      {errorLog.bill_payment_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
