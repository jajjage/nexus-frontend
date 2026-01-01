"use client";

import { LoginForm } from "@/components/features/auth/login-form";
import { Spinner } from "@/components/ui/spinner";
import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";

/**
 * Admin Login Page
 * Route: /admin/login
 *
 * Distinct login page for admin users with 2FA support
 */
export default function AdminLoginPage() {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-card flex items-center gap-2 border-b px-6 py-4">
        <ShieldCheck className="text-primary h-6 w-6" />
        <span className="text-lg font-semibold">Nexus Admin</span>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Spinner className="text-primary size-8" />
            </div>
          }
        >
          <LoginForm role="admin" />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground border-t px-6 py-4 text-center text-sm">
        &copy; {new Date().getFullYear()} Nexus Data. Admin Portal.
      </footer>
    </div>
  );
}
