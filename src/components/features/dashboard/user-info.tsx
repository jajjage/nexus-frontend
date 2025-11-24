"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { ChevronDown } from "lucide-react";

interface UserInfoProps {
  fullName: string;
  phone: string;
}

export function UserInfo({ fullName, phone }: UserInfoProps) {
  return (
    <div className="bg-card flex w-full items-center gap-3 rounded-lg p-3 shadow-sm">
      <Avatar className="size-10">
        <AvatarImage src="/images/favicon.svg" alt="App Logo" />
        <AvatarFallback className="bg-primary/10">
          {/* Fallback can be an icon or just empty if logo always present */}
          LO
        </AvatarFallback>
      </Avatar>
      <div className="grow">
        <h2 className="text-foreground text-sm font-bold uppercase">
          {fullName}
        </h2>
        <div className="flex items-center gap-1">
          <p className="text-muted-foreground text-xs">{phone}</p>
          <button>
            <ChevronDown className="text-muted-foreground size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
