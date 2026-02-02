"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        // Not authenticated - Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname);
        // Prevent infinite loops if already on login
        if (!pathname.startsWith("/login")) {
          // toast.error("Please login to continue");
          router.replace(`/login?returnUrl=${returnUrl}`);
        }
      } else if (requireAdmin && user.role !== "admin") {
        // Authenticated but not admin
        toast.error("Access denied. Admin privileges required.");
        router.replace("/dashboard");
      } else {
        // Authenticated and authorized
        setIsChecking(false);
      }
    }
  }, [isLoading, isAuthenticated, user, requireAdmin, router, pathname]);

  // Show loading state while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  // If we get here, the user is authenticated (and authorized)
  return <>{children}</>;
}
