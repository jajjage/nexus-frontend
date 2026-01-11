"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  timestamp?: string;
}

interface TransactionTimelineProps {
  status: string;
  createdAt: string;
  completedAt?: string;
  transactionType?: string;
  className?: string;
}

// Get timeline steps based on transaction type
const getStepsForType = (
  transactionType: string | undefined,
  createdAt: string,
  completedAt?: string
): TimelineStep[] => {
  // Incoming payment - simple 2-step flow
  if (transactionType === "incoming_payment") {
    return [
      {
        status: "received",
        label: "Payment Received",
        description: "Payment received successfully.",
        timestamp: createdAt,
      },
      {
        status: "completed",
        label: "Wallet Credited",
        description: "Funds added to your wallet.",
        timestamp: completedAt,
      },
    ];
  }

  // Referral withdrawal - simple 2-step flow
  if (transactionType === "referral_withdrawal") {
    return [
      {
        status: "pending",
        label: "Withdrawal Initiated",
        description: "Referral bonus withdrawal requested.",
        timestamp: createdAt,
      },
      {
        status: "completed",
        label: "Funds Credited",
        description: "Bonus added to your wallet.",
        timestamp: completedAt,
      },
    ];
  }

  // Topup request - 3-step flow with provider processing
  if (transactionType === "topup_request") {
    return [
      {
        status: "pending",
        label: "Transaction Initiated",
        description: "We've received your request.",
        timestamp: createdAt,
      },
      {
        status: "processing",
        label: "Processing",
        description: "Working with provider to complete your top-up.",
      },
      {
        status: "completed",
        label: "Completed",
        description: "Transaction successful!",
        timestamp: completedAt,
      },
    ];
  }

  // Default - simple 2-step flow for generic transactions
  return [
    {
      status: "pending",
      label: "Transaction Initiated",
      description: "Transaction has been initiated.",
      timestamp: createdAt,
    },
    {
      status: "completed",
      label: "Completed",
      description: "Transaction completed successfully.",
      timestamp: completedAt,
    },
  ];
};

export function TransactionTimeline({
  status,
  createdAt,
  completedAt,
  transactionType,
  className,
}: TransactionTimelineProps) {
  const currentStatus = status.toLowerCase();
  const steps = getStepsForType(transactionType, createdAt, completedAt);

  const getStepState = (stepStatus: string, index: number) => {
    // Handle failed/cancelled/reversed states
    // Step 0 (Initiated) should always be "completed" since we received the request
    // Step 1+ should be failed if the transaction failed
    if (
      currentStatus === "failed" ||
      currentStatus === "cancelled" ||
      currentStatus === "reversed"
    ) {
      if (index === 0) return "completed"; // Initiated step succeeded
      return "failed"; // Processing and later steps failed
    }

    // Handle completed/received/success - all steps are done
    if (
      currentStatus === "completed" ||
      currentStatus === "received" ||
      currentStatus === "success"
    ) {
      return "completed";
    }

    // For 2-step timelines (incoming_payment, referral_withdrawal, default)
    if (steps.length === 2) {
      if (currentStatus === "pending") {
        return index === 0 ? "completed" : "active";
      }
      return index === 0 ? "completed" : "upcoming";
    }

    // For 3-step timelines (topup_request)
    if (currentStatus === "pending") {
      return index === 0 ? "completed" : index === 1 ? "active" : "upcoming";
    }

    if (currentStatus === "processing") {
      return index <= 1 ? "completed" : index === 2 ? "active" : "upcoming";
    }

    // For retry status - show as active/processing
    if (currentStatus === "retry") {
      return index === 0 ? "completed" : index === 1 ? "active" : "upcoming";
    }

    return "upcoming";
  };

  const formatDate = (date: string) => {
    try {
      const dateObj = new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn(`Invalid date received: ${date}`);
        return "Invalid Time";
      }

      return dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.warn(`Error parsing date: ${date}`, error);
      return "Invalid Time";
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      {steps.map((step, index) => {
        const state = getStepState(step.status, index);
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="relative flex gap-4">
            {!isLast && (
              <div
                className={cn(
                  "absolute top-8 left-[11px] h-[calc(100%-8px)] w-0.5 bg-slate-200",
                  state === "completed" && "bg-green-500"
                )}
              />
            )}

            <div className="relative z-10 flex flex-col items-center">
              {state === "completed" ? (
                <CheckCircle2 className="size-6 rounded-full bg-white text-green-500" />
              ) : state === "active" ? (
                <Loader2 className="text-primary size-6 animate-spin rounded-full bg-white" />
              ) : state === "failed" ? (
                <XCircle className="text-destructive size-6 rounded-full bg-white" />
              ) : (
                <div className="size-6 rounded-full border-2 border-slate-200 bg-white" />
              )}
            </div>

            <div className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    state === "active" ? "text-primary" : "text-slate-900"
                  )}
                >
                  {currentStatus === "failed" && isLast ? "Failed" : step.label}
                </h4>
                {step.timestamp && (
                  <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                    {formatDate(step.timestamp)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {currentStatus === "failed" && isLast
                  ? "Something went wrong with this transaction."
                  : step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
