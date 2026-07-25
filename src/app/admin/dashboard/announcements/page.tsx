import { AnnouncementManagement } from "@/components/features/admin/announcements/AnnouncementManagement";

export default function AdminAnnouncementsPage() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground">
          Create targeted dashboard announcement modals for mobile users.
        </p>
      </div>

      <AnnouncementManagement />
    </div>
  );
}
