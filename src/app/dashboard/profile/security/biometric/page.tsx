"use client";

import { BiometricManagement } from "@/components/features/biometric/biometric-management";
import { BiometricRegistration } from "@/components/features/biometric/biometric-registration";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BiometricPage() {
  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col p-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/profile/security">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            Biometric Settings
          </h1>
        </header>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <BiometricRegistration />
        <BiometricManagement />
      </div>
    </div>
  );
}
