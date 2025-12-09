"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, KeyRound, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();

  const securityItems = [
    {
      title: "Change Password",
      description: "Update your login password",
      icon: Lock,
      href: "/dashboard/profile/security/password",
    },
    {
      title: "Transaction PIN",
      description: "Set or update your transaction PIN",
      icon: KeyRound,
      href: "/dashboard/profile/security/pin",
    },
  ];

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col pb-28">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 flex items-center gap-4 border-b p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">Security</h1>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {securityItems.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                  <item.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground/50 size-5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
