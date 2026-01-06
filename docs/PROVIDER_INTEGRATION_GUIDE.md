# Admin Frontend Integration Guide: Providers

This guide details how to integrate the administrative endpoints for managing **Providers**. Providers (e.g., PalmPay, Monnify) are responsible for virtual account generation and handling incoming payments.

---

## 1. Authentication & Permissions

All endpoints require:

1.  **Bearer Token:** `Authorization: Bearer <token>` in the header.
2.  **Admin Role:** The logged-in user must have the `admin` role.
3.  **Permission:** `system.settings`.

---

## 2. Provider API Reference

### A. List All Providers

Fetch all configured providers.

- **Endpoint:** `GET /api/v1/admin/providers`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "providers": [
        {
          "id": "uuid-1",
          "name": "palmpay",
          "apiBase": "https://...",
          "isActive": true,
          "createdAt": "2026-01-01T..."
        }
      ]
    }
  }
  ```

### B. Create New Provider

- **Endpoint:** `POST /api/v1/admin/providers`
- **Body:**
  ```json
  {
    "name": "monnify", // Required (unique)
    "apiBase": "https://...", // Optional
    "webhookSecret": "...", // Optional (will be encrypted)
    "isActive": true,
    "config": {
      // Optional JSON
      "key": "value"
    }
  }
  ```

### C. Update Provider

Update an existing provider's configuration.

- **Endpoint:** `PUT /api/v1/admin/providers/:providerId`
- **Body:** (Any fields from Create)
  ```json
  {
    "isActive": false,
    "apiBase": "https://new-api.com"
  }
  ```

### D. Delete Provider

- **Endpoint:** `DELETE /api/v1/admin/providers/:providerId`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Provider deleted successfully"
  }
  ```

---

## 3. Implementation Notes

- **Secrets:** When creating or updating, the `webhookSecret` is sent as plain text. The backend automatically encrypts it using `AES-256-GCM` before storage.
- **Validation:** Use UUID format for `:providerId` in path parameters.
