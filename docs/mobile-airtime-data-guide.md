# Nexus Mobile Airtime & Data Engineering Guide

This guide describes **every single bit of UI, logic, hook, and flow** used to build the Airtime and Data features. It is the source of truth for achieving 100% parity with the production implementation.

---

## 1. Architecture Overview

**Core Philosophy:**

- **Smart Defaults:** Auto-detect network from phone number.
- **Dynamic Content:** Operators and Categories are derived _directly_ from valid products (no hardcoded lists).
- **Optimistic UI:** Deduct balance immediately, rollback on error.
- **Biometric First:** Always attempt FaceID/TouchID before falling back to PIN.
- **Dynamic Pricing:** Prices are calculated client-side based on `SupplierMarkup`, `UserOffers`, and wholesale costs.

### Directory Structure

- **Pages:** `src/app/dashboard/airtime/page.tsx`, `src/app/dashboard/data/page.tsx`
- **Core Components:**
  - `src/components/features/dashboard/airtime/airtime-plans.tsx`
  - `src/components/features/dashboard/data/data-plans.tsx`
- **Shared Components:** `src/components/features/dashboard/shared/*`

---

## 2. Dynamic Data Fetching & Filtering logic

We **never** hardcode the list of networks (MTN, Airtel, etc.). Doing so causes blank screens if a provider is down.

### A. Fetching Products (The Source of Truth)

- **Hook:** `useProducts({ productType: "airtime" | "data", isActive: true })`
- **Key Concept:** This single API call governs everything. If "Glo" has no active products in the DB, "Glo" will not appear in the UI.

### B. Extracting Unique Operators (Dynamic Tabs)

- **Location:** `airtime-plans.tsx` (L108) / `data-plans.tsx` (L110)
- **Logic:**
  1.  Iterate through _all_ fetched products.
  2.  Extract unique `product.operator.name` + `product.operator.logoUrl`.
  3.  Store in a `Map` (to deduplicate).
  4.  **Sort:** "MTN" first (hardcoded preference), then alphabetical.
  ```typescript
  // Result: If API returns only MTN products, user ONLY sees MTN tab.
  const operators = useMemo(() => {
    // ... deduplication logic ...
    return Array.from(uniqueOps.values());
  }, [products]);
  ```

### C. Filtering the Grid

- **Location:** `useMemo` block for `filteredProducts`.
- **Logic:**
  1.  **Network Filter:** Show only products matching `selectedNetwork`.
  2.  **Category Filter (Data Only):** Match `product.category.slug` == `selectedCategory`.
  3.  **Deduplication (Critical):** Data plans often have duplicates in the DB. Use `new Set(product.id)` to show each plan only once.

### D. The "Empty State" (Crucial UX)

- **Scenario:** User scans QR code for a specific network, but backend returns 0 products for it.
- **UI Implementation:**
  ```tsx
  {filteredProducts.length > 0 ? (
     // Show Grid
  ) : (
     <div className="text-muted-foreground py-10 text-center">
       No plans available for this selection.
     </div>
  )}
  ```

---

## 3. Product Pricing & Discount Logic (The "Brain")

We do not trust the "price" field blindly. We calculate the _final_ selling price dynamically to handle markups, supplier discounts, and special offers.

### A. Base Price Calculation

- **Input:** `product.denomAmount` (Face Value) and `product.supplierOffers[0].supplierPrice` (Wholesale Cost).
- **Logic:**
  1.  `supplierPrice` = Use wholesale cost if valid (non-zero, < faceValue), else use Face Value.
  2.  `markup` = Fetch from `useSupplierMarkupMap()` (e.g., 5%).
  3.  `Base Selling Price` = `supplierPrice + (supplierPrice * markup)`.

### B. Promotional Offers (Two-Request Pattern)

- **Eligibility Check:** `product.activeOffer` exists AND `eligibleIds.has(offer.id)`.
- **Final Price Logic:**
  - **Priority 1:** `product.discountedPrice` (if Backend pre-calculated it).
  - **Priority 2:** Client-side calc based on `offer.discountType`:
    - `percentage`: `BasePrice * (1 - value/100)`
    - `fixed_amount`: `BasePrice - value`
    - `fixed_price`: `value`
  - **Priority 3:** `Base Selling Price` (No offer).

### C. Visual Badges (Hierarchy)

1.  **"🎉 Special Deal"**: Active Offer + User Eligible. (Pulse Animation).
2.  **"🔓 Login to Claim"**: Active Offer + Guest User. (Blue Gradient).
3.  **"-5% OFF"**: Valid Discount > 0. (Red/Orange Gradient).
4.  **"+2% Back"**: `product.has_cashback` is true. (Bottom Right Pill).

---

## 4. Payment Verification Flows

### Flow 1: Biometric First (The "Happy Path")

1.  **Trigger:** User clicks "Pay" in Checkout Modal.
2.  **Action:** `setShowBiometricModal(true)`.
3.  **User:** Scans FaceID/TouchID.
4.  **Success:**
    - Get `verificationToken`.
    - **Call API:** `topupMutation.mutate({ verificationToken, ... })`.
5.  **Failure/Cancel:**
    - Close Biometric Modal.
    - **IMMEDIATELY** open `PinVerificationModal` (Fallback).

### Flow 2: PIN Fallback

1.  **Trigger:** Biometric failed or not available.
2.  **UI:** Show Keypad Modal.
3.  **User:** Enters 4-digit PIN.
4.  **Success:**
    - **Call API:** `topupMutation.mutate({ pin: "1234", ... })`.

### Flow 3: No PIN Set

- Use `handleNoPinSetup`.
- Redirect to `PinSetupModal`.
- On Success -> Recursively trigger `PinVerificationModal`.

---

## 5. UI Component Specifications

### Network Detector (`NetworkDetector.tsx`)

- **Input:** Regex `^\d*$` (Numbers only).
- **Auto-Detect:** Calls `detectNetworkProvider(phone)` on change.
- **Smart Switch:** If detected network != selected network, **Auto-Switch the tab**.
- **Warning:** If user _manually_ selects mismatched network, show Toast Warning.

### Network Selector (`NetworkSelector.tsx`)

- **Visuals:** Avatar logos.
- **Active State:** High contrast (Black background/White text).
- **Inactive:** Transparent with opacity.

### Checkout Modal (`CheckoutModal.tsx`)

- **Content:**
  - Product Name & Logo.
  - Recipient Number.
  - **Switch:** "Use Wallet Cashback" toggle (subtracts `user.cashbackBalance` from total).
  - **Total Amount:** Dynamic based on toggle.

---

## 6. Implementation Checklist

- [ ] **Dynamic Data**: Ensure `operators` list is derived from `products`, not hardcoded.
- [ ] **Empty States**: Verify "No plans available" text appears when a filter returns 0 results.
- [ ] **Pricing**: Implement the `Supplier Price -> Markup -> Offer Discount` calculation chain.
- [ ] **Security**: Replicate the `Biometric -> PIN` waterfall exactly.
- [ ] **Cleanup**: Use `new Set(product.id)` to remove duplicate data plans.
