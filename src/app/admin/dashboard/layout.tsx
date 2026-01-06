"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth, useLogout } from "@/hooks/useAuth";
import {
  BarChart3Icon,
  BellIcon,
  BriefcaseIcon,
  CreditCardIcon,
  FileTextIcon,
  FingerprintIcon,
  GiftIcon,
  HomeIcon,
  LandmarkIcon,
  LogOutIcon,
  PackageIcon,
  PercentIcon,
  RadioIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: BarChart3Icon,
  },
  {
    title: "Audit Log",
    href: "/admin/dashboard/audit-log",
    icon: FileTextIcon,
  },
  {
    title: "Users",
    href: "/admin/dashboard/users",
    icon: UsersIcon,
  },
  {
    title: "Transactions",
    href: "/admin/dashboard/transactions",
    icon: CreditCardIcon,
  },
  {
    title: "Topups",
    href: "/admin/dashboard/topups",
    icon: WalletIcon,
  },
  {
    title: "Jobs",
    href: "/admin/dashboard/jobs",
    icon: BriefcaseIcon,
  },
  {
    title: "Settlements",
    href: "/admin/dashboard/settlements",
    icon: LandmarkIcon,
  },
  {
    title: "Operators",
    href: "/admin/dashboard/operators",
    icon: RadioIcon,
  },
  {
    title: "Suppliers",
    href: "/admin/dashboard/suppliers",
    icon: ServerIcon,
  },
  {
    title: "Providers",
    href: "/admin/dashboard/providers",
    icon: CreditCardIcon,
  },
  {
    title: "Markups",
    href: "/admin/dashboard/supplier-markups",
    icon: PercentIcon,
  },
  {
    title: "Products",
    href: "/admin/dashboard/products",
    icon: PackageIcon,
  },
  {
    title: "Offers",
    href: "/admin/dashboard/offers",
    icon: GiftIcon,
  },
  {
    title: "Notifications",
    href: "/admin/dashboard/notifications",
    icon: BellIcon,
  },
  {
    title: "Biometric",
    href: "/admin/dashboard/biometric",
    icon: FingerprintIcon,
  },
  {
    title: "Roles",
    href: "/admin/dashboard/roles",
    icon: ShieldIcon,
  },
  {
    title: "Settings",
    href: "/admin/dashboard/settings",
    icon: SettingsIcon,
  },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-2">
            <ShieldCheckIcon className="text-primary h-6 w-6" />
            <span className="font-semibold">Nexus Admin</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <div className="flex flex-col gap-2 p-2">
            <div className="text-sm">
              <p className="truncate font-medium">{user?.fullName}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="bg-background flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
