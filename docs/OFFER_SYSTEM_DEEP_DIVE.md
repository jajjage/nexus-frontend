# Offer System Deep Dive & Frontend Implementation Guide

## 1. System Overview

The Offer System allows admins to create promotional discounts that are automatically applied during Topups. The system is designed to be highly flexible, supporting various qualification rules, product targeting, and usage limits.

### Core Components

- **Offer Entity**: Stores metadata (code, discount type, dates).
- **Offer Products**: Links offers to specific `operator_products` or `suppliers`.
- **Eligibility Rules**: Dynamic rules (e.g., "New Users only", "Spent > $500") evaluated at runtime via a database function.
- **Redemption Tracking**: Records every usage to enforce limits.

---

## 2. Business Logic Analysis

### A. Qualification Logic (How a User Qualifies)

Qualification is a multi-step process involving Application Code and Database Logic.

1.  **Basic Validity (Service Layer)**
    - **Status Check**: Offer must be `active` and not soft-deleted.
    - **Time Window**: Current time must be between `starts_at` and `ends_at`.
    - **Usage Limits**:
      - `total_usage_limit`: The global number of redemptions across all users must not be exceeded.
      - `per_user_limit`: The specific user must not have redeemed this offer more than `X` times.

2.  **Product Eligibility (Service Layer)**
    - If `allow_all` is `true`, any product works.
    - Otherwise, the product being purchased (identified by `operatorProductId`) must be explicitly linked in the `offer_products` table.
    - Alternatively, if the product belongs to a Supplier linked to the offer (via `supplier_product_mapping`), it also qualifies.

3.  **User Eligibility Rules (Database Function `is_user_eligible_for_offer`)**
    This is the most complex part. A PL/pgSQL function evaluates a set of JSON-configured rules attached to the offer.

    **Available Rules:**
    | Rule Type | Parameters | Description |
    | :--- | :--- | :--- |
    | `new_user` | `account_age_days` | User account created within X days. |
    | `min_topups` | `count`, `window_days` (opt) | User has done at least X topups (in last Y days). |
    | `min_transactions` | `count` | User has done at least X total transactions. |
    | `min_spent` | `amount`, `window_days` (opt) | User has spent at least X amount (in last Y days). |
    | `operator_topup_count` | `operator_id`, `count`, `window_days` | Topups specifically for an operator (e.g., MTN). |
    | `operator_spent` | `operator_id`, `amount`, `window_days` | Spend specifically for an operator. |
    | `last_active_within` | `days` | User profile updated within X days. |
    | `active_days` | `min_active_days`, `days` | User active on X distinct days in last Y days. |

    **Logic Combination:**
    - `eligibility_logic = 'all'`: User must pass **ALL** defined rules (AND).
    - `eligibility_logic = 'any'`: User must pass **AT LEAST ONE** defined rule (OR).

### B. Tracking Mechanism (How Usage is Recorded)

1.  **Redemption Record**: When a transaction is finalized, `OfferService.redeemOffer()` is called.
2.  **DB Insertion**: A row is inserted into `offer_redemptions` with:
    - `offer_id`
    - `user_id`
    - `price_paid` & `discount_amount`
    - `operator_product_id`
3.  **Auto-Increment**: A database trigger automatically increments the `usage_count` field on the `offers` table. This ensures the `total_usage_limit` check is fast and accurate without counting rows every time.

---

## 3. Frontend Implementation Guide (Offer Creation)

Since the backend logic is robust and supports a wide array of features, the Frontend needs to provide a rich UI to configure these options.

### API Endpoint

**POST** `/api/v1/admin/offers`

### Form Data Structure & UX Recommendations

#### Step 1: Basic Information

- **Title (`title`)**: _Required_. Marketing name (e.g., "Weekend Blitz").
- **Code (`code`)**: _Optional_. Promo code (e.g., "SAVE50").
- **Description (`description`)**: _Optional_. Internal or user-facing description.
- **Status**: Default to `Draft`. Allow toggle to `Active`.

#### Step 2: Discount Configuration

- **Discount Type (`discountType`)**: Select `percentage`, `fixed_amount`, or `fixed_price`.
- **Discount Value (`discountValue`)**: Number input.
  - _UX Tip_: If `percentage`, validate 0-100. If `fixed_amount`, show currency symbol.

#### Step 3: Limits & Validity

- **Start/End Date (`startsAt`, `endsAt`)**: Date-time pickers.
- **Per User Limit (`perUserLimit`)**: Number input (e.g., "1" for one-time use).
- **Total Usage Limit (`totalUsageLimit`)**: Number input (Global cap).

#### Step 4: Product Targeting

- **Apply To (`applyTo`)**: Toggle between "All Products" or "Specific Products".
- **Product Selector**:
  - If "Specific" selected, show a searchable multi-select dropdown for `Operator Products` (e.g., "MTN 1GB", "Airtel 500MB").
  - Send selected IDs as `productIds: ["uuid1", "uuid2"]`.

#### Step 5: User Eligibility Rules (The Power User Feature)

This requires a dynamic "Rule Builder" UI.

- **"Add Rule" Button**: Adds a new row to the rules list.
- **Rule Type Selector**: Dropdown with readable names (e.g., "New User", "Minimum Spend").
- **Dynamic Inputs**: Based on the selected type, show the relevant parameter fields.
  - _Example_: If "New User" selected, show input for "Account Age (Days)".
  - _Example_: If "Minimum Spend" selected, show inputs for "Amount" and "Window (Days)".
- **Logic Toggle**: "Match ALL rules" vs "Match ANY rule" (`eligibilityLogic`).

**Payload Example for Rules:**

```json
"rules": [
  {
    "rule_key": "new_user_promo",
    "rule_type": "new_user",
    "params": { "account_age_days": 7 },
    "description": "User joined in last 7 days"
  },
  {
    "rule_key": "big_spender",
    "rule_type": "min_spent",
    "params": { "amount": 5000, "window_days": 30 },
    "description": "Spent 5k in last month"
  }
]
```

### UX "Gotchas" to Handle

1.  **Validation**: Ensure `startsAt` < `endsAt`.
2.  **Rule Params**: Parameters are stored as JSON strings or objects in the backend, but the API expects an array of objects. Ensure numerical params (like days/amounts) are sent as numbers, not strings.
3.  **Draft Mode**: Encourage saving as "Draft" first so they can review the complex rule setup before going "Active".
