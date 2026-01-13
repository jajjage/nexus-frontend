/**
 * Admin Analytics Types
 * TypeScript interfaces for analytics dashboard
 */

// Query parameters for date filtering
export interface DateRangeParams {
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
}

// 1. Key Business Metrics
export interface KeyMetrics {
  arpu: number; // Average Revenue Per User (Monthly)
  ltv: number; // Lifetime Value
  churnRate: string; // % of users inactive > 30 days
  payingUsers: number; // Total users with at least 1 successful payment
}

// 2. User Overview
export interface UserOverview {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  activeUsersThisWeek: number;
  suspendedUsers: number;
  trends: {
    userGrowthRate: string; // Week-over-week growth
    weekOverWeek: string; // e.g., "+45 users"
  };
}

// 3. Transaction Overview (Enhanced with reversed/processing)
export interface TransactionOverview {
  totalTransactions: number;
  totalValue: number;
  successRate: string;
  averageAmount: number;
  breakdownByStatus: {
    successful: number;
    failed: number;
    pending: number;
    reversed?: number;
    processing?: number;
  };
  valueByStatus?: {
    successful: number;
    failed: number;
    pending: number;
    reversed: number;
    processing: number;
  };
}

// 3b. GMV (Gross Merchandise Volume) Overview
export interface GmvOverview {
  totalGMV: number; // Total volume based on Face Value
  totalTransactions: number; // Total transaction count
  averageOrderValue: number; // Average order value (GMV / transactions)
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

// 6. Chart Data (Transactions by Type)
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
}

export interface ChartSummaryItem {
  type: string;
  displayName?: string;
  count: number;
  totalAmount: number;
  averageAmount?: number;
  percentage: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  summary: ChartSummaryItem[];
}

// Recharts-friendly format
export interface RechartsDataPoint {
  name: string;
  value: number;
  count?: number;
  amount?: number;
  fill?: string;
}

// ============================================================================
// NEW ANALYTICS ENDPOINTS
// ============================================================================

// 7. Today's Snapshot
export interface TodaySnapshot {
  transactions: {
    count: number;
    volume: number;
    profit: number;
    successful: number;
    failed: number;
    pending: number;
  };
  newUsers: number;
  activeUsers: number;
  walletDeposits: number;
  walletWithdrawals: number;
  revenueEstimate: number;
  comparedToYesterday: {
    transactionsDelta: number;
    transactionsDeltaPercent: string;
    volumeDelta: number;
    volumeDeltaPercent: string;
  };
}

// 8. Daily Metrics Time Series
export interface DailyMetricsParams extends DateRangeParams {
  granularity?: "day" | "week" | "month";
}

export interface DailyMetric {
  date: string;
  transactions: {
    count: number;
    volume: number;
    successCount: number;
    failedCount: number;
    reversedCount: number;
  };
  users: {
    newRegistrations: number;
    activeUsers: number;
  };
  wallet: {
    deposits: number;
    withdrawals: number;
    netFlow: number;
  };
  topups: {
    count: number;
    volume: number;
  };
}

// 9. Revenue & Profit Metrics
export interface RevenueMetrics {
  period: {
    from: string;
    to: string;
  };
  gmv: number;
  revenue: number;
  profit: number;
  profitMargin: string;
  costBreakdown: {
    supplierCosts: number;
    paymentFees: number;
    otherCosts: number;
  };
  revenueByProduct: Array<{
    productType: "data" | "airtime";
    operator: string;
    gmv: number;
    revenue: number;
    margin: string;
  }>;
}

// 10. Operator Performance
export interface OperatorPerformance {
  operators: Array<{
    name: string;
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
    avgResponseTime: number;
    trend: {
      volumeChange: string;
      successRateChange: string;
    };
  }>;
}

// 11. User Segments
export interface UserSegments {
  byActivity: {
    superActive: number;
    active: number;
    occasional: number;
    dormant: number;
    churned: number;
  };
  bySpend: {
    highValue: number;
    medium: number;
    low: number;
  };
  byRegistration: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    older: number;
  };
}
