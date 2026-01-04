"use client";

import type { Transaction } from "@/types/wallet.types";
import React from "react";

interface ExportReceiptProps {
  transaction: Transaction;
  operatorLogo?: string;
}

// Get status text color
const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "received":
      return "#166534"; // green-800
    case "pending":
      return "#B45309"; // amber-700
    case "failed":
      return "#991B1B"; // red-800
    case "cancelled":
      return "#374151"; // gray-700
    case "reversed":
      return "#9A3412"; // orange-800
    default:
      return "#374151";
  }
};

// Get operator logo
const getOperatorLogo = (
  transaction: Transaction,
  passedLogo?: string
): string | undefined => {
  if (passedLogo) return passedLogo;

  if (transaction.related?.operator?.logoUrl) {
    return transaction.related.operator.logoUrl;
  }

  if (transaction.metadata?.operatorLogo) {
    return transaction.metadata.operatorLogo;
  }

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

// Helper to get transaction cashback label
const getCashbackUsed = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    const cashbackUsed = transaction.cashbackUsed || 0;
    return cashbackUsed.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    });
  }
  return transaction.cashbackUsed.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  });
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

// Get transaction description
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

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (dateObj instanceof Date && isNaN(dateObj.getTime())) {
      console.warn(`Invalid date received: ${date}`);
      return "Invalid Date";
    }

    return dateObj.toLocaleString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn(`Error parsing date: ${date}`, error);
    return "Invalid Date";
  }
};

// Helper to detect if a transaction is for data (with fallback for incorrect backend type)
const isDataTransaction = (transaction: Transaction): boolean => {
  // First check the related.type from backend
  if (transaction.related?.type?.toLowerCase() === "data") {
    return true;
  }

  // Fallback: Check productCode patterns that indicate data products
  const productCode = (transaction.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];

  return dataPatterns.some((pattern) => productCode.includes(pattern));
};

// Helper to get service type label with smart detection
const getServiceTypeLabel = (transaction: Transaction): string => {
  return isDataTransaction(transaction) ? "Data Bundle" : "Airtime";
};

export const ExportReceipt = React.forwardRef<
  HTMLDivElement,
  ExportReceiptProps
>(({ transaction, operatorLogo }, ref) => {
  const isCredit = transaction.direction === "credit";

  // For topup transactions, show product name in main display
  // Uses smart detection that checks productCode patterns as fallback
  const isDataProduct = isDataTransaction(transaction);
  const isTopupRequest = transaction.relatedType === "topup_request";

  // Main display: For topups show product name, for other transactions show amount
  let formattedAmount: string;
  if (isTopupRequest) {
    if (isDataProduct) {
      // Data: Show product code/name
      formattedAmount =
        transaction.productCode ||
        transaction.related?.productCode ||
        "Data Bundle";
    } else {
      // Airtime: Show "MTN ₦100 Airtime" format
      const operator =
        transaction.related?.operatorCode?.toUpperCase() || "Unknown";
      const denom = transaction.denomAmount
        ? `₦${transaction.denomAmount.toLocaleString()}`
        : "";
      formattedAmount = `${operator} ${denom} Airtime`;
    }
  } else {
    // Other transactions: show amount
    formattedAmount = transaction.amount.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });
  }

  const formattedAmountPaid = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const logoUrl = getOperatorLogo(transaction, operatorLogo);
  const statusColor = getStatusColor(transaction.related?.status || "pending");

  const operatorName =
    transaction.productCode || transaction.productCode || "N/A";

  return (
    <div
      ref={ref}
      style={{
        width: "400px", // Fixed width for export consistency
        backgroundColor: "#ffffff",
        padding: "32px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        color: "#1F2937",
        border: "1px solid #E5E7EB",
      }}
    >
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        {/* Logo */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 16px auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F9FAFB",
            borderRadius: "50%",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          {transaction.relatedType === "topup_request" && logoUrl ? (
            <img
              src={logoUrl}
              alt="operator"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : isCredit ? (
            <span
              style={{ fontSize: "14px", fontWeight: "bold", color: "#166534" }}
            >
              IN
            </span>
          ) : (
            <span
              style={{ fontSize: "24px", fontWeight: "bold", color: "#9CA3AF" }}
            >
              #
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 4px 0",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#111827",
          }}
        >
          {getTransactionTypeLabel(transaction)}
        </h2>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          {getTransactionDescription(transaction)}
        </p>
      </div>

      {/* Amount Section */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "36px",
            fontWeight: "bold",
            color: "#111827",
            letterSpacing: "-0.5px",
          }}
        >
          {formattedAmount}
        </h1>

        {/* Status as Text */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: statusColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {transaction.related?.status || "PENDING"}
        </div>

        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "2px dashed #E5E7EB",
          margin: "0 0 24px 0",
        }}
      />

      {/* Details Section */}
      <div>
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Transaction Details
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {transaction.related?.recipient_phone && (
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: "#6B7280",
                  }}
                >
                  Recipient Phone
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  {transaction.related.recipient_phone}
                </td>
              </tr>
            )}

            {transaction.amount && (
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: "#6B7280",
                  }}
                >
                  Amount Paid
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  {formattedAmountPaid}
                </td>
              </tr>
            )}

            {transaction.relatedType === "topup_request" && (
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: "#6B7280",
                  }}
                >
                  Cashback Used
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#EF4444",
                  }}
                >
                  -{getCashbackUsed(transaction)}
                </td>
              </tr>
            )}

            {transaction.relatedType === "topup_request" && (
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: "#6B7280",
                    verticalAlign: "top",
                  }}
                >
                  Service
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "right",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {getServiceTypeLabel(transaction)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>
                    {operatorName}
                  </div>
                </td>
              </tr>
            )}

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontSize: "14px",
                  color: "#6B7280",
                }}
              >
                Transaction ID
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#374151",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {transaction.id}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          textAlign: "center",
          borderTop: "1px solid #E5E7EB",
          paddingTop: "16px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "#9CA3AF",
            fontWeight: "500",
          }}
        >
          nexus-data.com
        </p>
      </div>
    </div>
  );
});

ExportReceipt.displayName = "ExportReceipt";
