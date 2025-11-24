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
export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  direction: "debit" | "credit";
  amount: number;
  balanceAfter: number;
  method: string;
  reference?: string;
  relatedType?: string;
  relatedId?: string;
  metadata?: any;
  note?: string;
  createdAt: Date;
}

// ============= Request Types =============
export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  direction?: "debit" | "credit";
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
