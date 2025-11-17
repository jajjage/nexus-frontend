// ============= Wallet Types =============
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// ============= Transaction Types =============
export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  PURCHASE = "PURCHASE",
  REFUND = "REFUND",
  TRANSFER = "TRANSFER",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============= Request Types =============
export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

export interface DepositRequest {
  amount: number;
  paymentMethod?: string;
}

export interface WithdrawalRequest {
  amount: number;
  bankAccount?: string;
}

// ============= Response Types =============
export interface WalletResponse {
  success: boolean;
  message: string;
  data: Wallet;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: Transaction;
}

export interface TransactionsListResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
