"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useResetUserPasscode,
  useResetUserPin,
} from "@/hooks/admin/useAdminUsers";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

function CredentialCard({
  title,
  description,
  length,
  value,
  onChange,
  onReset,
  isPending,
  buttonLabel,
}: {
  title: string;
  description: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  isPending: boolean;
  buttonLabel: string;
}) {
  const inputId = title.toLowerCase().replaceAll(" ", "-");
  return (
    <div className="bg-card hover:border-primary/40 rounded-xl border p-4 shadow-sm transition-colors">
      <div className="mb-4 flex items-start gap-3">
        <div className="bg-primary/10 text-primary rounded-lg p-2">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={inputId}>New {title}</Label>
        <Input
          id={inputId}
          inputMode="numeric"
          type="password"
          autoComplete="new-password"
          maxLength={length}
          placeholder={`${length} digits`}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          className="font-mono tracking-[0.35em]"
        />
        <p className="text-muted-foreground text-[11px]">
          Use exactly {length} numbers.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        disabled={value.length !== length || isPending}
        onClick={onReset}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        {isPending ? "Updating…" : buttonLabel}
      </Button>
    </div>
  );
}

export function ResetSecurityCodes({ userId }: { userId: string }) {
  const [pin, setPin] = useState("");
  const [passcode, setPasscode] = useState("");
  const pinMutation = useResetUserPin();
  const passcodeMutation = useResetUserPasscode();
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="text-primary h-4 w-4" />
          Security credentials
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Update the credentials this user uses for transactions and app access.
          Values are never shown after saving.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0 md:grid-cols-2">
        <CredentialCard
          title="Transaction PIN"
          description="Required to authorize wallet and purchase transactions."
          length={4}
          value={pin}
          onChange={setPin}
          isPending={pinMutation.isPending}
          onReset={() => pinMutation.mutate({ userId, newPin: pin })}
          buttonLabel="Update transaction PIN"
        />
        <CredentialCard
          title="App passcode"
          description="Used to unlock the user’s app after inactivity or a soft lock."
          length={6}
          value={passcode}
          onChange={setPasscode}
          isPending={passcodeMutation.isPending}
          onReset={() =>
            passcodeMutation.mutate({ userId, newPasscode: passcode })
          }
          buttonLabel="Update app passcode"
        />
      </CardContent>
    </Card>
  );
}
