"use client";

import { SetupWizard } from "@/components/features/auth/setup-wizard";
import { PageLoader } from "@/components/ui/page-loader";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function SetupContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <SetupWizard />
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading..." />}>
      <SetupContent />
    </Suspense>
  );
}
