"use client";

import { BiometricVerificationModal } from "@/components/auth/BiometricVerificationModal";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useBillers,
  useBillVariations,
  usePayBill,
  useValidateBillCustomer,
} from "@/hooks/useBillPayments";
import {
  BillCategoryType,
  Biller,
  BillPayment,
  BillVariation,
  BillValidationResult,
} from "@/types/bill-payment.types";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Tv,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface BillPaymentFlowProps {
  category: BillCategoryType;
}

const parseAmount = (value: string) => {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const serviceCopy = {
  electricity: {
    title: "Electricity Bill",
    description: "Pay prepaid or postpaid electricity bills in a few steps.",
    identifierLabel: "Meter or Account Number",
    identifierPlaceholder: "Enter meter/account number",
    amountLabel: "Amount",
    icon: Zap,
    emptyText: "No electricity billers are available yet.",
  },
  cable: {
    title: "Cable TV Subscription",
    description: "Renew or change DSTV, GOtv, and Startimes subscriptions.",
    identifierLabel: "Smartcard or IUC Number",
    identifierPlaceholder: "Enter smartcard/IUC number",
    amountLabel: "Amount",
    icon: Tv,
    emptyText: "No cable TV providers are available yet.",
  },
  education: {
    title: "Exam Pins",
    description: "Buy WAEC and JAMB registration or result checker pins.",
    identifierLabel: "Profile ID",
    identifierPlaceholder: "Enter JAMB profile ID",
    amountLabel: "Amount",
    icon: GraduationCap,
    emptyText: "No exam pin providers are available yet.",
  },
} as const;

export function BillPaymentFlow({ category }: BillPaymentFlowProps) {
  const copy = serviceCopy[category];
  const ServiceIcon = copy.icon;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: billers = [], isLoading: isLoadingBillers } =
    useBillers(category);
  const validateMutation = useValidateBillCustomer();
  const payMutation = usePayBill();

  const [selectedBillerCode, setSelectedBillerCode] = useState("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [subscriptionType, setSubscriptionType] = useState<"change" | "renew">(
    "change"
  );
  const [selectedVariationCode, setSelectedVariationCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [validation, setValidation] = useState<BillValidationResult | null>(
    null
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastPayment, setLastPayment] = useState<BillPayment | null>(null);
  const [failureMessage, setFailureMessage] = useState("");

  const selectedBiller = useMemo(
    () => billers.find((biller) => biller.code === selectedBillerCode),
    [billers, selectedBillerCode]
  );

  const { data: variations = [], isLoading: isLoadingVariations } =
    useBillVariations(
      ((category === "cable" && subscriptionType === "change") ||
        category === "education") &&
        selectedBiller?.supportsVariations
        ? selectedBiller.code
        : undefined
    );

  const selectedVariation = useMemo(
    () =>
      variations.find((variation) => variation.code === selectedVariationCode),
    [variations, selectedVariationCode]
  );

  useEffect(() => {
    if (!selectedBillerCode && billers.length > 0) {
      setSelectedBillerCode(billers[0].code);
    }
  }, [billers, selectedBillerCode]);

  useEffect(() => {
    setValidation(null);
    setFailureMessage("");
  }, [
    selectedBillerCode,
    customerIdentifier,
    meterType,
    selectedVariationCode,
    subscriptionType,
    quantity,
  ]);

  useEffect(() => {
    const selectedAmount =
      selectedVariation?.amount !== null &&
      selectedVariation?.amount !== undefined
        ? Number(selectedVariation.amount)
        : null;

    if (
      selectedAmount !== null &&
      Number.isFinite(selectedAmount) &&
      (category === "education" ||
        (category === "cable" && subscriptionType === "change"))
    ) {
      const multiplier =
        category === "education" ? Math.max(Number(quantity) || 1, 1) : 1;
      setAmount(String(selectedAmount * multiplier));
    }
  }, [category, quantity, selectedVariation, subscriptionType]);

  const parsedAmount = parseAmount(amount);
  const parsedQuantity = Math.max(Number.parseInt(quantity, 10) || 1, 1);
  const isJamb = category === "education" && selectedBiller?.code === "jamb";
  const requiresValidation = category !== "education" || isJamb;
  const canValidate =
    Boolean(selectedBillerCode) &&
    (!requiresValidation || customerIdentifier.trim().length >= 4) &&
    !validateMutation.isPending;
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const canCheckout =
    (!requiresValidation || Boolean(validation?.isValid)) &&
    isAmountValid &&
    phone.trim().length >= 11 &&
    (category !== "cable" ||
      subscriptionType === "renew" ||
      selectedVariation) &&
    (category !== "education" || selectedVariation);

  const handleValidate = () => {
    if (!canValidate) {
      toast.error("Enter the customer details first.");
      return;
    }

    validateMutation.mutate(
      {
        billerCode: selectedBillerCode,
        customerIdentifier: customerIdentifier.trim(),
        meterType: category === "electricity" ? meterType : undefined,
        variationCode:
          category === "education" ? selectedVariationCode : undefined,
      },
      {
        onSuccess: (response) => {
          const result = response.data;
          if (!result?.isValid) {
            toast.error("Customer could not be validated.");
            return;
          }

          setValidation(result);
          if (
            category === "cable" &&
            subscriptionType === "renew" &&
            result.renewalAmount
          ) {
            setAmount(String(result.renewalAmount));
          }
          toast.success("Customer validated");
        },
      }
    );
  };

  const handleOpenCheckout = () => {
    if (!canCheckout) {
      toast.error("Validate customer details and complete the form first.");
      return;
    }

    setLastPayment(null);
    setFailureMessage("");
    setIsCheckoutOpen(true);
  };

  const startPaymentVerification = () => {
    setIsCheckoutOpen(false);
    setShowBiometricModal(true);
  };

  const submitPayment = (auth: {
    verificationToken?: string;
    pin?: string;
  }) => {
    if (!selectedBiller || !isAmountValid) return;

    payMutation.mutate(
      {
        billerCode: selectedBiller.code,
        customerIdentifier:
          category === "education" && !isJamb
            ? phone.trim()
            : customerIdentifier.trim(),
        meterType: category === "electricity" ? meterType : undefined,
        variationCode:
          category === "education" ||
          (category === "cable" && subscriptionType === "change")
            ? selectedVariationCode
            : undefined,
        subscriptionType: category === "cable" ? subscriptionType : undefined,
        amount: parsedAmount,
        quantity: category === "education" ? parsedQuantity : undefined,
        phone: phone.trim(),
        idempotencyKey: `${category}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`,
        ...auth,
      },
      {
        onSuccess: (response) => {
          setLastPayment(response.data || null);
          setShowBiometricModal(false);
          setShowPinModal(false);
          setIsCheckoutOpen(true);
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Payment failed.";

          if (
            auth.pin &&
            (message.toLowerCase().includes("pin") ||
              message.toLowerCase().includes("invalid"))
          ) {
            setErrorMessage(message);
            return;
          }

          setShowBiometricModal(false);
          setShowPinModal(false);
          setFailureMessage(message);
          setIsCheckoutOpen(true);
        },
      }
    );
  };

  const renderBillerSelector = () => {
    if (isLoadingBillers) {
      return <Skeleton className="h-11 w-full" />;
    }

    if (billers.length === 0) {
      return (
        <Alert>
          <ReceiptText className="h-4 w-4" />
          <AlertTitle>Service unavailable</AlertTitle>
          <AlertDescription>{copy.emptyText}</AlertDescription>
        </Alert>
      );
    }

    return (
      <Select value={selectedBillerCode} onValueChange={setSelectedBillerCode}>
        <SelectTrigger id="biller">
          <SelectValue placeholder="Select provider" />
        </SelectTrigger>
        <SelectContent>
          {billers.map((biller: Biller) => (
            <SelectItem key={biller.id} value={biller.code}>
              {biller.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServiceIcon className="text-primary h-5 w-5" />
            {copy.title}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{copy.description}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="biller">
              {category === "electricity"
                ? "Disco"
                : category === "education"
                  ? "Exam Service"
                  : "Provider"}
            </Label>
            {renderBillerSelector()}
          </div>

          {category === "education" ? null : category === "electricity" ? (
            <div className="space-y-2">
              <Label htmlFor="meterType">Meter Type</Label>
              <Select
                value={meterType}
                onValueChange={(value) =>
                  setMeterType(value as "prepaid" | "postpaid")
                }
              >
                <SelectTrigger id="meterType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="postpaid">Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="subscriptionType">Subscription Type</Label>
              <Select
                value={subscriptionType}
                onValueChange={(value) =>
                  setSubscriptionType(value as "change" | "renew")
                }
              >
                <SelectTrigger id="subscriptionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change">Change bouquet</SelectItem>
                  <SelectItem value="renew">Renew current plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(category !== "education" || isJamb) && (
            <div className="space-y-2">
              <Label htmlFor="customerIdentifier">
                {category === "education"
                  ? "JAMB Profile ID"
                  : copy.identifierLabel}
              </Label>
              <Input
                id="customerIdentifier"
                value={customerIdentifier}
                onChange={(event) => setCustomerIdentifier(event.target.value)}
                placeholder={
                  category === "education"
                    ? "Enter JAMB profile ID"
                    : copy.identifierPlaceholder
                }
                inputMode="numeric"
              />
            </div>
          )}

          {((category === "cable" && subscriptionType === "change") ||
            category === "education") &&
            selectedBiller?.supportsVariations && (
              <div className="space-y-2">
                <Label htmlFor="variation">
                  {category === "education" ? "Exam Type" : "Bouquet"}
                </Label>
                {isLoadingVariations ? (
                  <Skeleton className="h-11 w-full" />
                ) : (
                  <Select
                    value={selectedVariationCode}
                    onValueChange={setSelectedVariationCode}
                  >
                    <SelectTrigger id="variation">
                      <SelectValue placeholder="Select bouquet" />
                    </SelectTrigger>
                    <SelectContent>
                      {variations.map((variation: BillVariation) => (
                        <SelectItem key={variation.id} value={variation.code}>
                          {variation.name}
                          {variation.amount
                            ? ` - ${formatCurrency(variation.amount)}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

          {category === "education" && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="1"
                inputMode="numeric"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">{copy.amountLabel}</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                inputMode="decimal"
                disabled={
                  category === "cable" &&
                  subscriptionType === "change" &&
                  Boolean(selectedVariation?.amount)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08012345678"
                inputMode="tel"
              />
            </div>
          </div>

          {validation?.isValid && requiresValidation && (
            <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
              <BadgeCheck className="h-4 w-4" />
              <AlertTitle>Customer validated</AlertTitle>
              <AlertDescription>
                {validation.customerName || "The customer details are valid."}
              </AlertDescription>
            </Alert>
          )}

          <div
            className={`grid gap-3 ${requiresValidation ? "sm:grid-cols-2" : ""}`}
          >
            {requiresValidation && (
              <Button
                type="button"
                variant="outline"
                onClick={handleValidate}
                disabled={!canValidate}
              >
                {validateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                {category === "education"
                  ? "Validate Profile"
                  : "Validate Customer"}
              </Button>
            )}
            <Button type="button" onClick={handleOpenCheckout}>
              <CreditCard className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lastPayment
                ? "Payment Submitted"
                : failureMessage
                  ? "Payment Failed"
                  : "Confirm Payment"}
            </DialogTitle>
          </DialogHeader>

          {lastPayment ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-600" />
                <div>
                  <p className="text-lg font-semibold">
                    {lastPayment.status === "pending"
                      ? "Processing payment"
                      : "Payment successful"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedBiller?.name} for {customerIdentifier}
                  </p>
                </div>
              </div>
              {lastPayment.tokenPayload?.token && (
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs uppercase">
                    PIN / Token
                  </p>
                  <p className="font-mono text-lg font-semibold">
                    {lastPayment.tokenPayload.token}
                  </p>
                  {lastPayment.tokenPayload.units && (
                    <p className="text-muted-foreground text-sm">
                      Units: {lastPayment.tokenPayload.units}
                    </p>
                  )}
                </div>
              )}
              {Array.isArray(lastPayment.tokenPayload?.cards) && (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs uppercase">
                    Cards
                  </p>
                  {lastPayment.tokenPayload.cards.map(
                    (card: any, index: number) => (
                      <div key={index} className="font-mono text-sm">
                        Serial: {card.Serial || card.serial} / PIN:{" "}
                        {card.Pin || card.pin}
                      </div>
                    )
                  )}
                </div>
              )}
              {Array.isArray(lastPayment.tokenPayload?.tokens) && (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs uppercase">
                    Tokens
                  </p>
                  {lastPayment.tokenPayload.tokens.map(
                    (token: string, index: number) => (
                      <div key={index} className="font-mono text-sm">
                        {token}
                      </div>
                    )
                  )}
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Done
              </Button>
            </div>
          ) : failureMessage ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Unable to complete payment</AlertTitle>
                <AlertDescription>{failureMessage}</AlertDescription>
              </Alert>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setFailureMessage("")}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Provider
                  </span>
                  <span className="font-medium">{selectedBiller?.name}</span>
                </div>
                {(requiresValidation || customerIdentifier) && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {category === "education" ? "Profile" : "Customer"}
                    </span>
                    <span className="text-right font-medium">
                      {validation?.customerName || customerIdentifier}
                    </span>
                  </div>
                )}
                {selectedVariation && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {category === "education" ? "Exam Type" : "Bouquet"}
                    </span>
                    <span className="text-right font-medium">
                      {selectedVariation.name}
                    </span>
                  </div>
                )}
                {category === "education" && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Quantity
                    </span>
                    <span className="text-right font-medium">
                      {parsedQuantity}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(parsedAmount)}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                Wallet balance: {formatCurrency(Number(user?.balance || 0))}
              </Badge>
              <Button
                className="w-full"
                disabled={payMutation.isPending}
                onClick={startPaymentVerification}
              >
                {payMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Pay {formatCurrency(parsedAmount)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BiometricVerificationModal
        open={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={(verificationToken) => submitPayment({ verificationToken })}
        onBiometricUnavailable={() => {
          setShowBiometricModal(false);
          setShowPinModal(true);
        }}
        onNoPinSetup={() => {
          setShowBiometricModal(false);
          setShowPinSetupModal(true);
        }}
        transactionAmount={String(parsedAmount)}
        productCode={selectedBiller?.name}
        phoneNumber={phone}
        isVerifying={payMutation.isPending}
      />

      <PinVerificationModal
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={(pin) => submitPayment({ pin })}
        useCashback={false}
        reason="transaction"
        transactionAmount={String(parsedAmount)}
        productCode={selectedBiller?.name}
        phoneNumber={phone}
        isVerifying={payMutation.isPending}
        errorMessage={errorMessage}
      />

      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => setShowPinSetupModal(false)}
        onSuccess={() => {
          setShowPinSetupModal(false);
          setShowPinModal(true);
        }}
      />
    </div>
  );
}
