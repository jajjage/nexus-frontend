"use client";

import { adminAnnouncementService } from "@/services/admin/announcement.service";
import { AnnouncementPayload } from "@/types/admin/announcement.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const adminAnnouncementKeys = {
  all: ["admin", "announcements"] as const,
  list: () => [...adminAnnouncementKeys.all, "list"] as const,
};

const errorMessage = (error: AxiosError<any>, fallback: string) =>
  error.response?.data?.message || fallback;

export function useAdminAnnouncements() {
  return useQuery({
    queryKey: adminAnnouncementKeys.list(),
    queryFn: () => adminAnnouncementService.getAnnouncements(),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AnnouncementPayload) =>
      adminAnnouncementService.createAnnouncement(data),
    onSuccess: (response) => {
      toast.success(response.message || "Announcement draft created");
      queryClient.invalidateQueries({ queryKey: adminAnnouncementKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(errorMessage(error, "Failed to create announcement"));
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      announcementId,
      data,
    }: {
      announcementId: string;
      data: AnnouncementPayload;
    }) => adminAnnouncementService.updateAnnouncement(announcementId, data),
    onSuccess: (response) => {
      toast.success(response.message || "Announcement draft updated");
      queryClient.invalidateQueries({ queryKey: adminAnnouncementKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(errorMessage(error, "Failed to update announcement"));
    },
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) =>
      adminAnnouncementService.publishAnnouncement(announcementId),
    onSuccess: (response) => {
      toast.success(response.message || "Announcement published");
      queryClient.invalidateQueries({ queryKey: adminAnnouncementKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(errorMessage(error, "Failed to publish announcement"));
    },
  });
}

export function useExpireAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) =>
      adminAnnouncementService.expireAnnouncement(announcementId),
    onSuccess: (response) => {
      toast.success(response.message || "Announcement expired");
      queryClient.invalidateQueries({ queryKey: adminAnnouncementKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(errorMessage(error, "Failed to expire announcement"));
    },
  });
}

export function useDeleteAnnouncementDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) =>
      adminAnnouncementService.deleteDraft(announcementId),
    onSuccess: (response) => {
      toast.success(response.message || "Announcement draft deleted");
      queryClient.invalidateQueries({ queryKey: adminAnnouncementKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(errorMessage(error, "Failed to delete announcement"));
    },
  });
}
