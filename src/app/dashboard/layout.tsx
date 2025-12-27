"use client";

import { FcmSyncer } from "@/components/FcmSyncer";
import { BiometricPromptModal } from "@/components/features/biometric/biometric-prompt-modal";
import { DesktopSidebar } from "@/components/features/dashboard/desktop-sidebar";
import { HomeNotificationBanner } from "@/components/notification/home-notification-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 flex min-h-screen w-full">
      <DesktopSidebar className="hidden md:flex" />
      <main className="w-full flex-1">
        <FcmSyncer />
        <HomeNotificationBanner />
        <BiometricPromptModal />
        {children}
      </main>
    </div>
  );
}
