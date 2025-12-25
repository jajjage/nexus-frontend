import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth Handlers
  http.get("*/api/v1/auth/profile", () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: "user-123",
        email: "test@example.com",
        role: "user",
        fullName: "Test User",
        isSuspended: false,
        permissions: ["view_dashboard"],
      },
    });
  }),

  http.post("*/api/v1/auth/login", async ({ request }) => {
    return HttpResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          userId: "user-123",
          email: "test@example.com",
          role: "user",
          fullName: "Test User",
          isSuspended: false,
        },
        accessToken: "fake-jwt-token",
      },
    });
  }),

  http.post("*/api/v1/auth/logout", () => {
    return HttpResponse.json({ success: true, message: "Logged out" });
  }),

  // User Handlers
  http.get("*/api/v1/user/profile/me", () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: "user-123",
        email: "test@example.com",
        name: "Test User",
        walletBalance: 5000,
        isSuspended: false,
      },
    });
  }),

  // Notification Handlers
  http.get("*/notifications", () => {
    console.log("[MSW] Handling /notifications request");
    return HttpResponse.json({
      success: true,
      data: {
        notifications: [
          {
            id: "notif-1",
            notification: {
              id: "n1",
              title: "System Update",
              body: "We are updating the system",
              category: "updates",
              type: "info",
            },
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "notif-3",
            notification: {
              id: "n3",
              title: "Important Alert",
              body: "This is for everyone",
              category: "all",
              type: "warning",
            },
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  }),
];
