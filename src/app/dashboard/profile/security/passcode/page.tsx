"use client";

import { SetPasscodeForm } from "@/components/features/security/set-passcode-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PasscodePage() {
  const router = useRouter();

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col pb-28">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 flex items-center gap-4 border-b p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">App Passcode</h1>
      </div>

      <div className="p-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Manage Passcode</CardTitle>
            <CardDescription>
              Your app passcode is used to unlock your account after inactivity
              and during session verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasscodeForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
