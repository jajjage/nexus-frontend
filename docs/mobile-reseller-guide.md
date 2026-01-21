# Mobile Reseller Features & UI Guide

This guide documents the logic and UI specifications for the Reseller features, including how the dashboard adapts for resellers and the "Become a Reseller" application flow.

## 1. Dashboard UI Changes for Resellers

When a user has `role: 'reseller'`, the dashboard UI adapts to provide quick access to business tools.

### Sidebar Navigation (Desktop)

**Condition:** `isReseller` (`user.role === 'reseller'`)

**New Section Added:** "Reseller Tools" (below standard nav)

| Label        | Icon     | Route                            |
| ------------ | -------- | -------------------------------- |
| Reseller Hub | `Store`  | `/dashboard/reseller`            |
| Bulk Topup   | `FileUp` | `/dashboard/reseller/bulk-topup` |
| API Keys     | `Key`    | `/dashboard/reseller/api-keys`   |

### Bottom Navigation (Mobile)

**Condition:** `isReseller`

- **Grid Change:** Switches from 4 columns to **5 columns**.
- **New Item:** Inserts "Reseller" tab in the **middle position** (index 2).
- **Indicator:** The Reseller tab has a small amber dot indicator.

| Position | Label        | Icon        | Route                  |
| -------- | ------------ | ----------- | ---------------------- |
| 1        | Home         | `Home`      | `/dashboard`           |
| 2        | Referral     | `Users`     | `/dashboard/referrals` |
| **3**    | **Reseller** | `Briefcase` | `/dashboard/reseller`  |
| 4        | Rewards      | `Trophy`    | `/dashboard/rewards`   |
| 5        | Profile      | `User`      | `/dashboard/profile`   |

---

## 2. "Become a Reseller" Modal Flow

For regular users (`role: 'user'`), a call-to-action (CTA) is displayed to upgrade their account.

### Entry Points (CTAs)

1.  **Desktop:** Button in Sidebar ("Become a Reseller")
2.  **Mobile:** Banner fixed above Bottom Navigation

**CTA Styles (Mobile Banner):**

- **Background:** Gradient (`from-amber-50 to-orange-50`)
- **Text:** "Become a Reseller — Get 10% OFF"
- **Icon:** `Sparkles` (Amber color)

### Application Modal UI

**Header:**

- Icon: `Sparkles` (in amber circle)
- Title: "Unlock Exclusive Wholesale Rates"
- Description: "Turn your network into net worth..."

**Benefits Grid (2x2):**

| Title             | Icon           | Description                        |
| ----------------- | -------------- | ---------------------------------- |
| Massive Discounts | `BadgePercent` | Get up to 10% OFF...               |
| Bulk Tools        | `Users`        | Send credit to 50+ numbers...      |
| API Access        | `Code2`        | Integrate our services...          |
| Priority Support  | `Headphones`   | Get a dedicated account manager... |

**Form:**

- **User Info (Read-only):** Profile card with Name, Email, Phone.
- **Message Input (`Textarea`):** "Tell us about your business" (Required).
- **Submit Button:** "Submit Application" (Icon: `Send`).

### Submission Logic

**Hook:** `useRequestResellerUpgrade()` from `src/hooks/useReseller.ts`

1.  User fills message.
2.  Calls `resellerService.requestUpgrade(message)`.
3.  **On Success:**
    - Show `Application Submitted!` success view (in-modal).
    - Mark request as "Pending" in local storage.
    - Hide the CTA button and show "Pending" status badge instead.

**Success View:**

- Icon: `CheckCircle2` (Green)
- Title: "Application Submitted!"
- Message: "Thank you... review within 24-48 hours."

---

## 3. Pending State Handling

If a user has already applied, the "Become a Reseller" CTA is replaced by a "Pending" status indicator.

**Logic:**

- **Storage Key:** `reseller_upgrade_request` (stores `{ submittedAt: date }`)
- **Hook:** `useResellerUpgradeStatus()`

**Pending UI:**

- **Icon:** `Clock` (Gray/Zinc)
- **Text:** "Upgrade request pending review"
- **Background:** Gray/Zinc (muted)
- **Interaction:** Non-clickable (Informational only)

---

## 4. API Hooks & Endpoints

**File:** `src/hooks/useReseller.ts`

| Hook                          | Purpose            | API Endpoint                     |
| ----------------------------- | ------------------ | -------------------------------- |
| `useRequestResellerUpgrade()` | Submit application | `POST /reseller/upgrade`         |
| `useApiKeys()`                | Fetch API keys     | `GET /reseller/api-keys`         |
| `useCreateApiKey()`           | Create key         | `POST /reseller/api-keys`        |
| `useRevokeApiKey()`           | Delete key         | `DELETE /reseller/api-keys/{id}` |
| `useBulkTopup()`              | Process batch      | `POST /reseller/bulk-topup`      |

---

## 5. Icons Reference (Lucide React)

| Feature      | Icon Name      | Context                    |
| ------------ | -------------- | -------------------------- |
| Reseller Tab | `Briefcase`    | Mobile Bottom Nav          |
| Reseller Hub | `Store`        | Desktop Sidebar            |
| Bulk Topup   | `FileUp`       | Sidebar / Feature          |
| API Keys     | `Key`          | Sidebar / Feature          |
| Apply CTA    | `Sparkles`     | "Become a Reseller" Button |
| Pending      | `Clock`        | Pending Status             |
| Submit       | `Send`         | Form Submit Button         |
| Success      | `CheckCircle2` | Application Success        |
| Benefit      | `BadgePercent` | Discounts                  |
| Benefit      | `Users`        | Bulk Tools                 |
| Benefit      | `Code2`        | API Access                 |
| Benefit      | `Headphones`   | Support                    |

---

## 6. Implementation Checklist for Mobile

1.  [ ] **Check Role:** Use `user.role` to toggle between standard and reseller layouts.
2.  [ ] **Grid Change:** Dynamically adjust bottom nav grid from 4 to 5 cols.
3.  [ ] **Modal:** Replicate the "Become a Reseller" modal with the benefits grid and form.
4.  [ ] **Storage:** Implement `AsyncStorage` logic for "Pending" status (checking `reseller_upgrade_request`).
5.  [ ] **Banner:** Add the fixed bottom banner for non-resellers (above the nav bar).
