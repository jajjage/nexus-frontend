# Frontend Admin Integration Guide

This guide provides detailed instructions for integrating key administrative features into the frontend application, specifically focusing on User Role Management and Offer Creation.

## 1. Upgrading User Roles (e.g., to Reseller)

To upgrade a user's role (e.g., from 'user' to 'reseller' or 'staff'), use the `assignRole` endpoint.

### Endpoint

`POST /api/v1/admin/users/assign-role`

### Payload

```json
{
  "userId": "uuid-of-the-user",
  "roleId": "uuid-of-the-target-role"
}
```

### Steps to Implement

1.  **Fetch Roles**: First, fetch the list of available roles to populate your dropdown.
    - `GET /api/v1/admin/roles`
    - Store the `id` and `name` of each role.
2.  **Select User**: In your user management list, select the user you want to upgrade.
3.  **Assign Role**: Call the `assignRole` endpoint with the `userId` and the selected `roleId`.

### UX Recommendation

- **Separation of Concerns**: In the Admin Dashboard, consider creating separate tabs or filters for "Users", "Resellers", and "Staff". This makes it easier to manage different cohorts.
- **Visual Cues**: Display the user's current role prominently (e.g., with a badge) in the user list.

---

## 2. Creating Offers & Deals

The Offer system is powerful but requires specific configuration to work correctly. If badges are not appearing on the frontend, it's usually due to a configuration mismatch.

### Endpoint

`POST /api/v1/admin/offers`

### Payload Checklist (Critical Fields)

Ensure your form sends the following fields correctly. **CamelCase** is supported by the controller but mapped to snake_case internally.

```json
{
  "title": "Reseller Special",
  "code": "RESELLER_DEAL_01", // Must be unique
  "description": "25% off for resellers",
  "status": "active", // Must be 'active' to show up
  "discountType": "percentage", // 'percentage', 'fixed_amount', 'fixed_price'
  "discountValue": 25,
  "applyTo": "operator_product", // 'operator_product', 'supplier_product', or 'all'
  "allowAll": false, // Set to false if restricting to specific products
  "startsAt": "2024-01-01T00:00:00Z", // Start date (ISO)
  "endsAt": "2024-12-31T23:59:59Z", // End date (ISO)

  // RELATIONS (Arrays)
  "productIds": ["uuid-of-product-1", "uuid-of-product-2"], // ⚠️ Array of Operator Product IDs
  "allowedRoles": ["reseller"] // ⚠️ Array of Role names (e.g. 'reseller')
}
```

### Troubleshooting: "Why isn't my badge showing?"

If you created an offer but don't see the "Deal" badge on the product card:

1.  **Status Check**: Is `status` set to `'active'`? (Drafts are hidden).
2.  **Date Window**: Is today's date between `startsAt` and `endsAt`?
3.  **Product Link**: Did you send the correct `productIds`?
    - **Common Mistake**: Sending `operator_product_ids` or `ids` instead of `productIds`. The backend explicitly looks for `req.body.productIds`.
4.  **Role Restriction**:
    - If you set `allowedRoles: ['reseller']`, a normal 'user' will **NOT** see the badge.
    - You must be logged in as a user with the 'reseller' role to see it.
5.  **Apply To Enum**: Ensure `applyTo` is one of `['operator_product', 'supplier_product', 'all']`. Sending 'specific' will fail.

---

## 3. UI/UX Advice for User Management

To improve the admin experience:

- **Filter by Role**: Add a dropdown filter at the top of your "All Users" table to filter by `Role` (User, Reseller, Staff, Admin).
- **Reseller View**: Create a dedicated "Resellers" view. Resellers are high-value partners, so accessing their details quickly is important.
- **Bulk Actions**: Allow selecting multiple users to "Upgrade to Reseller" in one go (if you implement a bulk endpoint later).

---

### Summary for "Upgrade Role" Flow

1.  Admin goes to **User Details** page.
2.  Clicks "Edit Role" or "Upgrade".
3.  Selects "Reseller" from dropdown (populated from `GET /roles`).
4.  Frontend POSTs to `/assign-role`.
5.  Success message: "User upgraded to Reseller".
6.  User now has access to offers with `allowedRoles: ['reseller']`.
