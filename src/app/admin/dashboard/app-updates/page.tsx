import { AppUpdateManagement } from "@/components/features/admin/app-updates/AppUpdateManagement";

export default function AdminAppUpdatesPage() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          App Updates Management
        </h2>
        <p className="text-muted-foreground">
          Configure mobile app version releases, force updates, and store
          redirection URLs.
        </p>
      </div>

      <AppUpdateManagement />
    </div>
  );
}
