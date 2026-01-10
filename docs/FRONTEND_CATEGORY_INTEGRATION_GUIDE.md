# Frontend Guide: Category & Product Integration

## Overview

We have introduced a **Category** system to group products (e.g., "SME Data", "Gifting", "Corporate Gifting"). This allows the frontend to show tabs or dropdowns for better UX when purchasing data or airtime.

---

## 1. Fetching Categories

Use this endpoint to populate your filter tabs or category selection UI.

**Endpoint:** `GET /api/v1/categories`
**Authentication:** Public (No token required)
**Caching:** 1 Hour (Server-side)

### Response Structure:

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid-1234",
      "name": "SME Data",
      "slug": "sme-data",
      "description": "Small and Medium Enterprise Data Plans",
      "priority": 1,
      "isActive": true
    },
    {
      "id": "uuid-5678",
      "name": "Gifting",
      "slug": "gifting",
      "priority": 2,
      "isActive": true
    }
  ]
}
```

---

## 2. Displaying Products with Categories

The product listing endpoint now includes category information for every product.

**Endpoint:** `GET /api/v1/products`

### Response Structure (Fragment):

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "prod-uuid",
        "name": "MTN 1GB SME",
        "denomAmount": 550,
        "category": {
          "name": "SME Data",
          "slug": "sme-data"
        }
      }
    ]
  }
}
```

---

## 3. UI Implementation Strategy

### A. Categorized Tabs (Recommended)

Instead of one long list, show categories as horizontal tabs.

1. Fetch all categories.
2. Render tabs based on `category.name`.
3. Filter the products list locally based on `product.category.slug === activeTabSlug`.

### B. Grouped List

Render a vertical list where products are grouped under headers.

```text
SME DATA
- 500MB (395)
- 1GB (550)

GIFTING
- 1GB Weekly (776)
```

---

## 4. Admin Management (Dashboard)

If you are building the admin panel, use these endpoints:

- **Create Category:** `POST /api/v1/admin/categories` (Auth required)
- **Update Category:** `PUT /api/v1/admin/categories/:id`
- **Delete Category:** `DELETE /api/v1/admin/categories/:id`

### Assigning a Category to a Product

When creating or updating a product via `POST /api/v1/admin/products`, include the `categoryId`:

```json
{
  "name": "MTN 500MB Share",
  "operatorId": "...",
  "categoryId": "uuid-of-sme-category",
  "denomAmount": 395
  ...
}
```

---

## Summary of Changes

- Products now have a `category` object.
- Categories have a `priority` field for sorting (0 is highest).
- Always use `slug` for internal logic/routing and `name` for display.
