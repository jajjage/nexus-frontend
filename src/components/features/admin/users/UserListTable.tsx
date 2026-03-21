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
import { AdminUser } from "@/types/admin/user.types";
import { ChevronLeft, ChevronRight, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  const isSearchActive = !!debouncedSearch.trim();

  const limit = 10;

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", page.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter !== "all") params.set("role", roleFilter);

    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;

    // Only update if URL actually changed to avoid infinite loops
    const currentQueryString = searchParams.toString();
    if (queryString !== currentQueryString) {
      router.replace(newUrl, { scroll: false });
    }
  }, [page, debouncedSearch, roleFilter, pathname, router, searchParams]);

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
  });

  const pagination = data?.data?.pagination;

  // Server is source of truth for search/filter/pagination.
  const users = data?.data?.users || [];

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
        <Button asChild size="sm">
          <Link href="/admin/dashboard/users/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
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

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
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
                  <TableCell colSpan={5} className="py-8 text-center">
                    {searchInput
                      ? "No matching users found"
                      : "No users found in this category"}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: AdminUser) => (
                  <TableRow key={user.id || user.userId}>
                    <TableCell className="font-medium">
                      {user.fullName}
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
      </CardContent>
    </Card>
  );
}
