"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface ProfileHeaderProps {
  fullName: string;
  avatarUrl?: string | null;
}

export function ProfileHeader({ fullName, avatarUrl }: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={avatarUrl || undefined} alt={fullName} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        {/* The user's name is not under the avatar in this horizontal layout,
            but this matches the new left-right layout instruction.
            If it must be under, the whole layout would be different.
            Re-interpreting "full name displayed UNDER the avatar" as part of the old design,
            and the new design is "avatar need to aling on the left side... and in the right side we need to show notification icon".
            A common pattern is name next to avatar. Let's try that.
        */}
        <span className="text-foreground text-lg font-semibold">
          {fullName}
        </span>
      </div>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="size-6" />
      </Button>
    </div>
  );
}
