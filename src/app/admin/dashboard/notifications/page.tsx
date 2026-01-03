import { NotificationListTable } from "@/components/features/admin/notifications/NotificationListTable";
import { NotificationTemplatesTable } from "@/components/features/admin/notifications/NotificationTemplatesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Admin Notifications Management Page
 * Route: /admin/dashboard/notifications
 */
export default function AdminNotificationsPage() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Notification Management
        </h2>
        <p className="text-muted-foreground">
          Create and manage notifications and templates.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="mt-4">
          <NotificationListTable />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <NotificationTemplatesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
