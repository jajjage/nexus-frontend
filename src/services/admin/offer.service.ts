/**
 * Admin Offer Service
 * API methods for offer management
 */

import apiClient from "@/lib/api-client";
import {
  ComputeSegmentResponse,
  CreateOfferRequest,
  CreateRedemptionsRequest,
  CreateRedemptionsResponse,
  EligibleUsersQueryParams,
  EligibleUsersResponse,
  Offer,
  OfferListResponse,
  OfferQueryParams,
  PreviewEligibilityResponse,
  UpdateOfferRequest,
} from "@/types/admin/offer.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/offers";

// Helper to map API response (snake_case) to Frontend type (camelCase)
const mapFromApiOffer = (apiOffer: any): Offer => {
  return {
    id: apiOffer.id,
    code: apiOffer.code,
    title: apiOffer.title,
    description: apiOffer.description,
    status: apiOffer.status,
    discountType: apiOffer.discount_type || apiOffer.discountType,
    discountValue: apiOffer.discount_value || apiOffer.discountValue,
    perUserLimit: apiOffer.per_user_limit || apiOffer.perUserLimit,
    totalUsageLimit: apiOffer.total_usage_limit || apiOffer.totalUsageLimit,
    usageCount: apiOffer.usage_count || apiOffer.usageCount || 0,
    applyTo: apiOffer.apply_to || apiOffer.applyTo,
    allowAll: apiOffer.allow_all || apiOffer.allowAll,
    eligibilityLogic: apiOffer.eligibility_logic || apiOffer.eligibilityLogic,
    startsAt: apiOffer.starts_at || apiOffer.startsAt,
    endsAt: apiOffer.ends_at || apiOffer.endsAt,
    createdAt: apiOffer.created_at || apiOffer.createdAt,
    updatedAt: apiOffer.updated_at || apiOffer.updatedAt,
    deletedAt: apiOffer.deleted_at || apiOffer.deletedAt,
    createdBy: apiOffer.created_by || apiOffer.createdBy,
  };
};

// Helper to map Frontend type (camelCase) to API request (snake_case)
const mapToApiRequest = (data: any): any => {
  const mapped: any = { ...data };

  if (data.discountType) mapped.discount_type = data.discountType;
  if (data.discountValue !== undefined)
    mapped.discount_value = data.discountValue;
  if (data.perUserLimit !== undefined)
    mapped.per_user_limit = data.perUserLimit;
  if (data.totalUsageLimit !== undefined)
    mapped.total_usage_limit = data.totalUsageLimit;
  if (data.applyTo) mapped.apply_to = data.applyTo;
  if (data.allowAll !== undefined) mapped.allow_all = data.allowAll;
  if (data.eligibilityLogic) mapped.eligibility_logic = data.eligibilityLogic;
  if (data.startsAt) mapped.starts_at = data.startsAt;
  if (data.endsAt) mapped.ends_at = data.endsAt;

  // Remove camelCase keys if they interfere (though usually extra keys are ignored, better to be clean if needed,
  // but strictly speaking only mapped keys matter if backend ignores others.
  // However, removing them ensures we don't send mixed casing).
  delete mapped.discountType;
  delete mapped.discountValue;
  delete mapped.perUserLimit;
  delete mapped.totalUsageLimit;
  delete mapped.applyTo;
  delete mapped.allowAll;
  delete mapped.eligibilityLogic;
  delete mapped.startsAt;
  delete mapped.endsAt;

  return mapped;
};

export const adminOfferService = {
  /**
   * Get all offers with pagination and filters
   */
  getOffers: async (
    params?: OfferQueryParams
  ): Promise<ApiResponse<OfferListResponse>> => {
    const response = await apiClient.get<any>(BASE_PATH, { params });

    // Map offers in the list
    if (response.data.success && response.data.data?.offers) {
      response.data.data.offers =
        response.data.data.offers.map(mapFromApiOffer);
    }

    // Enrich pagination
    if (response.data.success && response.data.data?.pagination) {
      const p = response.data.data.pagination;
      if (p.hasNextPage === undefined) {
        p.hasNextPage = p.page < p.totalPages;
      }
      if (p.hasPrevPage === undefined) {
        p.hasPrevPage = p.page > 1;
      }
    }

    return response.data;
  },

  /**
   * Get a single offer by ID
   */
  getOfferById: async (offerId: string): Promise<ApiResponse<Offer>> => {
    const response = await apiClient.get<any>(`${BASE_PATH}/${offerId}`);

    if (response.data.success && response.data.data) {
      // The API returns { offer: { ... } } or just { ... }?
      // User doc says: Return Type: { offer: { ... } }
      // BUT my type definition expects data to be Offer directly?
      // Let's check API response structure.
      // User doc: GET /... returns: { offer: { ... } }
      // Standard ApiResponse<T> usually implies data IS T.
      // If data is { offer: Offer }, then T should be { offer: Offer }.
      // But my Offer type is the object itself.
      // I should stick to mappings. If the API returns wrapped `offer`, I need to extract it or update types.
      // Assuming standard Nexus pattern: data is the payload.
      // If the payload is { offer: ... }, I should map `response.data.data.offer` if exists, or `response.data.data` if it IS the offer.
      // Based on user doc: "Return Type: { offer: ... }" (Lines 1-23 of GET /:id return type block).
      // It implies `data` field of generic response contains field `offer`.

      // However, looking at `getOffers` return: `{ offers: [...] }`.
      // So `getOfferById` likely returns `{ offer: {...} }`.
      // My `Offer` type is the entity.
      // So `ApiResponse<Offer>` implies `data` IS `Offer`. This might be a mismatch in my types vs API.
      // If API returns { offer: ... }, then `getOfferById` should return `ApiResponse<{ offer: Offer }>`.
      // For now, I will handle the mapping robustly.

      const rawData = response.data.data.offer || response.data.data;
      response.data.data = mapFromApiOffer(rawData);
    }

    return response.data;
  },

  /**
   * Create a new offer
   */
  createOffer: async (
    data: CreateOfferRequest
  ): Promise<ApiResponse<Offer>> => {
    const requestData = mapToApiRequest(data);
    const response = await apiClient.post<any>(BASE_PATH, requestData);

    if (response.data.success && response.data.data) {
      const rawData = response.data.data.offer || response.data.data;
      response.data.data = mapFromApiOffer(rawData);
    }

    return response.data;
  },

  /**
   * Update an existing offer
   */
  updateOffer: async (
    offerId: string,
    data: UpdateOfferRequest
  ): Promise<ApiResponse<Offer>> => {
    const requestData = mapToApiRequest(data);
    const response = await apiClient.put<any>(
      `${BASE_PATH}/${offerId}`,
      requestData
    );

    if (response.data.success && response.data.data) {
      const rawData = response.data.data.offer || response.data.data;
      response.data.data = mapFromApiOffer(rawData);
    }

    return response.data;
  },

  /**
   * Delete an offer
   */
  deleteOffer: async (offerId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `${BASE_PATH}/${offerId}`
    );
    return response.data;
  },

  /**
   * Compute offer segment (eligible users)
   */
  computeSegment: async (
    offerId: string
  ): Promise<ApiResponse<ComputeSegmentResponse>> => {
    const response = await apiClient.post<ApiResponse<ComputeSegmentResponse>>(
      `${BASE_PATH}/${offerId}/compute-segment`
    );
    return response.data;
  },

  /**
   * Get eligible users for an offer
   */
  getEligibleUsers: async (
    offerId: string,
    params?: EligibleUsersQueryParams
  ): Promise<ApiResponse<EligibleUsersResponse>> => {
    const response = await apiClient.get<ApiResponse<EligibleUsersResponse>>(
      `${BASE_PATH}/${offerId}/eligible-users`,
      { params }
    );
    return response.data;
  },

  /**
   * Preview offer eligibility (sample users)
   */
  previewEligibility: async (
    offerId: string,
    limit?: number
  ): Promise<ApiResponse<PreviewEligibilityResponse>> => {
    const response = await apiClient.get<
      ApiResponse<PreviewEligibilityResponse>
    >(`${BASE_PATH}/${offerId}/preview-eligibility`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Create bulk redemptions for an offer
   */
  createRedemptions: async (
    offerId: string,
    data: CreateRedemptionsRequest
  ): Promise<ApiResponse<CreateRedemptionsResponse>> => {
    const response = await apiClient.post<
      ApiResponse<CreateRedemptionsResponse>
    >(`${BASE_PATH}/${offerId}/redemptions`, data);
    return response.data;
  },

  /**
   * Get all suppliers for selection
   */
  getSuppliers: async (): Promise<ApiResponse<{ suppliers: any[] }>> => {
    const response =
      await apiClient.get<ApiResponse<{ suppliers: any[] }>>(
        `/admin/suppliers`
      );
    return response.data;
  },

  /**
   * Get all products for selection
   */
  getProducts: async (): Promise<ApiResponse<{ products: any[] }>> => {
    const response =
      await apiClient.get<ApiResponse<{ products: any[] }>>(`/admin/products`);
    return response.data;
  },
};
