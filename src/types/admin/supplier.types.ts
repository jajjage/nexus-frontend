/**
 * Admin Supplier Types
 * Based on ADMIN_GUIDE.md Supplier Management section
 */

// ============= Supplier Entity =============

export interface Supplier {
  id: string;
  name: string;
  slug: string;
  apiBase: string;
  apiKey?: string; // May be masked in responses
  priorityInt: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  parentSupplierId?: string | null;
  protocolFamilyId?: string | null;
  supplierKind?: "parent" | "child";
  isRoutable?: boolean;
}

// ============= API Responses =============

export interface SupplierListResponse {
  suppliers: Supplier[];
}

// ============= Request Types =============

export interface CreateSupplierRequest {
  name: string;
  slug: string;
  apiBase: string;
  apiKey: string;
  priorityInt: number;
  isActive: boolean;
  parentSupplierId?: string | null;
  protocolFamilyId?: string | null;
  supplierKind?: "parent" | "child";
}

export interface UpdateSupplierRequest {
  name?: string;
  apiBase?: string;
  apiKey?: string;
  priorityInt?: number;
  isActive?: boolean;
  parentSupplierId?: string | null;
  protocolFamilyId?: string | null;
  supplierKind?: "parent" | "child";
  isRoutable?: boolean;
}
