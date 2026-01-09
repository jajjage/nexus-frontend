# Frontend Guide: "Become a Reseller" Feature

## Overview

This feature allows standard users to request an upgrade to a **Reseller** account. Resellers get access to special pricing (discounts) and API keys for bulk operations.

The goal is to entice regular users who perform high volumes of transactions to upgrade, and to provide a simple contact form for them to request this status.

---

## 1. UI/UX Implementation Strategy

### A. Navigation Bar Logic

We want to promote this feature to anyone who is _not_ yet a reseller.

**Logic:**

```javascript
// Example React/Vue Logic
const showBecomeReseller = user.isAuthenticated && user.role !== "reseller";

if (showBecomeReseller) {
  // Render "Become a Reseller" button/link in Navbar
  // Ideally styled distinctively (e.g., a gold/star icon or outline button)
}
```

### B. Landing Page / Modal Content ("The Pitch")

When the user clicks "Become a Reseller", show a dedicated page or a nice modal with the following selling points:

#### **Headline:** "Unlock Exclusive Wholesale Rates & Earn More"

#### **Why Upgrade?**

1.  **Massive Discounts:** Get up to **10% OFF** on data and airtime bundles.
2.  **Bulk Tools:** Send credit to 50+ numbers at once with our Batch Top-up tool.
3.  **API Access:** Integrate our services directly into your own website or app.
4.  **Priority Support:** Get a dedicated account manager for your business needs.

### C. The Request Form

Keep it simple. We verify their identity manually, so we just need their "pitch".

**Fields:**

- **User Name/Email/Phone:** (Auto-filled / Read-only from their profile)
- **Message (Required):** A text area.
  - _Placeholder:_ "Tell us about your business (e.g., 'I run a cyber cafe in Lagos and do about 50k daily volume')."

**Action:**

- **Button:** "Submit Application"

---

## 2. API Integration

### Endpoint

**POST** `/api/v1/reseller/request-upgrade`

### Authentication

Requires **Bearer Token** (User must be logged in).

### Request Body

```json
{
  "message": "I run a cyber cafe and want to resell data."
}
```

### Response (Success - 200 OK)

```json
{
  "status": "success",
  "message": "Request sent successfully. We will contact you shortly.",
  "data": null
}
```

### Response (Error - 400 Bad Request)

```json
{
  "status": "error",
  "message": "Message is required"
}
```

---

## 3. Implementation Checklist

- [ ] **Navbar:** Add conditional "Become a Reseller" link.
- [ ] **Page/Modal:** Create the "Pitch" UI with the benefits listed above.
- [ ] **Form:** Connect the form submit to `POST /api/v1/reseller/request-upgrade`.
- [ ] **Feedback:** Show a success toast/alert when the email is sent.
- [ ] **State:** Disable the button while submitting (`isLoading`).

---

## 4. Visual Inspiration (Copy)

> "Turn your network into net worth. Join the Nexus Data Reseller program today and start earning on every transaction."
