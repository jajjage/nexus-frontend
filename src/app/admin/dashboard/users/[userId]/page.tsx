import { UserDetailView } from "@/components/features/admin/users/UserDetailView";

/**
 * Admin User Detail Page
 * Route: /admin/dashboard/users/[userId]
 */
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <UserDetailView userId={userId} />;
}
