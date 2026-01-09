"use client";

import { OfferRuleBuilder } from "@/components/features/admin/offers/OfferRuleBuilder";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateOffer } from "@/hooks/admin/useAdminOffers";
import { adminOfferService } from "@/services/admin/offer.service";
import { adminRoleService } from "@/services/admin/role.service";
import {
  DiscountType,
  EligibilityLogic,
  OfferApplyTo,
  OfferRule,
  OfferStatus,
} from "@/types/admin/offer.types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface CreateOfferWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, title: "Basic Info" },
  { id: 2, title: "Target & Association" },
  { id: 3, title: "Eligibility Rules" },
  { id: 4, title: "Review" },
];

export function CreateOfferWizard({
  onClose,
  onSuccess,
}: CreateOfferWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OfferStatus>("draft");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [totalUsageLimit, setTotalUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [applyTo, setApplyTo] = useState<OfferApplyTo>("all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [allowAll, setAllowAll] = useState(true);
  const [eligibilityLogic, setEligibilityLogic] =
    useState<EligibilityLogic>("all");
  const [rules, setRules] = useState<OfferRule[]>([]);

  // Queries
  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "list"],
    queryFn: () => adminOfferService.getSuppliers(),
    enabled: applyTo === "supplier_product",
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products", "list"],
    queryFn: () => adminOfferService.getProducts(),
    enabled: applyTo === "operator_product",
  });

  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles", "list"],
    queryFn: () => adminRoleService.getRoles(),
  });

  const createMutation = useCreateOffer();

  const handleSubmit = () => {
    createMutation.mutate(
      {
        title,
        description: description || undefined,
        code: code || undefined,
        status,
        discountType,
        discountValue: parseFloat(discountValue),
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : undefined,
        totalUsageLimit: totalUsageLimit
          ? parseInt(totalUsageLimit)
          : undefined,
        startsAt: startsAt
          ? new Date(startsAt).toISOString()
          : new Date().toISOString(),
        endsAt: endsAt
          ? new Date(endsAt).toISOString()
          : new Date().toISOString(),
        applyTo,
        productIds:
          applyTo === "operator_product" ? selectedProductIds : undefined,
        supplierIds:
          applyTo === "supplier_product" ? selectedSupplierIds : undefined,
        allowedRoles: selectedRoles.length > 0 ? selectedRoles : undefined,
        allowAll,
        eligibilityLogic,
        rules: !allowAll ? rules : undefined,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  const nextStep = () => setCurrentStep((p) => Math.min(STEPS.length, p + 1));
  const prevStep = () => setCurrentStep((p) => Math.max(1, p - 1));

  const isStep1Valid = title && discountValue && discountType;
  const isStep2Valid =
    applyTo === "all" ||
    (applyTo === "operator_product" && selectedProductIds.length > 0) ||
    (applyTo === "supplier_product" && selectedSupplierIds.length > 0);
  const isStep3Valid = allowAll || rules.length > 0;

  return (
    <DialogContent className="max-w-2xl sm:max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>Create Offer</DialogTitle>
        <DialogDescription>Step {currentStep} of 4</DialogDescription>
      </DialogHeader>

      {/* Steps Indicator */}
      <div className="mb-4 flex items-center justify-between px-2">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex flex-col items-center gap-1 text-xs ${
              step.id === currentStep
                ? "text-primary font-bold"
                : step.id < currentStep
                  ? "text-primary/70"
                  : "text-muted-foreground"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                step.id === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.id < currentStep
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-muted-foreground/30 bg-muted"
              }`}
            >
              {step.id < currentStep ? <Check className="h-3 w-3" /> : step.id}
            </div>
            {step.title}
          </div>
        ))}
      </div>

      <ScrollArea className="max-h-[50vh] px-1">
        <div className="space-y-6 py-2">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Weekend Special"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as OfferStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PROMO123 (Optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v as DiscountType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">
                        Fixed Amount (₦)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Per User Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="Unlimited"
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Max times a single user can redeem
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Total Usage Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={totalUsageLimit}
                    onChange={(e) => setTotalUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Max total redemptions allowed
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid To</Label>
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Association */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Apply Offer To</Label>
                <Select
                  value={applyTo}
                  onValueChange={(v) => {
                    setApplyTo(v as OfferApplyTo);
                    setSelectedProductIds([]);
                    setSelectedSupplierIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Products (Site-wide)
                    </SelectItem>
                    <SelectItem value="operator_product">
                      Specific Products
                    </SelectItem>
                    <SelectItem value="supplier_product">
                      Specific Suppliers
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-muted-foreground text-xs">
                  {applyTo === "all" &&
                    "Offer will apply to every product on the platform."}
                  {applyTo === "operator_product" &&
                    "Select specific data plans or airtime products."}
                  {applyTo === "supplier_product" &&
                    "Select suppliers to discount all their products."}
                </div>
              </div>

              {applyTo === "operator_product" && (
                <div className="space-y-2">
                  <Label>Select Products</Label>
                  <ScrollArea className="h-48 rounded-md border p-2">
                    <div className="space-y-2">
                      {productsData?.data?.products?.map((p: any) => (
                        <div
                          key={p.id}
                          className="hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded p-1"
                          onClick={() => {
                            const checked = selectedProductIds.includes(p.id);
                            setSelectedProductIds((prev) =>
                              !checked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id)
                            );
                          }}
                        >
                          <Checkbox
                            id={p.id}
                            checked={selectedProductIds.includes(p.id)}
                            onCheckedChange={(checked) => {
                              // Handled by parent click but keeping this for accessibility
                            }}
                            className="pointer-events-none" // let parent handle click
                          />
                          <label
                            htmlFor={p.id}
                            className="w-full cursor-pointer py-1 text-sm leading-none"
                          >
                            {p.name}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({p.productCode})
                            </span>
                          </label>
                        </div>
                      ))}
                      {!productsData?.data?.products?.length && (
                        <p className="text-muted-foreground p-2 text-sm">
                          Loading products...
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  <p className="text-muted-foreground text-right text-xs">
                    Selected: {selectedProductIds.length}
                  </p>
                </div>
              )}

              {applyTo === "supplier_product" && (
                <div className="space-y-2">
                  <Label>Select Suppliers</Label>
                  <ScrollArea className="h-48 rounded-md border p-2">
                    <div className="space-y-2">
                      {suppliersData?.data?.suppliers?.map((s: any) => (
                        <div
                          key={s.id}
                          className="hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded p-1"
                          onClick={() => {
                            const checked = selectedSupplierIds.includes(s.id);
                            setSelectedSupplierIds((prev) =>
                              !checked
                                ? [...prev, s.id]
                                : prev.filter((id) => id !== s.id)
                            );
                          }}
                        >
                          <Checkbox
                            id={s.id}
                            checked={selectedSupplierIds.includes(s.id)}
                            onCheckedChange={(checked) => {
                              // Handled by parent div
                            }}
                            className="pointer-events-none"
                          />
                          <label
                            htmlFor={s.id}
                            className="w-full cursor-pointer py-1 text-sm leading-none"
                          >
                            {s.name}
                          </label>
                        </div>
                      ))}
                      {!suppliersData?.data?.suppliers?.length && (
                        <p className="text-muted-foreground p-2 text-sm">
                          Loading suppliers...
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  <p className="text-muted-foreground text-right text-xs">
                    Selected: {selectedSupplierIds.length}
                  </p>
                </div>
              )}

              {/* Role Targeting */}
              <div className="space-y-2 border-t pt-4">
                <Label>Target Specific Roles (Optional)</Label>
                <div className="text-muted-foreground mb-2 text-xs">
                  Select roles to restrict this offer to specific user groups
                  (e.g. Resellers). Leave empty for all users.
                </div>
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-2">
                    {rolesData?.data?.roles?.map((role: any) => (
                      <div
                        key={role.id}
                        className="hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded p-1"
                        onClick={() => {
                          const checked = selectedRoles.includes(role.name); // Using role name as per RESELLER.md
                          setSelectedRoles((prev) =>
                            !checked
                              ? [...prev, role.name]
                              : prev.filter((r) => r !== role.name)
                          );
                        }}
                      >
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={selectedRoles.includes(role.name)}
                          onCheckedChange={() => {}} // Handled by parent
                          className="pointer-events-none"
                        />
                        <label
                          htmlFor={`role-${role.id}`}
                          className="w-full cursor-pointer py-1 text-sm leading-none capitalize"
                        >
                          {role.name}
                        </label>
                      </div>
                    ))}
                    {!rolesData?.data?.roles?.length && (
                      <p className="text-muted-foreground p-2 text-sm">
                        Loading roles...
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {selectedRoles.length > 0 && (
                  <p className="text-muted-foreground text-right text-xs">
                    Restricted to: {selectedRoles.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowAll"
                    checked={allowAll}
                    onCheckedChange={(c) => setAllowAll(!!c)}
                  />
                  <label
                    htmlFor="allowAll"
                    className="text-sm leading-none font-medium"
                  >
                    Open to All Users
                  </label>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  If checked, any registered user can redeem this offer. Uncheck
                  to add specific rules.
                </p>
              </div>

              {!allowAll && (
                <>
                  <div className="space-y-2">
                    <Label>Logic Grouping</Label>
                    <Select
                      value={eligibilityLogic}
                      onValueChange={(v) =>
                        setEligibilityLogic(v as EligibilityLogic)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          AND (Must match ALL rules)
                        </SelectItem>
                        <SelectItem value="any">OR (Match ANY rule)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <OfferRuleBuilder rules={rules} onChange={setRules} />
                </>
              )}
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="font-semibold">Offer Summary</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>{" "}
                      {title}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Discount:</span>{" "}
                      {discountValue}{" "}
                      {discountType === "percentage" ? "%" : "NGN"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid:</span>{" "}
                      {startsAt ? format(new Date(startsAt), "PP") : "Now"} -{" "}
                      {endsAt ? format(new Date(endsAt), "PP") : "Indefinite"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <span className="capitalize">{status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Limit:</span>{" "}
                      {perUserLimit || "Unl."} / User •{" "}
                      {totalUsageLimit || "Unl."} Total
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-2 font-semibold">Scope</h3>
                  <p className="text-sm">
                    {applyTo === "all" && "All Products (Site-wide)"}
                    {applyTo === "operator_product" &&
                      `${selectedProductIds.length} Specific Products Selected`}
                    {applyTo === "supplier_product" &&
                      `${selectedSupplierIds.length} specific Suppliers Selected`}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-2 font-semibold">Eligibility</h3>
                  {allowAll ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Check className="h-4 w-4" /> Open to everyone
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-muted-foreground mb-2 text-sm">
                        Match{" "}
                        <span className="font-mono uppercase">
                          {eligibilityLogic}
                        </span>
                        :
                      </p>
                      {rules.map((r, i) => (
                        <div key={i} className="border-l-2 pl-2 text-sm">
                          <span className="font-medium capitalize">
                            {r.rule_type.replace("_", " ")}
                          </span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {JSON.stringify(r.params)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {createMutation.isError && (
                  <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Failed to create offer. Please try again.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="flex items-center justify-between sm:justify-between">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={createMutation.isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <div /> // Spacer
        )}

        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            disabled={
              (currentStep === 1 && !isStep1Valid) ||
              (currentStep === 2 && !isStep2Valid) ||
              (currentStep === 3 && !isStep3Valid)
            }
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm & Create
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
