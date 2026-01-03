# Frontend Integration Guide: Analytics System

This guide provides a comprehensive reference for integrating the Nexus Data backend analytics system into the frontend application. It covers available endpoints, data types, and best practices for visualization and performance.

## 🚀 Overview

The analytics system has been optimized for high performance using **Redis caching**. Most "overview" endpoints (e.g., user counts, transaction totals) are cached for **5 minutes**, while the new "Key Metrics" (ARPU, LTV) are cached for **1 hour**.

**Key Features:**

- **Performance:** Fast response times for dashboards via server-side caching.
- **Business Intelligence:** New endpoints for ARPU, LTV, and Churn Rate.
- **Granularity:** Support for date filtering (`fromDate`, `toDate`) on most endpoints.

---

## 📡 Endpoints Reference

Base URL: `/api/v1/admin/analytics`
Authentication: Required (`Bearer <token>`)
Role: `admin`

### 1. Key Business Metrics (New!)

**Endpoint:** `GET /key-metrics`
**Description:** High-level business KPIs for the executive dashboard.
**Cache:** 1 hour.

**Response:**

```json
{
  "status": "success",
  "data": {
    "arpu": 1250.5, // Average Revenue Per User (Monthly)
    "ltv": 5400.0, // Lifetime Value
    "churnRate": "2.5%", // % of users inactive > 30 days
    "payingUsers": 1250 // Total users with at least 1 successful payment
  }
}
```

### 2. User Overview

**Endpoint:** `GET /users/overview`
**Description:** User growth, activity, and suspension stats.
**Cache:** 5 minutes.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalUsers": 5000,
    "newUsersThisMonth": 150,
    "newUsersThisWeek": 45,
    "activeUsersThisWeek": 3200,
    "suspendedUsers": 12,
    "trends": {
      "userGrowthRate": "5.2%", // Week-over-week growth
      "weekOverWeek": "+45 users"
    }
  }
}
```

### 3. Transaction Overview

**Endpoint:** `GET /transactions/overview`
**Query Params:** `fromDate` (YYYY-MM-DD), `toDate` (YYYY-MM-DD)
**Description:** Aggregate transaction volume and success rates.
**Cache:** 5 minutes (dynamic key based on dates).

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalTransactions": 10000,
    "totalValue": 5000000.0,
    "successRate": "98.5%",
    "averageAmount": 500.0,
    "breakdownByStatus": {
      "successful": 9850,
      "failed": 100,
      "pending": 50
    }
  }
}
```

### 4. Topup Overview (Operator Stats)

**Endpoint:** `GET /topup/overview`
**Query Params:** `fromDate`, `toDate`
**Description:** Performance metrics specific to airtime/data topups.
**Cache:** 5 minutes.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalTopups": 8000,
    "totalValue": 400000.0,
    "successRate": "99.0%",
    "averageAmount": 50.0,
    "byOperator": {
      "MTN": 4000,
      "Airtel": 2500,
      "Glo": 1500
    },
    "topOperator": "MTN (50.0%)"
  }
}
```

### 5. Wallet Overview

**Endpoint:** `GET /wallet/overview`
**Description:** System-wide wallet balances and movement.
**Cache:** 5 minutes.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalBalance": 10000000.0,
    "totalDeposits": 5000000.0,
    "totalWithdrawals": 2000000.0,
    "netMovement": 3000000.0,
    "topHolders": [
      { "userId": "uuid...", "email": "user@example.com", "balance": 500000.0 }
    ]
  }
}
```

### 6. Charts Data (Transactions by Type)

**Endpoint:** `GET /transactions/by-type`
**Query Params:** `fromDate`, `toDate`
**Description:** Formatted data ready for Chart.js / Recharts.
**Cache:** No (Computed on demand).

**Response:**

```json
{
  "status": "success",
  "data": {
    "labels": ["Topup Request", "Bill Payment", "Transfer"],
    "datasets": [
      {
        "label": "Transaction Count",
        "data": [500, 200, 100],
        "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56"]
      }
    ],
    "summary": [
      {
        "type": "topup_request",
        "count": 500,
        "totalAmount": 25000,
        "percentage": 62
      }
    ]
  }
}
```

---

## 📦 TypeScript Definitions

Copy these interfaces into your frontend project (e.g., `src/types/analytics.ts`).

```typescript
// Common Response Wrapper
export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data: T;
}

// 1. Key Metrics
export interface KeyMetrics {
  arpu: number;
  ltv: number;
  churnRate: string;
  payingUsers: number;
}

// 2. User Overview
export interface UserOverview {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  activeUsersThisWeek: number;
  suspendedUsers: number;
  trends: {
    userGrowthRate: string;
    weekOverWeek: string;
  };
}

// 3. Transaction Overview
export interface TransactionOverview {
  totalTransactions: number;
  totalValue: number;
  successRate: string;
  averageAmount: number;
  breakdownByStatus: {
    successful: number;
    failed: number;
    pending: number;
  };
}

// 4. Topup Overview
export interface TopupOverview {
  totalTopups: number;
  totalValue: number;
  successRate: string;
  averageAmount: number;
  byOperator: Record<string, number>;
  topOperator: string;
}

// 5. Wallet Overview
export interface WalletOverview {
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netMovement: number;
  topHolders: Array<{
    userId: string;
    email: string;
    balance: number;
  }>;
}

// 6. Chart Data
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }>;
  summary: Array<{
    type: string;
    displayName: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
    percentage: number;
  }>;
}
```

---

## 🛠 Integration Best Practices

### 1. Caching Strategy (React Query / SWR)

Since the backend implements caching, the frontend should respect this to avoid unnecessary network requests.

**Recommendation:** Use `staleTime` of **5 minutes** for standard dashboards.

```typescript
// Example using React Query
const { data: userStats } = useQuery({
  queryKey: ["admin", "analytics", "users"],
  queryFn: fetchUserOverview,
  staleTime: 1000 * 60 * 5, // 5 minutes (matches backend cache)
  refetchOnWindowFocus: false,
});
```

### 2. Polling for Live Data

For "System Health" or critical transaction monitoring pages, you can poll more frequently, but be aware that the backend cache might still serve data up to 5 minutes old unless the endpoint specifically bypasses cache (currently configured for Overview endpoints).

_Note: `System Health` endpoint hits the DB directly for recent alerts, so it is safe to poll every 60 seconds._

### 3. Date Filtering

When passing dates, use `YYYY-MM-DD` string format.

```typescript
const params = new URLSearchParams({
  fromDate: "2025-01-01",
  toDate: "2025-01-31",
});
const url = `/api/v1/admin/analytics/transactions/overview?${params}`;
```

### 4. Visualization Libraries

The `/by-type` endpoints return data pre-formatted for **Chart.js**. If you are using **Recharts** (common in React), you may need to transform `data.labels` and `data.datasets` into an array of objects:

```typescript
// Helper to transform Chart.js format to Recharts format
const transformForRecharts = (chartData: ChartData) => {
  return chartData.labels.map((label, index) => ({
    name: label,
    count: chartData.datasets[0].data[index],
    amount: chartData.datasets[1].data[index],
  }));
};
```

---

## 🎨 Component Ideas

1.  **"Executive Scorecard" Component:**
    - Fetches `/key-metrics`.
    - Displays 4 large cards: ARPU, LTV, Active Users, Churn.
    - Visual: Use trend arrows (green/red) if you calculate diffs on frontend.

2.  **"Operator Performance" Pie Chart:**
    - Fetches `/topup/overview`.
    - Uses `data.byOperator` object.
    - Visual: Pie chart showing market share of MTN vs Airtel vs Glo.

3.  **"Revenue Trend" Bar Chart:**
    - Fetches `/transactions/trends`.
    - Visual: Bar chart with Daily Revenue.

4.  **"Wallet Whale Watch" Table:**
    - Fetches `/wallet/overview`.
    - Displays `data.topHolders`.
    - Use Case: monitoring potential risk or high-value customers.
