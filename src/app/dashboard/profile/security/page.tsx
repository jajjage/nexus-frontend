"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronRight,
  Fingerprint,
  KeyRound,
  Lock,
} from "lucide-react";
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
    {
      title: "Biometric Authentication",
      description: "Manage fingerprint or face ID",
      icon: Fingerprint,
      href: "/dashboard/profile/security/biometric",
    },
  ];

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col p-4 pb-20">
      {/* Header */}
      <div className="mb-2 flex items-center">
        {/* Page Header */}
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/profile">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Security</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            Security
          </h1>
        </header>
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
