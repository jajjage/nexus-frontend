# Frontend Integration Guide: Offer System

This guide outlines how to integrate the Offer System into the Admin Dashboard and the User Application.

---

## 🏛️ Admin Dashboard (Management)

The Admin side allows creating complex, segmented offers. The creation endpoint is "relational," meaning you can send products, rules, and whitelists in a single payload.

### 1. Creating an Offer

**Endpoint:** `POST /api/v1/admin/offers`

**Key Concepts:**

- **Fan-out:** You can select specific `productIds` OR entire `supplierIds`. If you select a Supplier (e.g., "PalmPay"), the backend automatically finds all products mapped to that supplier and links them.
- **Rules:** Eligibility rules are defined as a JSON array.

**Payload Example:**

```json
{
  "title": "10% Off MTN Data",
  "description": "Special deal for new users",
  "status": "active",
  "discountType": "percentage",
  "discountValue": 10,
  "startsAt": "2024-01-01T00:00:00Z",
  "endsAt": "2024-01-31T23:59:59Z",
  "applyTo": "supplier_product",

  // 1. Product Association (Fan-out)
  "supplierIds": ["uuid-of-palmpay-supplier"],
  // OR use "productIds": ["uuid-1", "uuid-2"] for specific picking

  // 2. Eligibility Rules
  "rules": [
    {
      "rule_key": "new_user_check",
      "rule_type": "new_user",
      "description": "Account created < 30 days ago",
      "params": { "account_age_days": 30 }
    },
    {
      "rule_key": "min_spend_check",
      "rule_type": "min_spent",
      "description": "Must have spent 5000 NGN lifetime",
      "params": { "amount": 5000 }
    }
  ],

  // 3. Whitelists (Optional)
  "allowedRoles": ["user", "staff"]
}
```

### 2. Supported Rule Types

When building the "Rule Builder" UI, use these types:

| Rule Type              | Params Required (JSON)                  | Description                                |
| :--------------------- | :-------------------------------------- | :----------------------------------------- |
| `new_user`             | `{ "account_age_days": 30 }`            | User registered within X days.             |
| `min_spent`            | `{ "amount": 5000, "window_days": 30 }` | Spent X amount (optional: in last Y days). |
| `min_topups`           | `{ "count": 5 }`                        | Completed X successful transactions.       |
| `operator_topup_count` | `{ "operator_id": "uuid", "count": 2 }` | Bought specific operator X times.          |

### 3. Managing Segments

For offers targeting complex groups, you can pre-calculate eligible users.

- **Compute Segment:** `POST /api/v1/admin/offers/{id}/compute-segment` (Triggers background calculation).
- **View Members:** `GET /api/v1/admin/offers/{id}/eligible-users`.
- **Preview:** `GET /api/v1/admin/offers/{id}/preview-eligibility?limit=10` (Good for testing rules before activating).

---

## 📱 User Application (Public & Checkout)

The user app needs to display offers ("Was N100, Now N90") and apply them during checkout.

### 1. Displaying Products with Offers

**Endpoint:** `GET /api/v1/products`

**New Features:**

1.  **Filter:** Add `?hasOffer=true` to fetch only products with active promotions (e.g., for a "Flash Sales" section).
2.  **Enriched Response:** Products now contain an `activeOffer` object if a promotion applies.

**Response Example:**

```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "MTN 1GB Data",
      "denomAmount": 1000, // Base Price
      "discountedPrice": 900, // <--- PRE-CALCULATED FOR UI
      "activeOffer": {
        // <--- IF NULL, NO OFFER
        "id": "offer_abc",
        "title": "Flash Sale",
        "discountType": "percentage",
        "discountValue": 10,
        "discountAmount": 100
      }
    }
  ]
}
```

**UI Recommendation:**

- If `activeOffer` exists, show `denomAmount` with a **strikethrough** and display `discountedPrice` prominently.
- Show a badge with `activeOffer.title` (e.g., "Flash Sale").

### 2. Checking "My Offers"

**Endpoint:** `GET /api/v1/user/offers/my-eligible`

- Returns a list of offers specific to the logged-in user (based on the rules engine).
- Use this for a "Rewards" or "Coupons" screen.

### 3. Applying Offer at Checkout (Topup)

**Endpoint:** `POST /api/v1/user/topup`

**Workflow:**

1.  User selects a product.
2.  If the product object has an `activeOffer`, store the `activeOffer.id`.
3.  When submitting the Topup, include `offerId` in the body.

**Payload:**

```json
{
  "amount": 1000,
  "productCode": "MTN_1GB",
  "recipientPhone": "08012345678",
  "pin": "1234",
  "offerId": "offer_abc" // <--- NEW FIELD
}
```

**Error Handling:**

- If the user is **not eligible** (e.g., rule check fails), the API returns `403`.
- **UI Strategy:** It is recommended to validate the offer _before_ the final PIN step if you want to show an error early, though the Topup endpoint handles the check atomically.
- **Validation Endpoint:** `POST /api/v1/user/offers/validate` (Optional pre-check).

---

## 🧪 Testing the Flow

1.  **Admin:** Create an offer with `applyTo: "all"` and `discountValue: 50`.
2.  **User UI:** Refresh product list. Verify all products show 50% off prices.
3.  **User Checkout:** Perform a topup.
4.  **Verify:** Check `offer_redemptions` table or User Transaction History to ensure only the discounted amount was debited.
