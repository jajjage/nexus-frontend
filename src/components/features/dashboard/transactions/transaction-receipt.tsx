"use client";

import type { Transaction } from "@/types/wallet.types";
import React from "react";

interface TransactionReceiptProps {
  transaction: Transaction;
  showLogo?: boolean;
  operatorLogo?: string;
}

// Get status badge styling
const getStatusBadgeStyle = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "pending":
      return { bg: "#FCD34D", color: "#92400E" }; // yellow/amber
    case "completed":
    case "received":
      return { bg: "#86EFAC", color: "#166534" }; // green
    case "failed":
      return { bg: "#FCA5A5", color: "#7F1D1D" }; // red
    case "cancelled":
      return { bg: "#D1D5DB", color: "#374151" }; // gray
    case "reversed":
      return { bg: "#FDBA74", color: "#92400E" }; // orange
    default:
      return { bg: "#D1D5DB", color: "#374151" };
  }
};

// Get operator logo
const getOperatorLogo = (transaction: Transaction): string | undefined => {
  const operatorCode = transaction.related?.operatorCode?.toLowerCase();

  const logos: Record<string, string> = {
    mtn: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg?20220217143058",
    airtel:
      "https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg",
    glo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Glo_button.png",
    "9mobile":
      "https://logosandtypes.com/wp-content/uploads/2020/10/9mobile-1.svg",
  };

  if (operatorCode && logos[operatorCode]) {
    return logos[operatorCode];
  }

  return undefined;
};

// Get transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  if (transaction.relatedType === "topup_request") {
    const type = transaction.related?.type?.toLowerCase() || "topup";
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Purchase`;
  }
  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }
  return transaction.direction === "debit" ? "Withdrawal" : "Deposit";
};

// Helper to get transaction cashback label
const getCashbackUsed = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    const cashbackUsed = transaction.cashbackUsed || 0;
    const formattedBalance = cashbackUsed.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formattedBalance;
  }
  const formattedBalance = transaction.cashbackUsed.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formattedBalance;
};

// Get transaction description (like "Airtime to MTN - 08135342817")
const getTransactionDescription = (transaction: Transaction): string => {
  if (transaction.relatedType === "topup_request") {
    const type = transaction.related?.type?.toLowerCase() || "topup";
    const operator =
      transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const phone = transaction.related?.recipient_phone || "N/A";
    return `${type.charAt(0).toUpperCase() + type.slice(1)} to ${operator} - ${phone}`;
  }
  return transaction.note || transaction.method || "Transaction";
};

// Format date
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TransactionReceipt = React.forwardRef<
  HTMLDivElement,
  TransactionReceiptProps
>(({ transaction, showLogo = true }, ref) => {
  const isCredit = transaction.direction === "credit";
  const formattedAmount = isCredit
    ? transaction.amount.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      })
    : `₦${transaction.denomAmount.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      })}`;

  const formattedAmountPaid = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const logoUrl = getOperatorLogo(transaction);
  const statusStyle = getStatusBadgeStyle(
    transaction.related?.status || "pending"
  );

  const operatorName =
    transaction.productCode || transaction.productCode || "N/A";

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        padding: "20px",
        maxWidth: 400,
        margin: "0 auto",
        boxSizing: "border-box",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: "#1F2937",
      }}
    >
      {/* Top: Operator Logo and Description */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {showLogo && transaction.relatedType === "topup_request" && logoUrl && (
          <img
            src={logoUrl}
            alt="operator"
            style={{
              height: 64,
              width: "auto",
              maxWidth: 100,
              objectFit: "contain",
              marginBottom: 8,
              borderRadius: 50,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        {/* Display Landmark icon for incoming payments */}
        {transaction.direction === "credit" &&
          transaction.relatedType === "incoming_payment" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="21" x2="21" y2="21" />
                <line x1="6" y1="18" x2="6" y2="21" />
                <line x1="10" y1="18" x2="10" y2="21" />
                <line x1="14" y1="18" x2="14" y2="21" />
                <line x1="18" y1="18" x2="18" y2="21" />
                <polygon points="12 2 20 7 20 18 4 18 4 7" />
                <line x1="7" y1="13" x2="17" y2="13" />
                <line x1="9" y1="9" x2="15" y2="9" />
              </svg>
            </div>
          )}
        <h2
          style={{
            margin: "0 0 4px 0",
            fontSize: 16,
            fontWeight: 600,
            color: "#1F2937",
          }}
        >
          {getTransactionTypeLabel(transaction)}
        </h2>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          {getTransactionDescription(transaction)}
        </p>
      </div>

      {/* Main Amount (Large, centered) */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <p
          style={{
            margin: 0,
            fontSize: 40,
            fontWeight: 700,
            color: "#1F2937",
          }}
        >
          {formattedAmount}
        </p>
      </div>

      {/* Status Badge (centered) */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        {transaction.related?.status && (
          <span
            style={{
              display: "inline-block",
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              padding: "4px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {transaction.related.status}
          </span>
        )}
      </div>

      {/* Date (centered) */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Transaction Details Section */}
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16 }}>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 11,
            fontWeight: 600,
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Transaction Details
        </p>

        <div style={{ marginTop: "8px" }}>
          {/* Recipient Phone */}
          {transaction.related?.recipient_phone && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: "1px solid #F3F4F6",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#6B7280" }}>Recipient Phone</span>
              <span style={{ fontWeight: 500, color: "#1F2937" }}>
                {transaction.related.recipient_phone}
              </span>
            </div>
          )}

          {/* Amount Paid */}
          {transaction.amount && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: "1px solid #F3F4F6",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#6B7280" }}>Amount Paid</span>
              <span style={{ fontWeight: 500, color: "#1F2937" }}>
                {formattedAmountPaid}
              </span>
            </div>
          )}
          {/* Cashback Used */}
          {transaction.relatedType === "topup-request" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: "1px solid #F3F4F6",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#6B7280" }}>Cashback Used</span>
              <span style={{ fontWeight: 500, color: "#1F2937" }}>
                -₦{getCashbackUsed(transaction)}
              </span>
            </div>
          )}
          {/* Service Type (Airtime/Data) */}
          {transaction.related?.type && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: "1px solid #F3F4F6",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#6B7280" }}>
                {transaction.related.type === "airtime"
                  ? "Airtime"
                  : transaction.related.type === "data"
                    ? "Data Bundle"
                    : "Service"}
              </span>
              <span style={{ fontWeight: 500, color: "#1F2937" }}>
                {operatorName}
              </span>
            </div>
          )}

          {/* Transaction ID */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#6B7280" }}>Transaction ID</span>
            <span
              style={{
                fontWeight: 500,
                color: "#1F2937",
                fontFamily: "monospace",
                fontSize: 12,
                wordBreak: "break-all",
              }}
            >
              {transaction.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

TransactionReceipt.displayName = "TransactionReceipt";
