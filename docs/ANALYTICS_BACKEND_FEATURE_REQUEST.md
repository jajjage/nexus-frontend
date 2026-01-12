# Analytics Dashboard Backend Feature Request

**Date:** 2026-01-12
**Frontend Status:** Ready to implement once backend provides data
**Priority:** High

---

## Executive Summary

The current analytics dashboard lacks critical metrics for a financial app. This document outlines missing data points and suggested API enhancements for the backend team.

---

## 1. Transaction Status Breakdown (CRITICAL)

### Current State

```typescript
breakdownByStatus: {
  successful: number;
  failed: number;
  pending: number;
}
```

### Missing: `reversed` status

Financial apps need reversal tracking for refunds, chargebacks, and failed-then-refunded transactions.

### Requested Enhancement

**Endpoint:** `GET /admin/analytics/transactions/overview`

```typescript
breakdownByStatus: {
  successful: number;
  failed: number;
  pending: number;
  reversed: number; // NEW: Refunds and reversals
  processing: number; // NEW: Currently being processed
}
```

Also add value breakdown:

```typescript
valueByStatus: {
  successful: number; // Total ₦ value of successful
  failed: number; // Total ₦ value of failed
  pending: number; // Total ₦ value of pending
  reversed: number; // Total ₦ value of reversed
}
```

---

## 2. Daily Metrics Time Series (HIGH PRIORITY)

### Current State

No time series data available. Charts show cumulative totals only.

### Requested New Endpoint

**Endpoint:** `GET /admin/analytics/daily-metrics`

```typescript
interface DailyMetrics {
  date: string;              // YYYY-MM-DD
  transactions: {
    count: number;
    volume: number;          // Total ₦ value
    successCount: number;
    failedCount: number;
    reversedCount: number;   // NEW
  };
  users: {
    newRegistrations: number;
    activeUsers: number;     // Users who made at least 1 tx
    firstTimeTransactors: number;  // NEW: First-time buyers
  };
  wallet: {
    deposits: number;        // ₦ deposited
    withdrawals: number;     // ₦ withdrawn
    netFlow: number;         // deposits - withdrawals
  };
  topups: {
    count: number;
    volume: number;
    byOperator: Record<string, { count: number; volume: number }>;
  };
}

// Query params
?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&granularity=day|week|month
```

---

## 3. Today's Snapshot (QUICK WIN)

### Requested Enhancement

**Endpoint:** `GET /admin/analytics/today`

Quick summary of today's activity for dashboard header:

```typescript
interface TodaySnapshot {
  transactions: {
    count: number;
    volume: number;
    successful: number;
    failed: number;
    pending: number;
  };
  newUsers: number;
  activeUsers: number;
  walletDeposits: number;
  walletWithdrawals: number;
  revenueEstimate: number; // Profit margin * volume
  comparedToYesterday: {
    transactionsDelta: number; // +15 or -5
    transactionsDeltaPercent: string; // "+12%" or "-3%"
    volumeDelta: number;
    volumeDeltaPercent: string;
  };
}
```

---

## 4. Revenue & Profit Metrics (BUSINESS CRITICAL)

### Current State

GMV shows gross volume but no profit tracking.

### Requested Enhancement

**Endpoint:** `GET /admin/analytics/revenue`

```typescript
interface RevenueMetrics {
  period: {
    from: string;
    to: string;
  };
  gmv: number; // Gross Merchandise Volume
  revenue: number; // Net revenue (GMV - cost)
  profit: number; // Revenue - operating costs
  profitMargin: string; // "4.5%"
  costBreakdown: {
    supplierCosts: number; // Cost to suppliers
    paymentFees: number; // Paystack/Flutterwave fees
    otherCosts: number;
  };
  revenueByProduct: Array<{
    productType: "airtime" | "data";
    operator: string;
    gmv: number;
    revenue: number;
    margin: string;
  }>;
}
```

---

## 5. User Cohort & Retention (GROWTH METRICS)

### Current State

Basic user counts only. No retention or cohort analysis.

### Requested Enhancement

**Endpoint:** `GET /admin/analytics/users/retention`

```typescript
interface UserRetention {
  cohorts: Array<{
    cohortMonth: string; // "2026-01"
    usersRegistered: number;
    retention: {
      week1: string; // "85%"
      week2: string; // "72%"
      week4: string; // "58%"
      month2: string; // "42%"
      month3: string; // "35%"
    };
  }>;
  overall: {
    day7Retention: string; // "65%"
    day30Retention: string; // "42%"
    day90Retention: string; // "28%"
  };
}
```

**Endpoint:** `GET /admin/analytics/users/segments`

```typescript
interface UserSegments {
  byActivity: {
    superActive: number; // 10+ tx/month
    active: number; // 3-9 tx/month
    occasional: number; // 1-2 tx/month
    dormant: number; // 0 tx last 30 days
    churned: number; // 0 tx last 90 days
  };
  bySpend: {
    highValue: number; // >₦50,000/month
    medium: number; // ₦10,000-50,000/month
    low: number; // <₦10,000/month
  };
  byRegistration: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    older: number;
  };
}
```

---

## 6. Operator/Supplier Performance

### Current State

Basic topup breakdown by operator.

### Requested Enhancement

**Endpoint:** `GET /admin/analytics/operators/performance`

```typescript
interface OperatorPerformance {
  operators: Array<{
    name: string; // "MTN", "Airtel", etc.
    supplierSlug: string;
    transactions: {
      total: number;
      successful: number;
      failed: number;
      successRate: string;
    };
    volume: {
      total: number;
      successful: number;
    };
    avgResponseTime: number; // Seconds
    failureReasons: Array<{
      reason: string;
      count: number;
      percentage: string;
    }>;
    trend: {
      volumeChange: string; // "+15%" vs last period
      successRateChange: string;
    };
  }>;
}
```

---

## 7. Web Analytics (OPTIONAL - Future)

If tracking web visits becomes a priority:

### Suggested Endpoints

**Endpoint:** `GET /admin/analytics/web/overview`

```typescript
interface WebAnalytics {
  period: { from: string; to: string };
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  avgSessionDuration: string; // "2m 34s"
  bounceRate: string; // "45%"
  topPages: Array<{
    path: string;
    views: number;
    avgTimeOnPage: string;
  }>;
  trafficSources: Array<{
    source: string; // "Direct", "Google", "Facebook"
    visits: number;
    percentage: string;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  conversionFunnel: {
    visitors: number;
    registered: number;
    firstPurchase: number;
    repeatPurchase: number;
  };
}
```

> **Note:** This requires frontend tracking implementation (e.g., custom events or integration with analytics service).

---

## 8. Real-time Activity Feed

### Suggested Enhancement to Existing Endpoint

**Endpoint:** `GET /admin/analytics/activity/recent`

```typescript
interface RecentActivity {
  activities: Array<{
    id: string;
    type: "transaction" | "registration" | "deposit" | "withdrawal" | "support";
    timestamp: string;
    summary: string; // "User john@example.com purchased MTN 1GB"
    userId?: string;
    amount?: number;
    status?: string;
  }>;
  lastUpdated: string;
}
```

---

## Summary Table

| Feature                | Priority    | Type             | Endpoint                 |
| ---------------------- | ----------- | ---------------- | ------------------------ |
| Reversed transactions  | 🔴 Critical | Enhance existing | `/transactions/overview` |
| Daily time series      | 🔴 Critical | New endpoint     | `/daily-metrics`         |
| Today's snapshot       | 🟡 High     | New endpoint     | `/today`                 |
| Revenue/profit metrics | 🟡 High     | New endpoint     | `/revenue`               |
| User retention         | 🟢 Medium   | New endpoint     | `/users/retention`       |
| User segments          | 🟢 Medium   | New endpoint     | `/users/segments`        |
| Operator performance   | 🟢 Medium   | Enhance/New      | `/operators/performance` |
| Web analytics          | ⚪ Low      | New endpoint     | `/web/overview`          |
| Activity feed          | ⚪ Low      | Enhance          | `/activity/recent`       |

---

## Implementation Notes

1. **Caching:** Daily metrics can be cached aggressively (1 hour+). Today's snapshot needs 5-minute refresh.

2. **Date Filtering:** All endpoints should support `fromDate` and `toDate` query params.

3. **Response Format:** Keep consistent with existing `ApiResponse<T>` wrapper.

4. **Backwards Compatibility:** When enhancing existing endpoints, ensure new fields are optional to avoid breaking changes.
