/**
 * Admin Offer Hooks
 * React Query hooks for offer management
 */

"use client";

import { adminOfferService } from "@/services/admin/offer.service";
import {
  CreateOfferRequest,
  CreateRedemptionsRequest,
  EligibleUsersQueryParams,
  OfferQueryParams,
  UpdateOfferRequest,
} from "@/types/admin/offer.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys for cache management
const offerKeys = {
  all: ["admin", "offers"] as const,
  list: (params?: OfferQueryParams) =>
    [...offerKeys.all, "list", params] as const,
  detail: (offerId: string) => [...offerKeys.all, "detail", offerId] as const,
  eligibleUsers: (offerId: string, params?: EligibleUsersQueryParams) =>
    [...offerKeys.all, "eligible-users", offerId, params] as const,
  previewEligibility: (offerId: string) =>
    [...offerKeys.all, "preview", offerId] as const,
};

/**
 * Fetch paginated list of offers
 */
export function useAdminOffers(params?: OfferQueryParams) {
  return useQuery({
    queryKey: offerKeys.list(params),
    queryFn: () => adminOfferService.getOffers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single offer details
 */
export function useAdminOffer(offerId: string) {
  return useQuery({
    queryKey: offerKeys.detail(offerId),
    queryFn: () => adminOfferService.getOfferById(offerId),
    enabled: !!offerId,
  });
}

/**
 * Fetch eligible users for an offer
 */
export function useEligibleUsers(
  offerId: string,
  params?: EligibleUsersQueryParams
) {
  return useQuery({
    queryKey: offerKeys.eligibleUsers(offerId, params),
    queryFn: () => adminOfferService.getEligibleUsers(offerId, params),
    enabled: !!offerId,
  });
}

/**
 * Preview offer eligibility
 */
export function usePreviewEligibility(
  offerId: string,
  limit?: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: offerKeys.previewEligibility(offerId),
    queryFn: () => adminOfferService.previewEligibility(offerId, limit),
    enabled: !!offerId && enabled,
  });
}

/**
 * Create a new offer
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfferRequest) =>
      adminOfferService.createOffer(data),
    onSuccess: (response) => {
      toast.success(response.message || "Offer created successfully");
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: () => {
      toast.error("Failed to create offer");
    },
  });
}

/**
 * Update an offer
 */
export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      offerId,
      data,
    }: {
      offerId: string;
      data: UpdateOfferRequest;
    }) => adminOfferService.updateOffer(offerId, data),
    onSuccess: (response) => {
      toast.success(response.message || "Offer updated successfully");
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: () => {
      toast.error("Failed to update offer");
    },
  });
}

/**
 * Delete an offer
 */
export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => adminOfferService.deleteOffer(offerId),
    onSuccess: (response) => {
      toast.success(response.message || "Offer deleted successfully");
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: () => {
      toast.error("Failed to delete offer");
    },
  });
}

/**
 * Compute offer segment
 */
export function useComputeSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => adminOfferService.computeSegment(offerId),
    onSuccess: (response, offerId) => {
      toast.success(
        response.message ||
          `Segment computed: ${response.data?.total || 0} eligible users`
      );
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(offerId) });
      queryClient.invalidateQueries({
        queryKey: offerKeys.eligibleUsers(offerId),
      });
    },
    onError: () => {
      toast.error("Failed to compute segment");
    },
  });
}

/**
 * Create bulk redemptions
 */
export function useCreateRedemptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      offerId,
      data,
    }: {
      offerId: string;
      data: CreateRedemptionsRequest;
    }) => adminOfferService.createRedemptions(offerId, data),
    onSuccess: (response) => {
      toast.success(
        response.message ||
          `Redemption job created: ${response.data?.jobId || ""}`
      );
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: () => {
      toast.error("Failed to create redemptions");
    },
  });
}
