"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Lock,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SmartBiometricIcon } from "@/components/ui/smart-biometric-icon";
import { DeleteAccountModal } from "@/components/features/dashboard/DeleteAccountModal";
import { useBiometricType } from "@/hooks/useBiometricType";

export default function SecurityPage() {
  const { label } = useBiometricType();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const authSection = [
    {
      title: "Password",
      description: "Update your login password",
      icon: Lock,
      href: "/dashboard/profile/security/password",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Transaction PIN",
      description: "6-digit code for transactions",
      icon: KeyRound,
      href: "/dashboard/profile/security/pin",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  const appSecuritySection = [
    {
      title: "App Passcode",
      description: "6-digit code for app protection",
      icon: Shield,
      href: "/dashboard/profile/security/passcode",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: label || "Biometric",
      description: `${label || "Fingerprint"} or face authentication`,
      icon: SmartBiometricIcon as any,
      href: "/dashboard/profile/security/biometric",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  const SecurityCard = ({ item }: { item: (typeof authSection)[0] }) => (
    <Link href={item.href} className="group h-full">
      <Card className="bg-card relative h-full overflow-hidden border-0 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${item.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
        />

        <div className="relative flex flex-col gap-3 p-4 sm:p-5">
          {/* Icon Container */}
          <div
            className={`${item.bgColor} flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110`}
          >
            <item.icon className="text-foreground h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-foreground text-sm font-semibold sm:text-base">
              {item.title}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {item.description}
            </p>
          </div>

          {/* Arrow Indicator */}
          <div className="text-primary flex items-center gap-2 text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="hidden sm:inline">Manage</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="from-background to-muted/20 min-h-screen w-full bg-linear-to-b p-4 pb-20 sm:p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
            Security
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage your account security settings
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Account Authentication Section */}
        <section>
          <div className="mb-3 sm:mb-4">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:text-sm">
              Account Authentication
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Secure your login and transactions
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {authSection.map((item) => (
              <SecurityCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        {/* App Security Section */}
        <section>
          <div className="mb-3 sm:mb-4">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:text-sm">
              App Security
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Protect your app from unauthorized access
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {appSecuritySection.map((item) => (
              <SecurityCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="border-border bg-destructive/10 rounded-lg border p-4 sm:p-5">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-destructive text-xs font-semibold tracking-wide uppercase sm:text-sm">
              Danger Zone
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Irreversible actions that affect your account
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex-1">
                <h3 className="text-foreground text-sm font-semibold">
                  Delete Account
                </h3>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </section>

        {/* Security Tips */}
        <section className="border-border bg-muted/50 rounded-lg border p-4 sm:p-5">
          <h3 className="text-foreground mb-3 text-sm font-semibold">
            🛡️ Security Tips
          </h3>
          <ul className="text-muted-foreground space-y-2 text-xs sm:text-sm">
            <li>• Use strong, unique passwords for each account</li>
            <li>• Enable biometric authentication for faster, safer access</li>
            <li>• Change your passwords and PINs regularly</li>
            <li>• Never share your security codes with anyone</li>
          </ul>
        </section>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
