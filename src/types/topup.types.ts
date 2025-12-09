export interface TopupRequest {
  amount: number;
  productCode: string;
  recipientPhone: string;
  pin: number;
  supplierSlug?: string;
  supplierMappingId?: string;
  useCashback?: boolean;
}

export interface TopupResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    status: string;
    amount: number;
    balance: number;
    [key: string]: any;
  };
}
