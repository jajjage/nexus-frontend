"use client";

import { PurchaseStatusMonitor } from "@/components/features/reseller/PurchaseStatusMonitor";
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
import { Switch } from "@/components/ui/switch";
import {
  mapResellerApiError,
  useApiPurchaseStatus,
  useCreateApiPurchase,
} from "@/hooks/useReseller";
import type { PurchaseStatus } from "@/types/reseller.types";
import { AxiosError } from "axios";
import { Copy, Loader2, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const POLLING_INTERVAL_MS = 2500;

const createUuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function PurchaseConsole() {
  const [productCode, setProductCode] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [clientReference, setClientReference] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [waitForFinal, setWaitForFinal] = useState(false);
  const [waitTimeoutMs, setWaitTimeoutMs] = useState("10000");

  const [apiKey, setApiKey] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(createUuid);
  const [idempotencyManuallyEdited, setIdempotencyManuallyEdited] =
    useState(false);

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [purchaseByRequestId, setPurchaseByRequestId] = useState<
    Record<string, PurchaseStatus>
  >({});
  const [pollingStartedAt, setPollingStartedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const createPurchaseMutation = useCreateApiPurchase();

  const statusQuery = useApiPurchaseStatus(activeRequestId ?? "", {
    enabled: Boolean(activeRequestId),
    refetchInterval:
      activeRequestId && !purchaseByRequestId[activeRequestId]?.isFinal
        ? POLLING_INTERVAL_MS
        : false,
  });

  const livePurchase = statusQuery.data?.data?.purchase;
  const activePurchase = activeRequestId
    ? livePurchase?.requestId === activeRequestId
      ? livePurchase
      : purchaseByRequestId[activeRequestId]
    : null;
  const shouldPoll = Boolean(
    activeRequestId && (!activePurchase || !activePurchase.isFinal)
  );

  const queryError = statusQuery.isError
    ? mapResellerApiError(statusQuery.error as AxiosError)
    : null;

  const purchases = useMemo(() => {
    const merged = { ...purchaseByRequestId };
    if (livePurchase) {
      merged[livePurchase.requestId] = livePurchase;
    }
    return Object.values(merged).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [livePurchase, purchaseByRequestId]);

  const displayError = queryError?.message ?? lastError;

  const pollingState = {
    isPolling: shouldPoll,
    intervalMs: POLLING_INTERVAL_MS,
    startedAt: pollingStartedAt,
  };

  const validateUrl = (url: string) => {
    if (!url.trim()) return true;

    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    const parsedAmount = Number.parseFloat(amount);
    const parsedTimeout = Number.parseInt(waitTimeoutMs, 10);

    if (!apiKey.trim()) errors.push("X-API-KEY is required");
    if (!idempotencyKey.trim()) errors.push("X-Idempotency-Key is required");
    if (!productCode.trim()) errors.push("Product code is required");
    if (!recipientPhone.trim()) errors.push("Recipient phone is required");
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push("Amount must be greater than zero");
    }
    if (!validateUrl(callbackUrl)) {
      errors.push("Callback URL must start with http:// or https://");
    }
    if (waitForFinal && (Number.isNaN(parsedTimeout) || parsedTimeout <= 0)) {
      errors.push("waitTimeoutMs must be a positive number");
    }

    return errors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors([]);
    setLastError(null);

    createPurchaseMutation.mutate(
      {
        payload: {
          productCode: productCode.trim(),
          amount: Number.parseFloat(amount),
          recipientPhone: recipientPhone.trim(),
          clientReference: clientReference.trim() || undefined,
          callbackUrl: callbackUrl.trim() || undefined,
          waitForFinal,
          waitTimeoutMs: waitForFinal
            ? Number.parseInt(waitTimeoutMs, 10)
            : undefined,
        },
        headers: {
          apiKey: apiKey.trim(),
          idempotencyKey: idempotencyKey.trim(),
        },
      },
      {
        onSuccess: (response) => {
          const result = response.data;
          if (!result?.purchase) {
            toast.error("Purchase response did not include status payload");
            return;
          }

          const purchase = result.purchase;
          setPurchaseByRequestId((prev) => ({
            ...prev,
            [purchase.requestId]: purchase,
          }));
          setActiveRequestId(purchase.requestId);

          if (result.httpStatus === 202 && !purchase.isFinal) {
            setPollingStartedAt(new Date().toISOString());
            toast.success("Request accepted and pending final status");
          } else {
            setPollingStartedAt(null);
            toast.success("Request completed with terminal status");
          }

          if (!idempotencyManuallyEdited) {
            setIdempotencyKey(createUuid());
          }
        },
        onError: (error) => {
          const mapped = mapResellerApiError(error as AxiosError);
          setLastError(mapped.message);
          setFormErrors(mapped.fieldErrors ?? []);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reseller API Purchase Console</CardTitle>
          <CardDescription>
            Submit test purchases and monitor request status transitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="apiKey">X-API-KEY</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="nx_live_..."
                className="font-mono"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="idempotencyKey">X-Idempotency-Key</Label>
              <div className="flex gap-2">
                <Input
                  id="idempotencyKey"
                  value={idempotencyKey}
                  onChange={(event) => {
                    setIdempotencyManuallyEdited(true);
                    setIdempotencyKey(event.target.value);
                  }}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIdempotencyManuallyEdited(false);
                    setIdempotencyKey(createUuid());
                  }}
                >
                  <RefreshCcw className="mr-2 size-4" />
                  Regenerate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(idempotencyKey);
                    toast.success("Idempotency key copied");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                value={productCode}
                onChange={(event) => setProductCode(event.target.value)}
                placeholder="MTN-DATA-1GB"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Recipient Phone</Label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(event) => setRecipientPhone(event.target.value)}
                placeholder="08012345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientReference">
                Client Reference (optional)
              </Label>
              <Input
                id="clientReference"
                value={clientReference}
                onChange={(event) => setClientReference(event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="callbackUrl">
                Callback URL Override (optional)
              </Label>
              <Input
                id="callbackUrl"
                value={callbackUrl}
                onChange={(event) => setCallbackUrl(event.target.value)}
                placeholder="https://example.com/callback"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <div>
                <p className="font-medium">waitForFinal</p>
                <p className="text-muted-foreground text-xs">
                  If enabled, backend can attempt synchronous finalization.
                </p>
              </div>
              <Switch
                checked={waitForFinal}
                onCheckedChange={setWaitForFinal}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waitTimeoutMs">waitTimeoutMs</Label>
              <Input
                id="waitTimeoutMs"
                type="number"
                value={waitTimeoutMs}
                onChange={(event) => setWaitTimeoutMs(event.target.value)}
                disabled={!waitForFinal}
              />
            </div>
          </div>

          {formErrors.length > 0 ? (
            <Alert>
              <AlertTitle>Validation issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5">
                  {formErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {displayError ? (
            <Alert>
              <AlertTitle>Last error</AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            onClick={handleSubmit}
            disabled={createPurchaseMutation.isPending}
          >
            {createPurchaseMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Purchase"
            )}
          </Button>
        </CardContent>
      </Card>

      <PurchaseStatusMonitor
        purchases={purchases}
        activeRequestId={activeRequestId}
        pollingState={pollingState}
        lastError={displayError}
      />
    </div>
  );
}
