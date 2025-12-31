// Referral Types

// User details attached to a referral
export interface ReferredUserData {
  userId: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  isVerified: boolean;
  profilePictureUrl: string | null;
}

// The main Referral object
export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  status: "pending" | "active" | "completed" | "cancelled";
  rewardAmount: number;
  referralCode: string | null;
  referralCompletedAt: string | null; // ISO Date
  createdAt: string; // ISO Date
  // When fetching list-with-details:
  referredUserData?: ReferredUserData;
}

// Stats for the Dashboard
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number; // Completed/Successful referrals
  completedReferrals: number; // Same as active in some contexts
  totalRewardEarned: number; // Total value earned
  pendingRewardAmount: number; // Potential value
}

// Stats specifically for the Link
export interface LinkStats {
  totalSignupsWithLink: number;
  activeReferrals: number;
  completedReferrals: number;
}

// Referral Link Data
export interface ReferralLinkData {
  referralCode: string; // e.g., "JOHND123"
  shortCode: string; // Same as referralCode usually
  referralLink: string; // Full URL: https://app.com/register?code=...
  qrCodeUrl: string; // Image URL for QR code
  sharingMessage: string; // Pre-filled message for sharing
}

// Withdrawal Types

export interface Withdrawal {
  id: string;
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  amount: number;
  points: number;
  created_at: string;
  completed_at?: string;
  admin_notes?: string;
}

export interface WithdrawalBalance {
  totalPoints: number;
  totalAmount: number; // NGN value (points / 100 usually)
  claims: any[]; // List of active referral claims eligible for withdrawal
  withdrawnClaimsIndices: number[];
}

export interface ValidateReferralCodeResponse {
  referrerId: string;
  message: string;
}

export interface ClaimReferralBonusResponse {
  rewardAmount: number;
  rewardSplit: {
    referrerAmount: number;
    referredAmount: number;
  };
}

export interface ReferralListResponse {
  referrals: Referral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetReferralsParams {
  page?: number;
  limit?: number;
  status?: "pending" | "active" | "completed" | "cancelled";
}

export interface WithdrawalRequest {
  rewardId: string;
  amount: number;
}
