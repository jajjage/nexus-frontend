"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

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
  className?: string;
}

export function TransactionTimeline({
  status,
  createdAt,
  completedAt,
  className,
}: TransactionTimelineProps) {
  const currentStatus = status.toLowerCase();

  const steps: TimelineStep[] = [
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

  const getStepState = (stepStatus: string, index: number) => {
    if (currentStatus === "failed" && index >= 1) return "failed";
    if (currentStatus === "cancelled" && index >= 1) return "failed";

    if (currentStatus === "completed" || currentStatus === "received")
      return "completed";

    if (currentStatus === "pending") {
      return index === 0 ? "completed" : index === 1 ? "active" : "upcoming";
    }

    if (currentStatus === "processing") {
      return index <= 1 ? "completed" : index === 2 ? "active" : "upcoming";
    }

    return "upcoming";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
                  {currentStatus === "failed" && index === 2
                    ? "Failed"
                    : step.label}
                </h4>
                {step.timestamp && (
                  <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                    {formatDate(step.timestamp)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {currentStatus === "failed" && index === 2
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
