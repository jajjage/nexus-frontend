"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { adminUserService } from "@/services/admin/user.service";
import { AdminUser, UserLifecycleSegment } from "@/types/admin/user.types";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MessageCircle,
  Search,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LifecycleFilter = UserLifecycleSegment | "all";

const lifecycleSegments: Array<{ id: LifecycleFilter; label: string }> = [
  { id: "all", label: "All customers" },
  { id: "never_activated", label: "Never activated" },
  { id: "active", label: "Active" },
  { id: "at_risk", label: "At risk" },
  { id: "churned", label: "Churned" },
  { id: "dormant", label: "Dormant" },
];

const lifecycleLabels: Record<UserLifecycleSegment, string> = {
  never_activated: "Never activated",
  active: "Active",
  at_risk: "At risk",
  churned: "Churned",
  dormant: "Dormant",
};

function formatLifecycleDate(
  value: string | null | undefined,
  timeZone: string
) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

const formatForWhatsApp = (phone: string) => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    return `234${cleanPhone.substring(1)}`;
  }
  return cleanPhone;
};

export function UserListTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearch = useDebounce(searchInput, 500);
  const [roleFilter, setRoleFilter] = useState<string>(
    searchParams.get("role") || "all"
  );
  const initialLifecycle = searchParams.get("lifecycleSegment");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>(
    lifecycleSegments.some((segment) => segment.id === initialLifecycle)
      ? (initialLifecycle as LifecycleFilter)
      : "all"
  );
  const [isExporting, setIsExporting] = useState(false);
  const isSearchActive = !!debouncedSearch.trim();

  const limit = 10;

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", page.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (lifecycleFilter !== "all") {
      params.set("lifecycleSegment", lifecycleFilter);
    }

    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;

    // Only update if URL actually changed to avoid infinite loops
    const currentQueryString = searchParams.toString();
    if (queryString !== currentQueryString) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    page,
    debouncedSearch,
    roleFilter,
    lifecycleFilter,
    pathname,
    router,
    searchParams,
  ]);

  // Reset page when search term changes
  if (debouncedSearch !== prevSearch) {
    setPrevSearch(debouncedSearch);
    if (page !== 1) setPage(1);
  }

  const { data, isLoading, isFetching, isError, refetch } = useAdminUsers({
    page,
    limit,
    role: roleFilter === "all" ? undefined : roleFilter,
    search: debouncedSearch,
    lifecycleSegment: lifecycleFilter === "all" ? undefined : lifecycleFilter,
  });

  const pagination = data?.data?.pagination;

  // Server is source of truth for search/filter/pagination.
  const users = data?.data?.users || [];
  const lifecycleCounts = data?.data?.lifecycleCounts;
  const lifecycleTimezone = data?.data?.lifecycleTimezone || "Africa/Lagos";

  const exportFilteredUsers = async () => {
    if (lifecycleFilter === "all") return;
    setIsExporting(true);
    try {
      const blob = await adminUserService.exportUsers({
        lifecycleSegment: lifecycleFilter,
        role: roleFilter === "all" ? undefined : roleFilter,
        search: debouncedSearch || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nexus-${lifecycleFilter}-users.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success("Filtered users exported");
    } catch {
      toast.error("Could not export users");
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: "all", label: "All Users" },
    { id: "admin", label: "Admins" },
    { id: "staff", label: "Staff" },
    { id: "reseller", label: "Resellers" },
    { id: "user", label: "Users" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Users</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportFilteredUsers}
            disabled={lifecycleFilter === "all" || isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export segment"}
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/dashboard/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={roleFilter === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRoleFilter(tab.id);
                  setPage(1); // Reset to first page on filter change
                }}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs
          value={lifecycleFilter}
          onValueChange={(value) => {
            setLifecycleFilter(value as LifecycleFilter);
            setPage(1);
          }}
          className="mb-5"
        >
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-md bg-transparent p-0 pb-1">
            {lifecycleSegments.map((segment) => (
              <TabsTrigger
                key={segment.id}
                value={segment.id}
                className="data-[state=active]:border-border data-[state=active]:bg-background min-h-9 shrink-0 gap-2 rounded-md border border-transparent px-3 data-[state=active]:shadow-sm"
              >
                {segment.label}
                {segment.id === "all" ? (
                  lifecycleCounts && (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {Object.values(lifecycleCounts).reduce(
                        (total, count) => total + count,
                        0
                      )}
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {lifecycleCounts?.[segment.id] ?? "—"}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={lifecycleFilter} className="outline-none">
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lifecycle and activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data && isLoading ? (
                    // Loading Skeletons for Rows
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-10 w-56" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-8 w-16" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <p className="text-muted-foreground">
                          Failed to load users
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => refetch()}
                        >
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        {searchInput
                          ? "No matching users found"
                          : "No users found in this category"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: AdminUser) => (
                      <TableRow key={user.id || user.userId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.fullName}
                            {user.phoneNumber && (
                              <a
                                href={`https://wa.me/${formatForWhatsApp(user.phoneNumber)}?text=${encodeURIComponent(`Hello ${user.fullName}, this is Nexus Data admin. `)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full p-1 text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
                                title={`Message ${user.phoneNumber} on WhatsApp`}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isSuspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="min-w-64 text-xs">
                          {user.lifecycleSegment ? (
                            <div className="space-y-1">
                              <Badge variant="outline">
                                {lifecycleLabels[user.lifecycleSegment]}
                              </Badge>
                              <p className="text-muted-foreground">
                                {user.lifecycleSegment === "never_activated"
                                  ? "No meaningful activity yet"
                                  : `Last activity: ${formatLifecycleDate(user.lastMeaningfulActivityAt, lifecycleTimezone)} · ${user.daysInactive ?? 0} days inactive`}
                              </p>
                              {user.activatedAt && (
                                <p className="text-muted-foreground">
                                  First activity:{" "}
                                  {formatLifecycleDate(
                                    user.activatedAt,
                                    lifecycleTimezone
                                  )}
                                </p>
                              )}
                              {user.lastReactivatedAt && (
                                <p className="text-muted-foreground">
                                  Last reactivated:{" "}
                                  {formatLifecycleDate(
                                    user.lastReactivatedAt,
                                    lifecycleTimezone
                                  )}
                                </p>
                              )}
                              {!!user.lifecycleHistory?.length && (
                                <p className="text-muted-foreground">
                                  History:{" "}
                                  {user.lifecycleHistory
                                    .slice(0, 3)
                                    .map(
                                      (transition) =>
                                        `${transition.fromSegment ? lifecycleLabels[transition.fromSegment] : "Initial"} → ${lifecycleLabels[transition.toSegment]} (${formatLifecycleDate(transition.transitionedAt, lifecycleTimezone)})`
                                    )
                                    .join("; ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/admin/dashboard/users/${user.id || user.userId}`}
                            >
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {isSearchActive && isFetching && (
              <p className="text-muted-foreground mt-3 text-xs">Searching...</p>
            )}

            {/* Pagination */}
            {!!data && !isError && pagination && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} users)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
