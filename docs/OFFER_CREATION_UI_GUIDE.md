# Offer Creation UI Implementation Guide

This guide details how to implement the "Create Offer" user interface, specifically addressing how to populate dropdowns for product/supplier association and how to structure the eligibility criteria rules.

---

## 1. Associating Products & Suppliers

When creating an offer, the user can choose to apply it to specific products (Operator Products) or entire suppliers (all products from a supplier).

### A. Fetching the Options

To populate the selection dropdowns/multiselects in the "Association" step of the wizard:

#### 1. Fetch All Suppliers

Use this endpoint to get the list of available suppliers.

- **Endpoint:** `GET /api/v1/admin/suppliers`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "suppliers": [
        { "id": "uuid-1", "name": "PalmPay", "slug": "palmpay", ... },
        { "id": "uuid-2", "name": "Monnify", "slug": "monnify", ... }
      ]
    }
  }
  ```
- **UI Usage:** Populate the "Select Suppliers" dropdown. Use `id` as the value and `name` as the label.

#### 2. Fetch All Products

Use this endpoint to get the list of operator products (e.g., MTN 1GB, Airtel N500).

- **Endpoint:** `GET /api/v1/admin/products`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "products": [
        { "id": "prod-1", "name": "MTN 1GB Data", "productCode": "MTN-1GB", ... },
        { "id": "prod-2", "name": "Airtel N500 Airtime", "productCode": "AIRTEL-500", ... }
      ]
    }
  }
  ```
- **UI Usage:** Populate the "Select Products" dropdown. Use `id` as the value and `name` as the label.

### B. Sending the Payload

When submitting the `POST /api/v1/admin/offers` request, include the selected IDs in the body:

```json
{
  "title": "Weekend Data Slash",
  "applyTo": "operator_product", // or "supplier_product" if selecting suppliers
  // ... other fields ...
  "productIds": ["prod-1", "prod-2"], // Array of selected Product IDs
  "supplierIds": ["uuid-1"] // Array of selected Supplier IDs (if applicable)
}
```

---

## 2. Configuring Eligibility Criteria

The backend supports a flexible rule engine. The UI should provide a "Rule Builder" interface.

### Supported Rule Types

Currently, the system supports storing arbitrary rules, but the execution logic depends on `is_user_eligible_for_offer` DB function. Common supported patterns are:

| Rule Type       | Params Schema                         | Description                                        |
| :-------------- | :------------------------------------ | :------------------------------------------------- |
| `min_spend`     | `{ "amount": 5000, "period": "30d" }` | User must have spent X amount in last Y period.    |
| `min_tx_count`  | `{ "count": 5 }`                      | User must have at least X successful transactions. |
| `new_user`      | `{ "days": 7 }`                       | User account created within the last X days.       |
| `specific_role` | `{ "role": "agent" }`                 | (Alternatively use `allowedRoles` field)           |

### UI Implementation

1.  **Rule Selector:** A dropdown to select the "Rule Type" (e.g., "Minimum Spend").
2.  **Parameter Inputs:** Based on the selected type, show inputs for the parameters (e.g., a number input for `amount`).
3.  **List:** Allow adding multiple rules.

### Sending the Payload

Map the UI builder to the `rules` array in the create payload:

```json
{
  "title": "High Value User Discount",
  "eligibilityLogic": "all", // "all" = AND (must match all rules), "any" = OR (match at least one)
  "rules": [
    {
      "rule_key": "rule_1", // Random unique string
      "rule_type": "min_spend",
      "params": { "amount": 10000, "period": "30d" },
      "description": "Must have spent 10k in last 30 days"
    },
    {
      "rule_key": "rule_2",
      "rule_type": "min_tx_count",
      "params": { "count": 10 },
      "description": "Must have at least 10 transactions"
    }
  ]
}
```

---

## 3. Recomputing Segments

If you change the rules of an active offer, the system does not automatically re-evaluate all users immediately (for performance).

**UI Action:**
After creating or updating an offer with specific criteria (not "allow_all"), show a **"Refresh Segment"** button in the offer details page.

- **Endpoint:** `POST /api/v1/admin/offers/:offerId/compute-segment`
- **Effect:** Runs a background job to find all users matching the new rules and populates the `offer_segment_members` table for fast lookup.
