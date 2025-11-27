"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, Copy } from "lucide-react";

interface UserInfoProps {
  fullName: string;
  phone: string;
}

export function UserInfo({ fullName, phone }: UserInfoProps) {
  return (
    <div className="bg-card flex w-full items-center gap-3 rounded-full p-2 shadow-sm">
      <Avatar className="size-10">
        <AvatarImage src="/images/favicon.svg" alt="App Logo" />
        <AvatarFallback className="bg-primary/10">LO</AvatarFallback>
      </Avatar>
      <div className="flex grow items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-foreground text-sm font-bold uppercase">
            {fullName}
          </h2>
          <p className="text-muted-foreground text-xs">{phone}</p>
        </div>
        <button>
          <ChevronDown className="text-muted-foreground size-4" />
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigator.clipboard.writeText(phone)}
        aria-label="Copy phone number"
        className="rounded-full"
      >
        <Copy className="text-muted-foreground size-4" />
      </Button>
    </div>
  );
}
