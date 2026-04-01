export interface Operator {
  name: string;
  code?: string;
  countryCode: string;
  logoUrl: string;
}

export interface SupplierOffer {
  mappingId: string;
  supplierId: string;
  supplierName: string;
  supplierSlug: string;
  supplierProductCode: string;
  supplierPrice: string;
  leadTimeSeconds: number;
}

export interface ActiveOffer {
  id: string;
  title: string;
  description?: string;
  discountType: "percentage" | "fixed_amount" | "fixed_price";
  discountValue: number;
}

/**
 * Product Category - Used to group products (e.g., "SME Data", "Gifting")
 */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

export interface Product {
  id: string;
  operatorId: string;
  productCode: string;
  name: string;
  productType: "airtime" | "data" | string;
  denomAmount: string | number | null;
  minAmount?: number;
  maxAmount?: number;
  dataMb: number | null;
  validityDays: number | null;
  isActive: boolean;
  has_cashback?: boolean;
  cashback_percentage?: number;
  metadata: Record<string, any>;
  slug?: string | null;
  createdAt: string;
  operator: Operator;
  supplierOffers: SupplierOffer[];
  // Category
  category?: ProductCategory;
  categoryId?: string;
  // Offer fields
  discountedPrice?: number;
  activeOffer?: ActiveOffer;
}

/**
 * Public Product type used for Reseller API product discovery
 * This is the type returned by GET /api/v1/products
 */
export type PublicProduct = Product;

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ProductsResponseData {
  products: Product[];
  pagination: Pagination;
}

export interface ProductQueryParams {
  page?: number;
  perPage?: number;
  productType?: "airtime" | "data" | "bill";
  operatorId?: string;
  search?: string;
  isActive?: boolean;
}
