# Frontend Implementation Guide: Referrals & Withdrawals (V2)

This guide details the integration steps for the **Refactored Referral System (V2)**. This system introduces a streamlined "Claim & Withdraw" lifecycle where points are explicitly claimed by the user and then withdrawn to their wallet.

## 📋 Core Concepts

1.  **Pending Referral**: Created when User B signs up with User A's code. No value yet.
2.  **Claim**: User B (Referee) clicks "Claim Bonus". This locks the reward value and splits it between A and B.
3.  **Available Balance**: The sum of all claimed (but not yet withdrawn) rewards.
4.  **Withdrawal**: Moving value from "Available Balance" to the user's main wallet/payout method.

---

## 🚀 Public Flow: Registration

When a user lands on the registration page with a referral code (e.g., `?ref=ABC1234`), validate it before submitting.

### 1. Validate Referral Code

- **Endpoint:** `GET /api/v1/referral/code/validate`
- **Query:** `code` (string)
- **Response:** `{ valid: true, referrerName: "John Doe" }`
- **Action:** Show "Referred by John Doe" badge. Submit `referralCode` field in the signup payload.

---

## 👤 User Flow: Referral Dashboard (V2)

**Base URL:** `/api/v1/dashboard/referrals`
**Auth:** Bearer Token required.

### 1. Get Comprehensive Stats (V2)

Fetch this on dashboard load. It returns data for the user as both a **Referrer** (invited others) and a **Referee** (was invited).

- **Endpoint:** `GET /stats-v2`
- **Response:**

```typescript
interface ReferralStatsV2 {
  referrerStats: {
    totalReferralsInvited: number;
    claimedReferrals: number; // Successful ones
    pendingClaimReferrals: number; // Waiting for friend to claim
    totalReferrerEarnings: number; // Lifetime earnings
    pendingReferrerAmount: number; // Available to withdraw
    withdrawnReferrerAmount: number;
  };
  referredStats: {
    referrerName: string; // "John Doe"
    referralStatus: "pending" | "claimed" | "cancelled";
    totalReferredEarnings: number;
    pendingReferredAmount: number; // Available to withdraw
    withdrawnReferredAmount: number;
    claimedAt: string | null; // ISO Date
  } | null; // null if user wasn't referred
}
```

### 2. The "Claim" Action (Critical)

If `referredStats.referralStatus === 'pending'`, show a **"Claim Bonus"** button.

- **Endpoint:** `POST /claim-v2`
- **Body:** `{}` (empty)
- **Effect:**
  - Locks in the reward (e.g., 500 points split 50/50).
  - Updates status to `claimed`.
  - Increases `pendingReferredAmount` for the user.
  - Increases `pendingReferrerAmount` for the inviter.
- **UI Update:** Refresh stats after success. Button changes to "Claimed".

### 3. Withdrawal Flow

This replaces the old withdrawal system. Users withdraw directly from their referral balance.

#### Step A: Check Balance

- **Endpoint:** `GET /available-balance-v2`
- **Query:** `type` = `'referrer'` OR `'referred'`
  - _Note:_ You usually withdraw these separately or sum them up in UI.
- **Response:**

```json
{
  "totalAvailable": 2500, // Points/Currency units
  "claimCount": 5,        // Number of contributors
  "claims": [ ... ]       // Details if needed
}
```

#### Step B: Execute Withdrawal

- **Endpoint:** `POST /withdraw-v2`
- **Body:**

```json
{
  "amount": 1000,
  "userType": "referrer" // or "referred"
}
```

- **Effect:**
  - Deducts from available balance.
  - Creates a withdrawal record.
  - (Backend) Credits user's main wallet or processes payout.
- **UI Update:** Show success message "Successfully withdrawn 1000". Refresh balance.

### 4. Referral List (History)

- **Endpoint:** `GET /list-with-details`
- **Query:**
  - `page`: number
  - `limit`: number
  - `status`: `'claimed'` (default), `'pending'`, `'cancelled'`
- **Response:** Paginated list of people invited.
- **UI Hint:** Use `status='pending'` to show "Pending Invites" (nudge them!). Use `status='claimed'` to show "Successful Referrals".

### 5. Referral Link Management

- **Get Link:** `GET /link` (Returns code, short link, QR)
- **Regenerate:** `POST /link/regenerate`
- **Deactivate:** `POST /link/deactivate`

---

## 🛡️ Admin Flow

### 1. Leaderboard

- **Endpoint:** `GET /leaderboard`
- **Query:** `limit=10`
- **Usage:** "Top Referrers" widget.

### 2. Manual Override

- **Complete Referral:** `POST /:referralId/complete` (Forces status to claimed)
- **Audit Withdrawals:** Query `referral_withdrawals` table directly (Admin API TBD).

---

## 🔄 Migration Notes (V1 -> V2)

- **Status Mapping:**
  - Old `active` / `completed` -> New `claimed`.
  - Old `pending` -> New `pending`.
- **Withdrawals:**
  - Old `withdrawals` endpoints are **deprecated** for referrals. Use `withdraw-v2`.
