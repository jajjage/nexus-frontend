# Mobile Transaction Page Guide

This is a comprehensive guide covering the Transaction List, Transaction Detail (Receipt), Filters, Share functionality, and the Status Timeline.

---

## 1. Transaction List Page

**Route:** `/dashboard/transactions`

### Features

1.  **Infinite Scroll Pagination:** Uses `useInfiniteTransactions()` hook.
2.  **Client-Side Filtering:** Filters by search query and transaction direction (All, Debit, Credit).
3.  **Date Grouping:** Transactions are grouped by date (e.g., "January 20, 2026").

### Key Logic (Client-Side)

```typescript
// Filter transactions
const filtered = allTransactions.filter((tx) => {
  const queryMatch =
    query.length > 2
      ? JSON.stringify(tx).toLowerCase().includes(query.toLowerCase())
      : true;
  const directionMatch = direction === "all" || tx.direction === direction;
  return queryMatch && directionMatch;
});

// Group by date
const grouped = filtered.reduce((acc, tx) => {
  const date = format(new Date(tx.createdAt), "yyyy-MM-dd");
  if (!acc[date]) acc[date] = [];
  acc[date].push(tx);
  return acc;
}, {});
```

### Hooks

| Hook                        | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `useInfiniteTransactions()` | Fetches transactions with pagination       |
| `useTransaction(id)`        | Fetches single transaction for detail page |

---

## 2. Nested Transaction Data Structure

A `Transaction` object represents a **wallet ledger entry** (debit or credit). The actual **details** of what the transaction was for (e.g., an Airtime purchase, a Refund, an Incoming Payment) are stored in a **nested child object** called `related`.

### TypeScript Interface

```typescript
interface Transaction {
  id: string;
  direction: "debit" | "credit"; // Was money subtracted or added?
  amount: number; // Amount in Naira
  balanceAfter: number; // Wallet balance after this transaction
  method: string; // e.g., "wallet"
  reference?: string; // Unique reference string

  // --- Nesting Info ---
  relatedType?: string; // Type of child: "topup_request", "incoming_payment", etc.
  relatedId?: string; // UUID of the child object
  related?: RelatedTransactionInfo; // The actual nested child object

  // --- Other Fields ---
  cashbackUsed: number;
  productCode?: string; // e.g., "MTN-1GB-30DAY"
  denomAmount: number; // Face value (for Airtime/Data)
  note?: string;
  createdAt: Date;
}
```

### The `related` Child Object

The `related` field is **polymorphic**. Its shape depends on `relatedType`.

```typescript
type RelatedTransactionInfo = {
  status:
    | "pending"
    | "completed"
    | "failed"
    | "cancelled"
    | "reversed"
    | "retry"
    | "received";
  recipient_phone?: string; // For topup_request
  operatorCode?: string; // e.g., "MTN", "AIRTEL"
  type?: string; // "airtime" or "data"
  // ...other fields specific to the related type
};
```

### Why This Matters

| Field                           | Where to Get It                                                           |
| ------------------------------- | ------------------------------------------------------------------------- |
| **Status Badge**                | `transaction.related.status`                                              |
| **Recipient Phone**             | `transaction.related.recipient_phone`                                     |
| **Operator (MTN/Glo)**          | `transaction.related.operatorCode`                                        |
| **Product Type (Airtime/Data)** | `transaction.related.type` OR smart-detect from `transaction.productCode` |
| **Transaction Amount**          | `transaction.amount` (parent)                                             |
| **Transaction Direction**       | `transaction.direction` (parent)                                          |

### Example: Accessing Status

```typescript
// DO NOT use transaction.status
// DO use transaction.related?.status
const status = transaction.related?.status || "pending";
```

### Handling Different `relatedType` Values

| `relatedType`         | Description                    | Key `related` Fields                                |
| --------------------- | ------------------------------ | --------------------------------------------------- |
| `topup_request`       | Airtime/Data purchase          | `status`, `recipient_phone`, `operatorCode`, `type` |
| `incoming_payment`    | Wallet funding (bank transfer) | `status`                                            |
| `outgoing_payment`    | Admin debit                    | `status`                                            |
| `referral_withdrawal` | Referral bonus payout          | `status`                                            |

---

## 3. Transaction Item (List Row)

Each row in the list displays key information.

### Icon Logic

| Condition                                                  | Icon        | Color  |
| ---------------------------------------------------------- | ----------- | ------ |
| `direction=debit` + `relatedType=topup_request` + `isData` | `Wifi`      | Purple |
| `direction=debit` + `relatedType=topup_request` (Airtime)  | `Phone`     | Blue   |
| `direction=debit` (other)                                  | `ArrowUp`   | Red    |
| `direction=credit`                                         | `ArrowDown` | Green  |

### Status Badge Colors

| Status                                         | Color  |
| ---------------------------------------------- | ------ |
| `pending`                                      | Yellow |
| `completed`, `success`, `received`, `refunded` | Green  |
| `failed`                                       | Red    |
| `cancelled`                                    | Gray   |
| `reversed`                                     | Orange |
| `retry`                                        | Blue   |

### Display Logic

- **Airtime:** "MTN ₦100 Airtime" + "to MTN (08012345678)"
- **Data:** Product Code (e.g., "MTN-1GB-30DAY") + "to MTN (08012345678)"
- **Incoming Payment:** "Incoming Payment" / "Wallet top-up"
- **Outgoing Payment:** "Wallet Debit" / "Admin deduction"

---

## 4. Transaction Detail / Receipt Page

**Route:** `/dashboard/transactions/[id]`

### Layout

1.  **Header:** Operator Logo (or generic icon), Transaction Type Label (e.g., "Airtime Purchase"), Description.
2.  **Amount Display:** Large, centered amount text.
3.  **Status Pill:** Icon + Label (e.g., `CheckCircle2` + "Successful").
4.  **Status Timeline:** Visual step-by-step progress.
5.  **Details Section:** Key-value pairs (Recipient, Amount Paid, Cashback Used, Service, Reference, Transaction ID).
6.  **Share Button:** Opens Share Dialog.

### Operator Logo URLs (Hardcoded)

| Operator | Logo URL                                                      |
| -------- | ------------------------------------------------------------- |
| MTN      | `https://upload.wikimedia.org/wikipedia/.../New-mtn-logo.jpg` |
| Airtel   | `https://upload.wikimedia.org/wikipedia/.../Airtel_logo.svg`  |
| Glo      | `https://upload.wikimedia.org/wikipedia/.../Glo_button.png`   |
| 9Mobile  | `https://logosandtypes.com/.../9mobile-1.svg`                 |

### Status Configuration

```typescript

```

### Hooks & Data Fetching

Use `useTransaction(id)` to fetch the full details for this screen.

- **Hook:** `useTransaction(id)`
- **Endpoint:** `GET /user/wallet/transactions/:id`
- **Why fetch again?** The list view might have incomplete data (lite version). Always fetch fresh details for the receipt to ensure status is up-to-date (e.g., if a pending transaction just completed).

### Visual Layout (Mobile)

1.  **Header:** Navigation Bar ("Transaction Details").
2.  **Card Style:** A white card on a gray background (elevation/shadow).
3.  **Logo:** Circular operator logo centered at top.
4.  **Amount:** huge font (e.g., 32sp) below logo.
5.  **Status Badge:** Pill shape below amount.
6.  **Timeline:** Vertical step progress indicator (Initiated -> Processing -> Completed).
7.  **Key-Value Grid:**
    - Recipient: `08012345678`
    - Service: `MTN Airtime`
    - Date: `Jan 20, 2026, 10:30 AM`
    - Reference: `REF-12345` (with Copy button)
8.  **Share FAB/Button:** Floating action button or bottom full-width button "Share Receipt".

---

---

## 5. Transaction Timeline

Displays a visual step-by-step status tracker. Steps vary by transaction type.

### Step Configurations

| Transaction Type      | Steps                                            |
| --------------------- | ------------------------------------------------ |
| `topup_request`       | Initiated -> Processing -> Completed (or Failed) |
| `incoming_payment`    | Payment Received -> Wallet Credited              |
| `referral_withdrawal` | Withdrawal Initiated -> Funds Credited           |
| Default               | Initiated -> Completed                           |

### Visual States

| State       | Icon                          |
| ----------- | ----------------------------- |
| `completed` | `CheckCircle2` (Green)        |
| `active`    | `Loader2` (Spinning, Primary) |
| `failed`    | `XCircle` (Red)               |
| `upcoming`  | Empty Circle Border           |

---

## 6. Share Transaction Dialog

This allows users to share a receipt as an **Image** or **PDF**.

### Web Implementation

- Uses `html2canvas` to render the receipt component to a canvas.
- Uses `jsPDF` to generate a PDF from the canvas.
- Uses `navigator.share()` (Web Share API) to share the file natively.
- **Fallback:** If sharing is not supported (e.g., desktop browser), downloads the file and copies share text to clipboard.

### Mobile Implementation (Expo)

1.  **Capture View:** Use `react-native-view-shot` to capture the receipt view as an image URI.
2.  **Share Image:** Use `expo-sharing` (`Sharing.shareAsync(uri)`) to open the native share sheet.
3.  **PDF (Optional):** PDFs are typically not generated natively. Consider:
    - Using a server-side PDF generation endpoint.
    - Or simply stick to image sharing for mobile.

---

## 7. API Hooks Summary

**File:** `src/hooks/useWallet.ts`

| Hook                              | Query Key                                        | Purpose                            |
| --------------------------------- | ------------------------------------------------ | ---------------------------------- |
| `useInfiniteTransactions(params)` | `['wallet', 'transactions', params]`             | Paginated list for infinite scroll |
| `useTransactions(params)`         | `['wallet', 'transactions', params]`             | Simple list (e.g., for dashboard)  |
| `useTransaction(id)`              | `['wallet', 'transactions', id]`                 | Single transaction for detail page |
| `useRecentTransactions()`         | `['wallet', 'transactions', {page:1, limit:10}]` | Dashboard home list                |

---

## 8. Filtering Components

### Filter State

```typescript
interface TransactionFiltersState {
  query: string; // Search text
  direction: "all" | "debit" | "credit"; // Type filter
}
```

### Mobile UI

- **Search Input:** At top, with `Search` icon.
- **Type Filter:** Segmented Control or Picker.
