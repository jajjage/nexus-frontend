"use client";

import { UserDashboard } from "./user-dashboard";

/**
 * DashboardWrapper
 * Routes to UserDashboard only
 *
 * Admin users are redirected to /admin/dashboard via login mutation
 * This route ONLY shows UserDashboard for regular users
 */
export function DashboardWrapper() {
  // Simply render the UserDashboard
  // Admin routing is handled in login mutation (see useLogin hook)
  return <UserDashboard />;
}
