import { AdminUser } from "./user.types";

export type AnnouncementStatus = "draft" | "published" | "expired";
export type AnnouncementAudienceType = "all" | "selected";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  status: AnnouncementStatus;
  audienceType: AnnouncementAudienceType;
  startsAt: string;
  endsAt: string;
  createdBy?: string | null;
  publishedAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  recipientCount: number;
  recipientUserIds: string[];
}

export interface AnnouncementPayload {
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  audienceType: AnnouncementAudienceType;
  recipientUserIds: string[];
}

export type AnnouncementUserOption = Pick<
  AdminUser,
  "id" | "userId" | "email" | "fullName" | "phoneNumber"
>;
