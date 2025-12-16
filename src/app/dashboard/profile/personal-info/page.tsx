"use client";

import { EditProfileForm } from "@/components/features/profile/edit-profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PersonalInfoPage() {
  const router = useRouter();

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col p-4 pb-20">
      <div className="mb-2 flex items-center">
        {/* Page Header */}
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/profile">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Personal Info</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            Personal Info
          </h1>
        </header>
      </div>

      <div className="p-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditProfileForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
