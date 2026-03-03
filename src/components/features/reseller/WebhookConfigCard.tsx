"use client";

import { OneTimeSecretDialog } from "@/components/features/reseller/OneTimeSecretDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useRotateWebhookSecret,
  useUpdateWebhookConfig,
  useWebhookConfig,
} from "@/hooks/useReseller";
import { Link2, Loader2, RotateCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function WebhookConfigCard() {
  const { data, isLoading, isError, refetch } = useWebhookConfig();
  const updateMutation = useUpdateWebhookConfig();
  const rotateMutation = useRotateWebhookSecret();

  const [callbackUrl, setCallbackUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [hasEditedCallbackUrl, setHasEditedCallbackUrl] = useState(false);
  const [hasEditedIsActive, setHasEditedIsActive] = useState(false);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [latestSecret, setLatestSecret] = useState<string | null>(null);

  const config = data?.data;
  const effectiveCallbackUrl = hasEditedCallbackUrl
    ? callbackUrl
    : (config?.callbackUrl ?? "");
  const effectiveIsActive = hasEditedIsActive
    ? isActive
    : Boolean(config?.isActive);

  const hasChanges = useMemo(() => {
    if (!config) return effectiveCallbackUrl.length > 0 || effectiveIsActive;
    return (
      (config.callbackUrl ?? "") !== effectiveCallbackUrl ||
      config.isActive !== effectiveIsActive
    );
  }, [config, effectiveCallbackUrl, effectiveIsActive]);

  const isValidCallbackUrl = (url: string) => {
    if (!url.trim()) return false;

    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (!isValidCallbackUrl(effectiveCallbackUrl)) {
      toast.error(
        "Enter a valid callback URL starting with http:// or https://"
      );
      return;
    }

    updateMutation.mutate(
      {
        callbackUrl: effectiveCallbackUrl.trim(),
        isActive: effectiveIsActive,
      },
      {
        onSuccess: (response) => {
          const responseData = response.data as any;
          const secret =
            responseData?.callbackSecret ||
            responseData?.secret ||
            responseData?.webhookSecret;

          if (secret) {
            setLatestSecret(secret);
            setSecretDialogOpen(true);
          }
          setHasEditedCallbackUrl(false);
          setHasEditedIsActive(false);
        },
      }
    );
  };

  const handleRotateSecret = () => {
    rotateMutation.mutate(undefined, {
      onSuccess: (response) => {
        if (!response.data?.secret) {
          toast.warning("Secret rotated, but no secret was returned");
          return;
        }

        setLatestSecret(response.data.secret);
        setSecretDialogOpen(true);
      },
    });
  };

  if (!data && isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load webhook config</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure callback URL, activation state, and rotate callback
            secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="callbackUrl">Callback URL</Label>
            <Input
              id="callbackUrl"
              placeholder="https://example.com/webhooks/nexus"
              value={effectiveCallbackUrl}
              onChange={(event) => {
                setHasEditedCallbackUrl(true);
                setCallbackUrl(event.target.value);
              }}
            />
            <p className="text-muted-foreground text-xs">
              Must start with <code>http://</code> or <code>https://</code>.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Activate Callbacks</p>
              <p className="text-muted-foreground text-xs">
                When disabled, callback delivery is paused.
              </p>
            </div>
            <Switch
              checked={effectiveIsActive}
              onCheckedChange={(nextValue) => {
                setHasEditedIsActive(true);
                setIsActive(nextValue);
              }}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="sm:w-auto"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleRotateSecret}
              disabled={rotateMutation.isPending}
            >
              {rotateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rotating...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 size-4" />
                  Rotate Secret
                </>
              )}
            </Button>
          </div>

          <Alert>
            <AlertTitle>Test callback receiver</AlertTitle>
            <AlertDescription>
              Confirm your endpoint can receive POST callbacks, return 2xx
              quickly, and verify payload signatures using your callback secret.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <OneTimeSecretDialog
        open={secretDialogOpen}
        onOpenChange={setSecretDialogOpen}
        title="Webhook Secret"
        description="Store this callback secret securely."
        secret={latestSecret}
        filePrefix="nexus-webhook-secret"
      />
    </>
  );
}
