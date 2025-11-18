"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { HomeIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading, isAdmin, hasPermission } = useAuth();
  const logoutMutation = useLogout();
  console.log("User in layout:", user);
  console.log("Has Permission user:", hasPermission("topup.create"));

  const userInitials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-lg font-semibold">User Dashboard</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                <Link href="/dashboard">
                  <HomeIcon className="size-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/transactions"}
              >
                <Link href="/dashboard/transactions">
                  <UserIcon className="size-4" />
                  <span>Transactions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/settings"}
              >
                <Link href="/dashboard/settings">
                  <SettingsIcon className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarImage
                  src={user?.profilePictureUrl || ""}
                  alt={user?.fullName || ""}
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">{user?.fullName}</span>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="bg-background flex h-16 items-center gap-4 border-b px-4 md:px-6">
          <SidebarTrigger />
          <div className="flex w-full items-center justify-between md:justify-end">
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar>
                        <AvatarImage
                          src={user?.profilePictureUrl || ""}
                          alt={user?.fullName || ""}
                        />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm leading-none font-medium">
                          {user?.fullName}
                        </p>
                        <p className="text-muted-foreground text-xs leading-none">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        <UserIcon className="mr-2 size-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        <SettingsIcon className="mr-2 size-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      <LogOutIcon className="mr-2 size-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}

          {/* Example of conditional rendering based on role */}
          {isAdmin && (
            <div className="mt-6 rounded-lg border border-red-500 bg-red-50 p-4">
              <h3 className="font-bold text-red-800">Admin-Only Section</h3>
              <p className="text-sm text-red-700">
                This is visible only to admins.
              </p>
            </div>
          )}

          {/* Example of conditional rendering based on permission */}
          {hasPermission("transaction:write") && (
            <div className="mt-6 rounded-lg border border-blue-500 bg-blue-50 p-4">
              <h3 className="font-bold text-blue-800">
                Permission-Based Section
              </h3>
              <p className="text-sm text-blue-700">
                This is visible only to users with the 'transaction:write'
                permission.
              </p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
