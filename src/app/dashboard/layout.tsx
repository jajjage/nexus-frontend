"use client";

import { FcmSyncer } from "@/components/FcmSyncer";
import { DesktopSidebar } from "@/components/features/dashboard/desktop-sidebar";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { HomeNotificationBanner } from "@/components/notification/home-notification-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="bg-muted/40 flex min-h-screen w-full">
        <DesktopSidebar className="hidden md:flex" />
        <main className="w-full flex-1">
          <FcmSyncer />
          <HomeNotificationBanner />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
