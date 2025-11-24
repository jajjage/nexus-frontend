"use client";

import { FcmSyncer } from "@/components/FcmSyncer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FcmSyncer />
      {children}
    </>
  );
}
