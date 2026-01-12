"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfferRule, OfferRuleType } from "@/types/admin/offer.types";
import { AlertCircle, Plus, X } from "lucide-react";
import { useMemo } from "react";

interface OfferRuleBuilderProps {
  rules: OfferRule[];
  onChange: (rules: OfferRule[]) => void;
}

// All rule types supported by backend (from OFFER_SYSTEM_DEEP_DIVE.md)

interface RuleTypeConfig {
  value: OfferRuleType;
  label: string;
  description: string;
  requiredParams: string[];
  optionalParams?: string[];
  paramLabels: Record<string, string>;
  paramTypes: Record<string, "number" | "string">;
}

const ruleTypeConfigs: RuleTypeConfig[] = [
  {
    value: "new_user",
    label: "New User",
    description: "Account created within X days",
    requiredParams: ["account_age_days"],
    paramLabels: { account_age_days: "Max Account Age (days)" },
    paramTypes: { account_age_days: "number" },
  },
  {
    value: "min_topups",
    label: "Minimum Topups",
    description: "User must have done at least X topups",
    requiredParams: ["count"],
    optionalParams: ["window_days"],
    paramLabels: {
      count: "Min Topup Count",
      window_days: "Within Days (optional)",
    },
    paramTypes: { count: "number", window_days: "number" },
  },
  {
    value: "min_transactions",
    label: "Min Transactions",
    description: "User must have done at least X total transactions",
    requiredParams: ["count"],
    paramLabels: { count: "Min Transaction Count" },
    paramTypes: { count: "number" },
  },
  {
    value: "min_spent",
    label: "Minimum Spend",
    description: "User must have spent a minimum amount",
    requiredParams: ["amount"],
    optionalParams: ["window_days"],
    paramLabels: {
      amount: "Min Amount (₦)",
      window_days: "Within Days (optional)",
    },
    paramTypes: { amount: "number", window_days: "number" },
  },
  {
    value: "operator_topup_count",
    label: "Operator Topup Count",
    description: "Topups for a specific operator (e.g., MTN)",
    requiredParams: ["operator_id", "count", "window_days"],
    paramLabels: {
      operator_id: "Operator ID",
      count: "Min Count",
      window_days: "Within Days",
    },
    paramTypes: {
      operator_id: "string",
      count: "number",
      window_days: "number",
    },
  },
  {
    value: "operator_spent",
    label: "Operator Spend",
    description: "Spend for a specific operator",
    requiredParams: ["operator_id", "amount", "window_days"],
    paramLabels: {
      operator_id: "Operator ID",
      amount: "Min Amount (₦)",
      window_days: "Within Days",
    },
    paramTypes: {
      operator_id: "string",
      amount: "number",
      window_days: "number",
    },
  },
  {
    value: "last_active_within",
    label: "Last Active Within",
    description: "User profile updated within X days",
    requiredParams: ["days"],
    paramLabels: { days: "Days" },
    paramTypes: { days: "number" },
  },
  {
    value: "active_days",
    label: "Active Days",
    description: "User active on X distinct days in last Y days",
    requiredParams: ["min_active_days", "days"],
    paramLabels: { min_active_days: "Min Active Days", days: "Within Days" },
    paramTypes: { min_active_days: "number", days: "number" },
  },
];

// Get config for a rule type
const getRuleConfig = (ruleType: string): RuleTypeConfig | undefined => {
  return ruleTypeConfigs.find((c) => c.value === ruleType);
};

// Validate a single rule
const validateRule = (rule: OfferRule): string[] => {
  const errors: string[] = [];
  const config = getRuleConfig(rule.rule_type);

  if (!config) {
    errors.push(`Unknown rule type: ${rule.rule_type}`);
    return errors;
  }

  // Check required params
  for (const param of config.requiredParams) {
    const value = rule.params[param];
    if (value === undefined || value === null || value === "") {
      errors.push(`${config.paramLabels[param]} is required`);
    } else if (
      config.paramTypes[param] === "number" &&
      (isNaN(Number(value)) || Number(value) <= 0)
    ) {
      errors.push(`${config.paramLabels[param]} must be a positive number`);
    }
  }

  return errors;
};

// Get default params for a rule type
const getDefaultParams = (ruleType: OfferRuleType): Record<string, any> => {
  switch (ruleType) {
    case "new_user":
      return { account_age_days: 30 };
    case "min_topups":
      return { count: 5 };
    case "min_transactions":
      return { count: 10 };
    case "min_spent":
      return { amount: 5000 };
    case "operator_topup_count":
      return { operator_id: "", count: 3, window_days: 30 };
    case "operator_spent":
      return { operator_id: "", amount: 1000, window_days: 30 };
    case "last_active_within":
      return { days: 7 };
    case "active_days":
      return { min_active_days: 3, days: 7 };
    default:
      return {};
  }
};

export function OfferRuleBuilder({ rules, onChange }: OfferRuleBuilderProps) {
  const addRule = () => {
    const newRule: OfferRule = {
      rule_key: `rule_${Date.now()}`,
      rule_type: "new_user",
      params: getDefaultParams("new_user"),
      description: "",
    };
    onChange([...rules, newRule]);
  };

  const removeRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    onChange(newRules);
  };

  const updateRule = (index: number, updates: Partial<OfferRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    onChange(newRules);
  };

  const handleRuleTypeChange = (index: number, newType: OfferRuleType) => {
    const newRules = [...rules];
    newRules[index] = {
      ...newRules[index],
      rule_type: newType,
      params: getDefaultParams(newType),
    };
    onChange(newRules);
  };

  const updateRuleParam = (index: number, key: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = {
      ...newRules[index],
      params: { ...newRules[index].params, [key]: value },
    };
    onChange(newRules);
  };

  // Validate all rules
  const validationErrors = useMemo(() => {
    return rules.map((rule) => validateRule(rule));
  }, [rules]);

  const hasErrors = validationErrors.some((errors) => errors.length > 0);

  // Render param inputs based on rule config
  const renderParamInputs = (rule: OfferRule, index: number) => {
    const config = getRuleConfig(rule.rule_type);
    if (!config) return null;

    const allParams = [
      ...config.requiredParams,
      ...(config.optionalParams || []),
    ];

    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {allParams.map((param) => {
          const isRequired = config.requiredParams.includes(param);
          const paramType = config.paramTypes[param];
          const errors = validationErrors[index] || [];
          const hasError = errors.some((e) =>
            e.toLowerCase().includes(config.paramLabels[param].toLowerCase())
          );

          return (
            <div key={param} className="space-y-1">
              <Label className="text-xs">
                {config.paramLabels[param]}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                type={paramType === "number" ? "number" : "text"}
                value={rule.params[param] ?? ""}
                onChange={(e) => {
                  const val =
                    paramType === "number"
                      ? e.target.value === ""
                        ? ""
                        : parseFloat(e.target.value)
                      : e.target.value;
                  updateRuleParam(index, param, val);
                }}
                className={`h-8 ${hasError ? "border-destructive" : ""}`}
                placeholder={paramType === "number" ? "0" : "Enter value"}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Eligibility Rules</Label>
          {hasErrors && (
            <p className="text-destructive flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              Fix validation errors before saving
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="bg-muted/50 text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-sm">
            <p>No rules defined. All users will be eligible.</p>
            <Button
              variant="link"
              onClick={addRule}
              className="text-primary h-auto p-0"
            >
              Add first rule
            </Button>
          </div>
        ) : (
          rules.map((rule, index) => {
            const config = getRuleConfig(rule.rule_type);
            const errors = validationErrors[index] || [];

            return (
              <Card
                key={rule.rule_key}
                className={`relative overflow-hidden ${errors.length > 0 ? "border-destructive" : ""}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeRule(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Rule Type</Label>
                      <Select
                        value={rule.rule_type}
                        onValueChange={(v) =>
                          handleRuleTypeChange(index, v as OfferRuleType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ruleTypeConfigs.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-[10px]">
                        {config?.description || ""}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={rule.description || ""}
                        onChange={(e) =>
                          updateRule(index, { description: e.target.value })
                        }
                        placeholder="e.g. New user promotion"
                      />
                    </div>
                  </div>

                  {/* Dynamic Params */}
                  <div className="bg-muted/50 rounded-md p-3">
                    <Label className="text-secondary-foreground mb-2 block text-xs font-medium tracking-wider uppercase">
                      Parameters
                    </Label>
                    {renderParamInputs(rule, index)}
                  </div>

                  {/* Validation Errors */}
                  {errors.length > 0 && (
                    <div className="bg-destructive/10 text-destructive rounded-md p-2">
                      <ul className="list-inside list-disc text-xs">
                        {errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// Export validation helper for use in parent form
export function validateOfferRules(rules: OfferRule[]): boolean {
  return rules.every((rule) => validateRule(rule).length === 0);
}
