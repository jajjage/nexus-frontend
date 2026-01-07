/**
 * Admin Supplier Markup Types
 * Based on ADMIN_GUIDE.md Supplier Markup Management section
 */

// ============= Supplier Markup Entity =============

export interface SupplierMarkup {
  markup(markup: any): unknown;
  id: string;
  supplierId: string;
  supplierName?: string;
  operatorProductId: string;
  operatorProductName?: string;
  markupPercent: number;
  validFrom: string;
  validUntil: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============= API Responses =============

export interface SupplierMarkupListResponse {
  markups: SupplierMarkup[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============= Query Parameters =============

export interface SupplierMarkupQueryParams {
  page?: number;
  limit?: number;
  supplierId?: string;
}

// ============= Request Types =============

export interface CreateSupplierMarkupRequest {
  supplierId: string;
  operatorProductId: string;
  markupPercent: number;
  validFrom: string;
  validUntil: string;
  description?: string;
}

export interface UpdateSupplierMarkupRequest {
  markupPercent?: number;
  validFrom?: string;
  validUntil?: string;
  description?: string;
}
