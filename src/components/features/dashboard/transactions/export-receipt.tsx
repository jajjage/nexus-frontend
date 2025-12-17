"use client";

import type { Transaction } from "@/types/wallet.types";
import React from "react";

interface ExportReceiptProps {
  transaction: Transaction;
  operatorLogo?: string;
}

// Simplified export receipt with inline styles (no Tailwind to avoid color parsing issues)
export const ExportReceipt = React.forwardRef<
  HTMLDivElement,
  ExportReceiptProps
>(({ transaction, operatorLogo }, ref) => {
  const isDebit = transaction.direction === "debit";
  const formattedAmount = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  // Get operator logo - prioritize passed prop, then check transaction data
  const getLogoUrl = (): string | undefined => {
    // Priority 1: Use passed operator logo prop
    if (operatorLogo) return operatorLogo;

    // Priority 2: Check if operator info is in related.operator object
    if (transaction.related?.operator?.logoUrl) {
      return transaction.related.operator.logoUrl;
    }

    // Priority 3: Try to get from metadata
    if (transaction.metadata?.operatorLogo) {
      return transaction.metadata.operatorLogo;
    }

    // Priority 4: Default logos based on operator code
    const operatorCode = transaction.related?.operatorCode?.toLowerCase();
    const operatorName =
      transaction.related?.operator?.name?.toLowerCase() || operatorCode;

    const logos: Record<string, string> = {
      mtn: "https://logowik.com/content/uploads/images/mtn3122.jpg",
      airtel: "https://logowik.com/content/uploads/images/airtel4585.jpg",
      glo: "https://logowik.com/content/uploads/images/globacom-glo3852.jpg",
      "9mobile": "https://logowik.com/content/uploads/images/9mobile4667.jpg",
      etisalat: "https://logowik.com/content/uploads/images/etisalat1614.jpg",
    };

    // Try to match by operator code first
    if (operatorCode && logos[operatorCode]) {
      return logos[operatorCode];
    }

    // Try to match by operator name (partial match)
    for (const [key, url] of Object.entries(logos)) {
      if (operatorName && operatorName.includes(key)) {
        return url;
      }
    }

    return undefined;
  };

  const logoUrl = getLogoUrl();

  // Calculate cashback if applicable (assuming cashback is in metadata or related)
  // Priority 1: Use actual cashback data from transaction.related
  const cashbackEarned =
    parseFloat(transaction.related?.cashbackEarned || "0") ||
    parseFloat(transaction.metadata?.cashback_amount || "0") ||
    parseFloat(transaction.metadata?.cashback || "0") ||
    0;

  // cashbackUsed may exist at top-level `transaction.cashbackUsed` or in related
  const cashbackUsed =
    parseFloat(
      (transaction.related?.cashbackUsed as any) ||
        (transaction as any).cashbackUsed ||
        transaction.metadata?.cashback_used ||
        "0"
    ) || 0;

  const amountPaid =
    parseFloat(
      (transaction.related?.amountPaid as any) ||
        (transaction as any).amountPaid ||
        "0"
    ) || transaction.amount;

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#EAB308";
      case "completed":
      case "received":
        return "#22C55E";
      case "failed":
        return "#EF4444";
      case "cancelled":
        return "#9CA3AF";
      case "reversed":
        return "#F97316";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#D97706";
      case "completed":
      case "received":
        return "var(--color-primary)";
      case "failed":
        return "var(--color-destructive)";
      case "cancelled":
        return "#6B7280";
      case "reversed":
        return "#F97316";
      default:
        return "#374151";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: "var(--color-card)",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "var(--color-card-foreground)",
      }}
    >
      {/* Header - site logo + title */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/images/logo.svg"
            alt="Nexus"
            style={{ width: 36, height: "auto", objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                color: "var(--color-primary)",
              }}
            >
              Receipt
            </h1>
            <p
              style={{
                color: "var(--color-muted-foreground)",
                margin: 0,
                fontSize: 12,
              }}
            >
              {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div
        style={{
          marginBottom: "16px",
          padding: "16px",
          backgroundColor: "#EFF6FF",
          borderRadius: "8px",
          border: "1px solid #BFDBFE",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          {/* Left side - Icon and description */}
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                margin: "0 0 4px 0",
                color: "#1F2937",
              }}
            >
              {isDebit ? "Data Purchase" : "Credit Received"}
            </p>
            {transaction.related?.recipient_phone && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#666666",
                  margin: "0",
                }}
              >
                {transaction.related.recipient_phone}
              </p>
            )}
          </div>

          {/* Right side - Amount and status */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: "0 0 4px 0",
                color: isDebit
                  ? "var(--color-destructive)"
                  : "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: "translateY(1px)",
                }}
              >
                {isDebit ? "-" : "+"}
              </span>
              <span style={{ display: "inline-block" }}>{formattedAmount}</span>
            </p>
            {transaction.related?.status && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "capitalize",
                  color: getStatusTextColor(transaction.related.status),
                }}
              >
                {transaction.related.status}
              </div>
            )}
          </div>
        </div>

        {/* Operator Logo */}
        {logoUrl && transaction.relatedType === "topup_request" && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #BFDBFE",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#666666", fontWeight: "600" }}>
              Provider:
            </span>
            <img
              src={logoUrl}
              alt="operator"
              style={{ width: "20px", height: "20px", objectFit: "contain" }}
            />
            <span style={{ fontWeight: "600" }}>
              {transaction.related?.operatorCode?.toUpperCase() || "N/A"}
            </span>
          </div>
        )}
      </div>

      {/* Details Table */}
      <div style={{ marginBottom: "16px", fontSize: "12px" }}>
        {/* Transaction ID */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingBottom: "8px",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <span style={{ color: "#666666", fontWeight: "600" }}>TXN ID</span>
          <span style={{ fontFamily: "monospace" }}>{transaction.id}</span>
        </div>

        {/* Reference */}
        {transaction.reference && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <span style={{ color: "#666666", fontWeight: "600" }}>
              Reference
            </span>
            <span style={{ fontFamily: "monospace" }}>
              {transaction.reference}
            </span>
          </div>
        )}

        {/* Recipient Phone */}
        {(transaction.related?.recipient_phone ||
          (transaction as any).recipient_phone) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <span style={{ color: "#666666", fontWeight: "600" }}>
              Recipient
            </span>
            <span style={{ fontFamily: "monospace" }}>
              {transaction.related?.recipient_phone ||
                (transaction as any).recipient_phone}
            </span>
          </div>
        )}

        {/* Amount */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <span style={{ color: "#666666", fontWeight: "600" }}>Amount</span>
          <span style={{ fontWeight: "bold" }}>{formattedAmount}</span>
        </div>

        {/* Cashback Used - Show if user used cashback to pay */}
        {cashbackUsed > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px",
              borderBottom: "1px solid #E5E7EB",
              backgroundColor: "#F0FDF4",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#22C55E", fontWeight: "600" }}>
              Cashback Used
            </span>
            <span style={{ color: "#22C55E", fontWeight: "bold" }}>
              -₦{cashbackUsed.toLocaleString("en-NG")}
            </span>
          </div>
        )}

        {/* Amount Paid After Using Cashback */}
        {cashbackUsed > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <span style={{ color: "#666666", fontWeight: "600" }}>
              You Paid
            </span>
            <span style={{ fontWeight: "bold" }}>
              ₦{amountPaid.toLocaleString("en-NG")}
            </span>
          </div>
        )}

        {/* Cashback Earned - Show what user earned from this transaction */}
        {cashbackEarned > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px",
              borderBottom: "1px solid #E5E7EB",
              backgroundColor: "#EFF6FF",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#0284C7", fontWeight: "600" }}>
              Cashback Earned
            </span>
            <span style={{ color: "#0284C7", fontWeight: "bold" }}>
              +₦{cashbackEarned.toLocaleString("en-NG")}
            </span>
          </div>
        )}

        {/* Balance After */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <span style={{ color: "#666666", fontWeight: "600" }}>
            Balance After
          </span>
          <span style={{ fontWeight: "bold" }}>
            ₦{transaction.balanceAfter.toLocaleString("en-NG")}
          </span>
        </div>

        {/* Method */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <span style={{ color: "#666666", fontWeight: "600" }}>Method</span>
          <span style={{ textTransform: "capitalize" }}>
            {transaction.method}
          </span>
        </div>

        {/* Operator Info */}
        {transaction.related?.operatorCode && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <span style={{ color: "#666666", fontWeight: "600" }}>
              Operator
            </span>
            <span style={{ fontWeight: "600" }}>
              {transaction.related.operatorCode.toUpperCase()}
            </span>
          </div>
        )}

        {/* Type */}
        {transaction.related?.type && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
            }}
          >
            <span style={{ color: "#666666", fontWeight: "600" }}>Type</span>
            <span style={{ textTransform: "capitalize" }}>
              {transaction.related.type}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #E5E7EB",
          paddingTop: "12px",
          textAlign: "center",
          fontSize: "12px",
          color: "#999999",
        }}
      >
        <p style={{ margin: "0 0 4px 0" }}>Official Receipt</p>
        <p style={{ margin: "0", fontSize: "11px", color: "#AAAAAA" }}>
          Nexus Data
        </p>
      </div>
    </div>
  );
});

ExportReceipt.displayName = "ExportReceipt";
