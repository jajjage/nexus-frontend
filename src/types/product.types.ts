export interface Operator {
  name: string;
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

export interface Product {
  id: string;
  operatorId: string;
  productCode: string;
  name: string;
  productType: "airtime" | "data" | string;
  denomAmount: string;
  dataMb: number | null;
  validityDays: number | null;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  operator: Operator;
  supplierOffers: SupplierOffer[];
}

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
  limit?: number;
  type?: "airtime" | "data" | "bill";
  operatorId?: string;
  search?: string;
}
