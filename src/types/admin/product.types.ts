/**
 * Admin Product Types
 * Based on ADMIN_GUIDE.md Product Management section
 */

// ============= Product Entity =============

export interface Product {
  id: string;
  operatorId: string;
  operatorName?: string;
  categoryId?: string | null;
  productCode: string;
  name: string;
  productType: string;
  denomAmount: number;
  dataMb?: number | null;
  validityDays?: number | null;
  isActive: boolean;
  hasCashback?: boolean;
  has_cashback?: boolean;
  cashbackPercentage?: number;
  cashback_percentage?: number;
  metadata?: Record<string, unknown>;
  slug?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Mappings array from API
  mappings?: SupplierProductMapping[];
}

// ============= Supplier Mapping Entity =============

export interface SupplierProductMapping {
  id: string;
  supplierId: string;
  operatorProductId: string;
  supplierProductCode: string;
  supplierPrice: string; // API returns as string
  minOrderAmount?: string;
  maxOrderAmount?: string;
  leadTimeSeconds?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Joined fields from API
  supplierName?: string;
  supplierSlug?: string;
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
  has_cashback?: boolean;
  cashback_percentage?: number;
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
  has_cashback?: boolean;
  cashback_percentage?: number;
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
