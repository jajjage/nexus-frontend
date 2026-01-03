import { BiometricDashboard } from "@/components/features/admin/biometric/BiometricDashboard";

/**
 * Admin Biometric Management Page
 * Route: /admin/dashboard/biometric
 */
export default function AdminBiometricPage() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Biometric Management
        </h2>
        <p className="text-muted-foreground">
          Monitor and manage biometric enrollments and verifications.
        </p>
      </div>

      <BiometricDashboard />
    </div>
  );
}
