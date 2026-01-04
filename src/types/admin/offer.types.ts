/**
 * Admin Offer Types
 * Based on actual API response structure
 */

// ============= Embedded Types =============

export interface EmbeddedUser {
  id: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

// ============= Offer Types =============

export type OfferStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "expired"
  | "cancelled";
export type DiscountType =
  | "percentage"
  | "fixed_amount"
  | "fixed_price"
  | "buy_x_get_y";
export type OfferApplyTo = "operator_product" | "supplier_product" | "all";
export type EligibilityLogic = "all" | "any";

export interface OfferTargetCriteria {
  registrationDateRange?: {
    start: string;
    end: string;
  };
  minTransactionCount?: number;
  maxTransactionCount?: number;
  minTopupCount?: number;
  maxTopupCount?: number;
  lastActiveWithinDays?: number;
  operators?: string[];
  minBalance?: number;
  maxBalance?: number;
}

export interface Offer {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  status: OfferStatus;
  discountType: DiscountType;
  discountValue: string | number;
  perUserLimit?: number | null;
  totalUsageLimit?: number | null;
  usageCount: number;
  applyTo: OfferApplyTo;
  allowAll: boolean;
  eligibilityLogic: EligibilityLogic;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdBy?: string | null;

  // Frontend helpers or mapped fields (optional during transition)
  name?: string; // Mapped from title
  validFrom?: string; // Mapped from startsAt
  validTo?: string; // Mapped from endsAt
  eligibleCount?: number;
  redemptionCount?: number;
  maxRedemptions?: number;
  targetCriteria?: OfferTargetCriteria; // May be part of eligibilityLogic in backend
}

export interface OfferEligibleUser {
  id: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

export interface OfferSegment {
  total: number;
  computed: boolean;
  computedAt?: string;
}

export interface OfferRedemption {
  id: string;
  offerId: string;
  userId: string;
  user?: EmbeddedUser;
  status: "pending" | "completed" | "failed";
  discount?: number;
  redeemedAt?: string;
  createdAt: string;
}

// ============= API Responses =============

export interface OfferListResponse {
  offers: Offer[];
  pagination: OfferPagination;
}

export interface OfferPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EligibleUsersResponse {
  members: OfferEligibleUser[];
  total: number;
  pagination?: OfferPagination;
}

export interface PreviewEligibilityResponse {
  preview: OfferEligibleUser[];
}

export interface ComputeSegmentResponse {
  total: number;
}

export interface CreateRedemptionsResponse {
  jobId: string;
}

// ============= Request Types =============

export type OfferRuleType =
  | "min_spend"
  | "min_tx_count"
  | "new_user"
  | "specific_role";

export interface OfferRule {
  rule_key: string;
  rule_type: OfferRuleType;
  description?: string;
  params: Record<string, any>;
}

export interface CreateOfferRequest {
  title: string;
  description?: string;
  code?: string;
  status?: OfferStatus;
  discountType: DiscountType;
  discountValue: number;
  perUserLimit?: number;
  totalUsageLimit?: number;
  startsAt: string;
  endsAt: string;
  applyTo?: OfferApplyTo;
  allowAll?: boolean;
  eligibilityLogic?: EligibilityLogic;
  // Associations
  productIds?: string[];
  supplierIds?: string[];
  // Rules
  rules?: OfferRule[];
}

export interface UpdateOfferRequest {
  title?: string;
  description?: string;
  status?: OfferStatus;
  discountType?: DiscountType;
  discountValue?: number;
  perUserLimit?: number;
  totalUsageLimit?: number;
  startsAt?: string;
  endsAt?: string;
  // Associations
  applyTo?: OfferApplyTo;
  productIds?: string[];
  supplierIds?: string[];
  // Rules
  allowAll?: boolean;
  eligibilityLogic?: EligibilityLogic;
  rules?: OfferRule[];
}

export interface CreateRedemptionsRequest {
  userIds?: string[];
  fromSegment?: boolean;
  price?: number;
  discount?: number;
}

// ============= Query Params =============

export interface OfferQueryParams {
  status?: OfferStatus;
  page?: number;
  limit?: number;
}

export interface EligibleUsersQueryParams {
  page?: number;
  limit?: number;
}
