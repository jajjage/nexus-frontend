import apiClient from "@/lib/api-client";
import {
  Announcement,
  AnnouncementPayload,
} from "@/types/admin/announcement.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/announcements";

const mapAnnouncement = (item: any): Announcement => ({
  id: item.id,
  title: item.title,
  message: item.message,
  status: item.status,
  audienceType: item.audienceType || item.audience_type,
  startsAt: item.startsAt || item.starts_at,
  endsAt: item.endsAt || item.ends_at,
  createdBy: item.createdBy || item.created_by,
  publishedAt: item.publishedAt || item.published_at,
  expiredAt: item.expiredAt || item.expired_at,
  createdAt: item.createdAt || item.created_at,
  updatedAt: item.updatedAt || item.updated_at,
  viewCount: Number(item.viewCount || item.view_count || 0),
  recipientCount: Number(item.recipientCount || item.recipient_count || 0),
  recipientUserIds: item.recipientUserIds || item.recipient_user_ids || [],
});

export const adminAnnouncementService = {
  getAnnouncements: async (): Promise<ApiResponse<Announcement[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>(BASE_PATH);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapAnnouncement);
    }
    return response.data as ApiResponse<Announcement[]>;
  },

  createAnnouncement: async (
    data: AnnouncementPayload
  ): Promise<ApiResponse<Announcement>> => {
    const response = await apiClient.post<ApiResponse<any>>(BASE_PATH, data);
    if (response.data.success && response.data.data) {
      response.data.data = mapAnnouncement(response.data.data);
    }
    return response.data as ApiResponse<Announcement>;
  },

  updateAnnouncement: async (
    announcementId: string,
    data: AnnouncementPayload
  ): Promise<ApiResponse<Announcement>> => {
    const response = await apiClient.patch<ApiResponse<any>>(
      `${BASE_PATH}/${announcementId}`,
      data
    );
    if (response.data.success && response.data.data) {
      response.data.data = mapAnnouncement(response.data.data);
    }
    return response.data as ApiResponse<Announcement>;
  },

  publishAnnouncement: async (
    announcementId: string
  ): Promise<ApiResponse<Announcement>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `${BASE_PATH}/${announcementId}/publish`
    );
    if (response.data.success && response.data.data) {
      response.data.data = mapAnnouncement(response.data.data);
    }
    return response.data as ApiResponse<Announcement>;
  },

  expireAnnouncement: async (
    announcementId: string
  ): Promise<ApiResponse<Announcement>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `${BASE_PATH}/${announcementId}/expire`
    );
    if (response.data.success && response.data.data) {
      response.data.data = mapAnnouncement(response.data.data);
    }
    return response.data as ApiResponse<Announcement>;
  },

  deleteDraft: async (announcementId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `${BASE_PATH}/${announcementId}`
    );
    return response.data;
  },
};
