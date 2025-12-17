"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth, useLogout } from "@/hooks/useAuth";
import {
  ChevronRight,
  HelpCircle,
  LogOut,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const router = useRouter();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const menuGroups = [
    {
      title: "Account",
      items: [
        {
          label: "Personal Information",
          icon: User,
          href: "/dashboard/profile/personal-info",
          description: "Name, Email, Phone",
        },
        {
          label: "Wallet Settings",
          icon: Wallet,
          href: "/dashboard/profile/wallet",
          description: "Bank Accounts, Cards",
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          label: "Security",
          icon: Shield,
          href: "/dashboard/profile/security",
          description: "Password, PIN, Biometrics",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Help & Support",
          icon: HelpCircle,
          href: "/dashboard/profile/support",
          description: "FAQ, Contact Us",
        },
      ],
    },
  ];

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col pb-28">
      {/* Header */}
      <div className="bg-background p-6 pb-8">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="border-muted size-24 border-4">
            <AvatarImage src={user.profilePictureUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {user.phoneNumber}
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <Link href="/dashboard/profile/personal-info">Edit Profile</Link>
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-6 p-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-muted-foreground px-1 text-sm font-medium">
              {group.title}
            </h2>
            <Card className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-0">
                {group.items.map((item, index) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors"
                    >
                      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                        <item.icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="text-muted-foreground/50 size-5" />
                    </Link>
                    {index < group.items.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <div className="mt-4">
          <Button
            variant="destructive"
            className="w-full py-6"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 size-5" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Version 1.0.0
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
