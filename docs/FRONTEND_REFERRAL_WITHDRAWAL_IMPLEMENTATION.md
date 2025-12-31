# Frontend Implementation Guide: Referrals & Withdrawals

This guide details the integration steps for the Referral System and Withdrawal functionality. It is divided into **User Flows**, **Public Flows**, and **Admin Flows**.

## 📋 Data Types & Interfaces

Use these TypeScript interfaces as a reference for the API responses.

### Referral Types

```typescript
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
```

### Withdrawal Types

```typescript
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
```

---

## 🚀 Public Flow: Registration with Referral

When a user lands on the registration page with a referral code (e.g., `?code=ABC`), validate it before submitting the registration form.

### 1. Validate Referral Code

- **Endpoint:** `GET /api/v1/referral/code/validate`
- **Query Params:** `code` (string)
- **Usage:** Call this when the component mounts or when the code field loses focus.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Referral code is valid",
  "data": {
    "referrerId": "uuid-string",
    "message": "Code is valid and can be used for signup"
  }
}
```

_UI Hint:_ Show a green checkmark or the referrer's name if valid.

---

## 👤 User Flow: Referral Dashboard

These endpoints are protected (require Bearer Token). Base URL: `/api/v1/dashboard/referrals`.

### 1. Get Referral Statistics

- **Endpoint:** `GET /api/v1/dashboard/referrals`
- **Usage:** Display these cards at the top of the Referral Dashboard.

**Response Data:**
Returns `ReferralStats` object.

### 2. Get User's Referral Link

- **Endpoint:** `GET /api/v1/dashboard/referrals/link`
- **Usage:** Display the link, code, and QR code for the user to copy/share.

**Response Data:**
Returns `ReferralLinkData` object.

### 3. Manage Referral Link

- **Regenerate Code:** `POST /api/v1/dashboard/referrals/link/regenerate`
  - _Effect:_ Invalidates old code, creates a new one.
- **Deactivate Link:** `POST /api/v1/dashboard/referrals/link/deactivate`
  - _Effect:_ Disables the link permanently (until regenerated).
- **Get Link Stats:** `GET /api/v1/dashboard/referrals/link/stats`
  - Returns `LinkStats`.

### 4. List Referrals (History)

- **Endpoint:** `GET /api/v1/dashboard/referrals/list-with-details`
- **Query Params:**
  - `page`: number (default 1)
  - `limit`: number (default 20)
  - `status`: 'pending' | 'active' | 'completed' | 'cancelled' (optional)
- **Usage:** Show a paginated table of users referred. Use `referredUserData` to show names/emails.

**Response Data:**

```json
{
  "referrals": [ ...Array of Referral objects... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### 5. Claim Referral Bonus

- **Endpoint:** `POST /api/v1/dashboard/referrals/claim`
- **Usage:** This is for the **Referred User** (the new user) to claim their sign-up bonus.
- **Prerequisite:** User must be verified.
- **Condition:** Can only be called if the user has a `pending` referral status where they are the `referredUserId`.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Referral bonus claimed...",
  "data": {
    "rewardAmount": 500,
    "rewardSplit": { "referrerAmount": 250, "referredAmount": 250 }
  }
}
```

---

## 💰 User Flow: Withdrawals

These endpoints handle converting earned rewards into wallet balance or cash.
**Note:** Ensure `withdrawals.routes.ts` is mounted (e.g., at `/api/v1/withdrawals`) in the backend configuration.

### 1. Check Available Balance

Before requesting a withdrawal, the user needs to know how much they can withdraw from a specific reward pool.

- **Endpoint:** `GET /api/v1/withdrawals/balance/:rewardId`
- **Params:** `rewardId` (The ID of the Reward entity associated with the referral program).
  - _Tip:_ You can get the `rewardId` from the User's Badge/Reward summary (`GET /api/v1/dashboard/rewards`) or hardcode it if there is a global "Referral Reward" ID.
- **Usage:** Display "Available for Withdrawal: ₦5,000".

**Response Data:**
Returns `WithdrawalBalance` object.

### 2. Request Withdrawal

- **Endpoint:** `POST /api/v1/withdrawals/request`
- **Body:**

```json
{
  "rewardId": "uuid-string",
  "amount": 1000
}
```

- **Usage:** Form to input amount. Max amount is determined by Step 1.

**Response:** Returns created `Withdrawal` object with status `pending`.

### 3. Withdrawal History

- **Endpoint:** `GET /api/v1/withdrawals/history`
- **Query Params:** `status` (optional)
- **Usage:** List of past withdrawal requests.

---

## 🛡️ Admin Flow: Management

These endpoints require an Admin Token.

### 1. Referral Leaderboard

- **Endpoint:** `GET /api/v1/dashboard/referrals/leaderboard`
- **Query:** `limit` (default 10)
- **Usage:** Widget showing top referrers.

### 2. Manage Withdrawals

- **View Pending:** `GET /api/v1/withdrawals/admin/pending`
  - _Note:_ Check exact mounting path in backend. Likely `/api/v1/withdrawals/admin/pending`.
  - Returns list of withdrawals waiting for approval.

- **Approve:** `POST /api/v1/withdrawals/admin/:withdrawalId/approve`
  - Action: Credits the user's wallet, marks withdrawal as completed.

- **Reject:** `POST /api/v1/withdrawals/admin/:withdrawalId/reject`
  - Body: `{ "reason": "Suspicious activity" }`
  - Action: Marks as rejected, user can try again (or funds returned depending on logic).

### 3. Referral Operations (Advanced)

- **Batch Process:** `POST /api/v1/dashboard/referrals/batch-process`
  - Body: `{ "limit": 100 }`
  - Usage: Trigger background processing of pending rewards.
- **Force Complete:** `POST /api/v1/dashboard/referrals/:referralId/complete`
- **Process Reward:** `POST /api/v1/dashboard/referrals/:referralId/process-reward`
