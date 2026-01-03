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
