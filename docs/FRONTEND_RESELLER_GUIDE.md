# Frontend Reseller Integration Guide

This guide details the integration points for the new **Reseller** features. These features are accessible only to users with the `reseller` role.

---

## 1. Bulk Topup (Batch Transactions)

Allows resellers to process multiple topups in a single request.

### **Endpoint**

`POST /api/v1/reseller/bulk-topup`

### **Authentication**

- **Method 1 (Browser):** Standard Cookie/Bearer Token (JWT).
- **Method 2 (API Client):** `X-API-KEY: <your_api_key>` header.

### **Request Payload**

```typescript
interface BulkTopupRequest {
  batchName?: string; // Optional friendly name for the batch
  pin?: string; // User's 4-digit transaction PIN (Required if using JWT)
  requests: Array<{
    recipientPhone: string; // Target phone number (e.g. "08012345678")
    amount: number; // Amount in Naira
    productCode: string; // Product code (e.g. "MTN-DATA-1GB")
  }>;
}
```

### **Response (200 OK)**

Returns a summary of the batch operation. Note that `success: true` means the _batch was processed_, but individual items might have failed. Check `results`.

```typescript
interface BulkTopupResponse {
  success: boolean;
  message: string;
  data: {
    batchId: string;
    successCount: number;
    failedCount: number;
    totalCost: number;
    results: Array<{
      recipientPhone: string;
      productCode: string;
      status: "success" | "failed";
      topupId?: string; // ID of the created topup request (if success)
      reason?: string; // Error message (if failed)
    }>;
  };
}
```

### **Frontend Logic Checklist**

- [ ] Ensure user has `reseller` role.
- [ ] Limit batch size to **50 items** per request (UI validation).
- [ ] Show a progress bar or spinner while processing (can take a few seconds).
- [ ] Display a "Batch Report" modal after completion, highlighting any failed items.

---

## 2. API Key Management

Allows resellers to manage API keys for their own integrations.

### **A. List API Keys**

**Endpoint:** `GET /api/v1/reseller/keys`

**Response:**

```typescript
{
  success: boolean;
  data: {
    keys: Array<{
      id: string;
      name: string;
      key_prefix: string; // e.g. "nx_live_abcd..."
      is_active: boolean;
      last_used_at: string | null;
      created_at: string;
    }>;
  }
}
```

### **B. Generate API Key**

**Endpoint:** `POST /api/v1/reseller/keys`

**Payload:**

```json
{
  "name": "My Website Integration",
  "isLive": true
}
```

**Response (201 Created):**
⚠️ **Important:** The full key is returned **ONLY ONCE**. You must display it immediately and warn the user to save it.

```typescript
{
  success: boolean;
  data: {
    id: string;
    key: string; // Full key: "nx_live_randomstring..."
  }
}
```

### **C. Revoke API Key**

**Endpoint:** `DELETE /api/v1/reseller/keys/:keyId`

**Response:**

```json
{
  "success": true,
  "message": "API Key revoked successfully"
}
```

---

## 3. Reseller Dashboard UI Recommendations

### **Wallet & Bonus**

- Resellers receive automatic bonuses on the 1st of each month based on volume.
- **Action:** Add a "Bonuses" tab or section in the Wallet History to filter transactions by `related_type: 'performance_bonus'`.

### **Navigation**

- If `user.role === 'reseller'`, verify if they should see a distinct "Reseller Hub" link in the sidebar containing:
  - Bulk Topup Tool
  - API Key Management
  - Reseller Offers (Filtered product list)

---

## 4. Error Handling

| Status Code | Meaning           | User Message                                                                                 |
| :---------- | :---------------- | :------------------------------------------------------------------------------------------- |
| `400`       | Bad Request       | "Please check your input. Batch size must be <= 50."                                         |
| `401`       | Unauthorized      | "Invalid PIN or API Key."                                                                    |
| `403`       | Forbidden         | "You do not have permission to perform this action. Contact support to upgrade to Reseller." |
| `429`       | Too Many Requests | "You are sending requests too fast. Please slow down."                                       |
