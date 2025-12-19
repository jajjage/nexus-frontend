"use client";

import { FcmSyncer } from "@/components/FcmSyncer";
import { HomeNotificationBanner } from "@/components/notification/home-notification-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FcmSyncer />
      <HomeNotificationBanner />
      {children}
    </>
  );
}
