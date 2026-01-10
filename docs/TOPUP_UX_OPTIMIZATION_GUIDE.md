# Topup UX Optimization Guide

## 🚀 Updating the Frontend for Better UX

We have upgraded the backend with **Product Categories** and **Async Processing**. Here is how to update the frontend flow to take advantage of these features for a faster, cleaner user experience.

---

## 1. Organizing the Product List (New!)

**Problem:** Currently, the user might see a long list of mixed plans (SME, Gifting, Airtime).
**Solution:** Use the new Categories API to create **Tabs**.

### Implementation

1.  **Fetch Categories:** Call `GET /api/v1/categories`.
2.  **Create Tabs:** Render tabs dynamically: `[ SME Data ] [ Gifting ] [ Corporate ]`.
3.  **Filter Products:** When fetching `GET /api/v1/products`, filter the displayed list based on the active tab's `slug`.
    - _Result:_ Users find "Cheap Data" (SME) instantly without scrolling through expensive "Gifting" plans.

---

## 2. The "Fire-and-Forget" Flow (Faster UI)

**Problem:** Waiting for the spinner to stop can feel slow if the network provider takes 5-10 seconds.
**Solution:** Treat `pending` as "Success".

### The Updated Logic

When you call `POST /topup`:

1.  **Backend Response:** Returns `201 Created` immediately after debiting the wallet.
2.  **Status:** The data usually says `status: "pending"` (meaning: Sent to Provider).
3.  **UI Action:**
    - ✅ **DO:** Show "Transaction Successful!" or "Order Placed".
    - ❌ **DON'T:** Keep the spinner loading until `status: "success"`.

**Why?**

- The money is already deducted. The deal is done.
- If the Provider fails later (e.g., in 1 minute), the **Backend automatically refunds the wallet**.
- The user will see the refund in their history. You don't need to make them wait for this edge case.

---

## 3. Optimistic Balance Updates

Make the app feel instant.

1.  **User clicks "Buy ₦500".**
2.  **Frontend:** Immediately subtract ₦500 from the _local state_ wallet balance.
3.  **Frontend:** Show "Success" screen.
4.  **Background:** The API response comes back.
    - If successful: Do nothing (balance matches).
    - If error (4xx/5xx): **Add ₦500 back** and show a Toast error ("Purchase failed").

---

## 4. Input Enhancements

- **Phone Number:** If the user selects "MTN", validates the phone number starts with standard MTN prefixes (`0803`, `0806`, etc.) or show a gentle warning.
- **Recent Numbers:** Use `localStorage` to save the last 5 successful numbers. Show them as clickable "Chips" above the input field.

---

## 5. Summary of API Changes

| Feature       | Endpoint           | usage                                                        |
| :------------ | :----------------- | :----------------------------------------------------------- |
| **Get Tabs**  | `GET /categories`  | Render Tabs                                                  |
| **Get Plans** | `GET /products`    | Now includes `category: { slug: "..." }` for easy filtering. |
| **Purchase**  | `POST /user/topup` | Returns fast. Trust the 201 status.                          |
