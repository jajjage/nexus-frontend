"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OneTimeSecretDialog } from "@/components/features/reseller/OneTimeSecretDialog";
import { useAdexCredentials, useCreateAdexCredential, useResetAdexCredential, useRevokeAdexCredential } from "@/hooks/useReseller";
import type { AdexClientCredential } from "@/types/reseller.types";
import { KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

export function AdexCredentialList() {
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<{ username: string; password: string } | null>(null);
  const { data, isLoading } = useAdexCredentials();
  const create = useCreateAdexCredential();
  const reset = useResetAdexCredential();
  const revoke = useRevokeAdexCredential();
  const credentials = data?.data?.credentials ?? [];

  const createCredential = () => {
    if (!name.trim()) return;
    create.mutate(name.trim(), {
      onSuccess: (response) => {
        if (response.data) setSecret({ username: response.data.username, password: response.data.password });
        setName("");
      },
    });
  };

  const resetCredential = (credential: AdexClientCredential) => {
    reset.mutate(credential.id, {
      onSuccess: (response) => {
        if (response.data) setSecret({ username: response.data.username, password: response.data.password });
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> ADEX client credentials</CardTitle>
          <CardDescription>Use these with the ADEX-compatible V1 API. The password is shown only when created or reset.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input aria-label="ADEX credential name" placeholder="e.g. ADEX Production Website" value={name} onChange={(event) => setName(event.target.value)} />
            <Button onClick={createCredential} disabled={!name.trim() || create.isPending}><Plus className="mr-2 size-4" />Create</Button>
          </div>
          {isLoading ? <p className="text-muted-foreground text-sm">Loading credentials…</p> : credentials.length === 0 ? <p className="text-muted-foreground text-sm">No ADEX credentials yet.</p> : (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <div key={credential.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{credential.name}</div>
                    <code className="text-muted-foreground text-xs">{credential.username}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={credential.is_active ? "outline" : "secondary"}>{credential.is_active ? "Active" : "Revoked"}</Badge>
                    {credential.is_active ? <>
                      <Button variant="outline" size="sm" onClick={() => resetCredential(credential)} disabled={reset.isPending}><RefreshCw className="mr-2 size-4" />Reset</Button>
                      <Button variant="ghost" size="icon" onClick={() => revoke.mutate(credential.id)} disabled={revoke.isPending} aria-label={`Revoke ${credential.name}`}><Trash2 className="text-destructive size-4" /></Button>
                    </> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <OneTimeSecretDialog open={Boolean(secret)} onOpenChange={(open) => !open && setSecret(null)} title="ADEX password" description={secret ? `Username: ${secret.username}. Save this password before closing.` : "Save this password before closing."} secret={secret?.password ?? null} filePrefix="adex-credential" />
    </>
  );
}
