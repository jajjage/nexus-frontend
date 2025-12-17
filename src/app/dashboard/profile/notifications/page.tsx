"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "@/hooks/useNotificationPreferences";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const NOTIFICATION_CATEGORIES = [
  {
    id: "all",
    label: "All Notifications",
    description: "Receive all notification types",
  },
  {
    id: "news",
    label: "News",
    description: "Stay updated with latest news",
  },
  {
    id: "updates",
    label: "Updates",
    description: "Product updates and improvements",
  },
  {
    id: "alerts",
    label: "Alerts",
    description: "Important alerts and warnings",
  },
  {
    id: "offer",
    label: "Offer",
    description: "Special offers and promotions",
  },
];

export default function NotificationsPage() {
  const { data: preferencesResponse, isLoading } = useNotificationPreferences();
  const { mutate: updatePreference, isPending: isUpdating } =
    useUpdateNotificationPreference();

  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  // Initialize preferences from API response
  useEffect(() => {
    if (preferencesResponse?.data) {
      const prefMap = preferencesResponse.data.reduce(
        (acc, pref) => {
          acc[pref.category] = pref.subscribed;
          return acc;
        },
        {} as Record<string, boolean>
      );
      setPreferences(prefMap);
    }
  }, [preferencesResponse]);

  const handleToggle = (category: string) => {
    const newValue = !preferences[category];
    setPreferences((prev) => ({
      ...prev,
      [category]: newValue,
    }));

    // Send update to backend
    updatePreference({
      category,
      subscribed: newValue,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col pb-20">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center gap-4 p-6">
          <header className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              {/* Back: if opened from Notifications page, return there; else go to profile */}
              <Link
                href={
                  typeof window !== "undefined" &&
                  new URLSearchParams(window.location.search).get("from") ===
                    "notifications"
                    ? "/dashboard/notifications"
                    : "/dashboard/profile"
                }
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            {/* <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
                {backLabel}
              </h1> */}
          </header>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              Choose what notifications you'd like to receive
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="flex flex-col gap-4 p-4">
        {NOTIFICATION_CATEGORIES.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{category.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {category.description}
                  </CardDescription>
                </div>
                <Switch
                  checked={preferences[category.id] ?? false}
                  onCheckedChange={() => handleToggle(category.id)}
                  disabled={isUpdating}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <div className="flex flex-col gap-3 p-4">
        <Separator />
        <p className="text-muted-foreground text-center text-xs">
          Changes are saved automatically
        </p>
      </div>
    </div>
  );
}
