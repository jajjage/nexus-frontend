/**
 * Dashboard Page - User Dashboard Only
 * Route: /dashboard
 *
 * This page renders the UserDashboard component.
 * Admin users are redirected to /admin/dashboard via the login mutation.
 *
 * If an admin somehow reaches this route, they will only see the user dashboard.
 * For admin-only functionality, visit /admin/dashboard
 */
import { DashboardWrapper } from "@/components/features/dashboard/dashboard-wrapper";

export default function DashboardPage() {
  return <DashboardWrapper />;
}
