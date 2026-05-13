export type BillCategoryType = "electricity" | "cable";
export type BillPaymentStatus =
  | "pending"
  | "success"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed"
  | "retry";

export interface AdminBillPayment {
  id: string;
  externalId?: string;
  userId: string;
  sourceChannel: "user_app" | "reseller_api";
  categoryType: BillCategoryType;
  billerId: string;
  supplierId?: string | null;
  supplierMappingId?: string | null;
  variationId?: string | null;
  customerIdentifier: string;
  customerName?: string | null;
  phone: string;
  amount: number;
  cost?: number | null;
  status: BillPaymentStatus;
  idempotencyKey: string;
  externalReference: string;
  providerReference?: string | null;
  validationPayload?: Record<string, unknown>;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  tokenPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  userEmail?: string;
  userFullName?: string | null;
  userPhoneNumber?: string | null;
  billerCode?: string;
  billerName?: string;
  billerSlug?: string;
  categoryCode?: string;
  categoryName?: string;
  categoryDomainType?: string;
  supplierName?: string | null;
  supplierSlug?: string | null;
  variationCode?: string | null;
  variationName?: string | null;
}

export interface AdminBillPaymentResponse {
  id: string;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierSlug?: string | null;
  responseCode?: string | null;
  responseMessage?: string | null;
  responsePayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminBillPaymentTransaction {
  id: string;
  walletId: string;
  userId: string;
  sourceChannel?: string;
  direction: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  method: string;
  reference?: string | null;
  metadata?: Record<string, unknown>;
  cashbackUsed?: number | null;
  productCode?: string | null;
  denomAmount?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface AdminBillPaymentDetail extends AdminBillPayment {
  responses: AdminBillPaymentResponse[];
  transaction: AdminBillPaymentTransaction | null;
}

export interface AdminBillPaymentsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryType?: string;
  billerCode?: string;
  supplierId?: string;
  userId?: string;
  sourceChannel?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminBillPaymentsListResponse {
  data: AdminBillPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminBillCategory {
  id: string;
  code: string;
  type: BillCategoryType;
  name: string;
  country: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminBiller {
  id: string;
  categoryId: string;
  categoryType: BillCategoryType;
  categoryCode?: string;
  code: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  requiresValidation: boolean;
  supportsVariations: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface AdminBillVariation {
  id: string;
  billerId: string;
  code: string;
  name: string;
  amount?: number | null;
  isFixedPrice: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface AdminSupplierBillerMapping {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierSlug: string;
  billerId: string;
  billerCode: string;
  billerName: string;
  categoryType: BillCategoryType;
  supplierServiceCode: string;
  supportsValidation: boolean;
  supportsVariations: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierBillerMappingPayload {
  supplierId: string;
  billerId: string;
  supplierServiceCode: string;
  supportsValidation: boolean;
  supportsVariations: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}
