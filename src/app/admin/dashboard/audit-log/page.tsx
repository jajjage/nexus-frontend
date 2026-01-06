"use client";

import {
  AuditLogTable,
  GlobalUserActivitySearch,
} from "@/components/features/admin/audit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UserCog } from "lucide-react";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Track admin actions and user activity
        </p>
      </div>

      <Tabs defaultValue="admin-actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admin-actions" className="gap-2">
            <FileText className="h-4 w-4" />
            Admin Actions
          </TabsTrigger>
          <TabsTrigger value="user-activity" className="gap-2">
            <UserCog className="h-4 w-4" />
            User Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin-actions">
          <AuditLogTable />
        </TabsContent>

        <TabsContent value="user-activity">
          <GlobalUserActivitySearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
