import { Badge } from "@/components/ui/badge";

export function BillPaymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "success" || normalized === "completed"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-transparent"
      : normalized === "failed" || normalized === "cancelled"
        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-transparent"
        : normalized === "reversed"
          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-transparent"
          : normalized === "pending"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-transparent"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-transparent";

  return (
    <Badge variant="outline" className={`capitalize ${className}`}>
      {status}
    </Badge>
  );
}
