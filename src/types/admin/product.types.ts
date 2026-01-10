/**
 * Admin Product Types
 * Based on ADMIN_GUIDE.md Product Management section
 */

// ============= Product Entity =============

export interface Product {
  id: string;
  operatorId: string;
  operatorName?: string;
  productCode: string;
  name: string;
  productType: string;
  denomAmount: number;
  dataMb?: number;
  validityDays?: number;
  isActive: boolean;
  hasCashback?: boolean;
  cashbackPercentage?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// ============= Supplier Mapping Entity =============

export interface SupplierProductMapping {
  id: string;
  productId: string;
  supplierId: string;
  supplierName?: string;
  supplierProductCode: string;
  supplierPrice: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  leadTimeSeconds?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============= API Responses =============

export interface ProductListResponse {
  products: Product[];
}

export interface ProductWithMappingResponse {
  product: Product;
  mapping?: SupplierProductMapping;
}

// ============= Request Types =============

export interface CreateProductRequest {
  operatorId: string;
  productCode: string;
  name: string;
  productType: string;
  denomAmount: number;
  dataMb?: number;
  validityDays?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  // Cashback fields
  hasCashback?: boolean;
  cashbackPercentage?: number;
  // Category
  categoryId?: string;
  // Optional supplier mapping fields (creates mapping if provided)
  supplierId?: string;
  supplierProductCode?: string;
  supplierPrice?: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  leadTimeSeconds?: number;
  mappingIsActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  productCode?: string;
  productType?: string;
  denomAmount?: number;
  dataMb?: number;
  validityDays?: number;
  isActive?: boolean;
  hasCashback?: boolean;
  cashbackPercentage?: number;
  metadata?: Record<string, unknown>;
  // Category
  categoryId?: string;
}

export interface MapProductToSupplierRequest {
  supplierId: string;
  supplierProductCode: string;
  supplierPrice: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  leadTimeSeconds?: number;
  isActive?: boolean;
}

// ============= Query Parameters =============

export interface ProductQueryParams {
  operatorId?: string;
  productType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
