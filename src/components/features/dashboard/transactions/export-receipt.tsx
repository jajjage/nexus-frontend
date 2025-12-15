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

  const cashbackUsed =
    parseFloat(transaction.related?.cashbackUsed || "0") || 0;

  const amountPaid =
    parseFloat(transaction.related?.amountPaid || "0") || transaction.amount;

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

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: "#FFFFFF",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#000000",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            margin: "0 0 4px 0",
          }}
        >
          Receipt
        </h1>
        <p
          style={{
            color: "#666666",
            margin: "0",
            fontSize: "12px",
          }}
        >
          {formatDate(transaction.createdAt)}
        </p>
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
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
                color: isDebit ? "#EF4444" : "#22C55E",
              }}
            >
              {isDebit ? "-" : "+"}
              {formattedAmount}
            </p>
            {transaction.related?.status && (
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  marginTop: "4px",
                  backgroundColor: getStatusColor(transaction.related.status),
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: "600",
                  borderRadius: "4px",
                  textTransform: "capitalize",
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
              style={{
                width: "20px",
                height: "20px",
                objectFit: "contain",
              }}
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
          <span style={{ fontFamily: "monospace" }}>
            {transaction.id.slice(0, 16)}
          </span>
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
