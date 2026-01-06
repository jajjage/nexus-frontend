"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { Activity, Search, User } from "lucide-react";
import { useState } from "react";
import { UserActivityTable } from "./UserActivityTable";

export function GlobalUserActivitySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  // Search users when query is entered
  const shouldSearch = searchQuery.length >= 2;
  const { data, isLoading } = useAdminUsers(
    shouldSearch ? { search: searchQuery, limit: 5 } : undefined
  );

  const users = shouldSearch ? data?.data?.users || [] : [];

  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSearchQuery("");
  };

  const handleClearSelection = () => {
    setSelectedUserId(null);
    setSelectedUserName("");
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedUserId ? (
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <User className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{selectedUserName}</p>
                  <p className="text-muted-foreground text-xs">
                    Viewing activity logs
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Change User
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by email or name..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="rounded-md border">
                  {isLoading ? (
                    <div className="space-y-2 p-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <p className="text-muted-foreground p-4 text-center text-sm">
                      No users found
                    </p>
                  ) : (
                    <div className="divide-y">
                      {users.map((user: any) => (
                        <button
                          key={user.id}
                          onClick={() =>
                            handleSelectUser(user.id, user.fullName)
                          }
                          className="hover:bg-muted/50 flex w-full items-center gap-3 p-3 text-left transition-colors"
                        >
                          <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                            <User className="text-primary h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {user.fullName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            variant={
                              user.isSuspended ? "destructive" : "secondary"
                            }
                          >
                            {user.isSuspended ? "Suspended" : "Active"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {searchQuery.length < 2 && searchQuery.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Table */}
      {selectedUserId && <UserActivityTable userId={selectedUserId} />}
    </div>
  );
}
