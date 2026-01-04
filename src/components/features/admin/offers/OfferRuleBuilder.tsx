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
import { Plus, X } from "lucide-react";

interface OfferRuleBuilderProps {
  rules: OfferRule[];
  onChange: (rules: OfferRule[]) => void;
}

const ruleTypes: {
  value: OfferRuleType;
  label: string;
  description: string;
}[] = [
  {
    value: "min_spend",
    label: "Minimum Spend",
    description: "User must have spent a minimum amount in a period",
  },
  {
    value: "min_tx_count",
    label: "Min Transaction Count",
    description: "User must have completed at least X transactions",
  },
  {
    value: "new_user",
    label: "New User",
    description: "Account created within X days",
  },
  // { value: "specific_role", label: "Specific Role", description: "Target specific user roles" },
];

export function OfferRuleBuilder({ rules, onChange }: OfferRuleBuilderProps) {
  const addRule = () => {
    const newRule: OfferRule = {
      rule_key: `rule_${Date.now()}`,
      rule_type: "min_spend",
      params: { amount: 1000 },
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

  const updateRuleParam = (index: number, key: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = {
      ...newRules[index],
      params: { ...newRules[index].params, [key]: value },
    };
    onChange(newRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Eligibility Rules</Label>
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
          rules.map((rule, index) => (
            <Card key={rule.rule_key} className="relative overflow-hidden">
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
                        updateRule(index, { rule_type: v as OfferRuleType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-[10px]">
                      {ruleTypes.find((t) => t.value === rule.rule_type)
                        ?.description || ""}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={rule.description || ""}
                      onChange={(e) =>
                        updateRule(index, { description: e.target.value })
                      }
                      placeholder="e.g. High value users"
                    />
                  </div>
                </div>

                {/* Dynamic Params based on type */}
                <div className="bg-muted/50 rounded-md p-3">
                  <Label className="text-secondary-foreground mb-2 block text-xs font-medium tracking-wider uppercase">
                    Parameters
                  </Label>
                  {rule.rule_type === "min_spend" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Amount (₦)</Label>
                        <Input
                          type="number"
                          value={rule.params.amount || ""}
                          onChange={(e) =>
                            updateRuleParam(
                              index,
                              "amount",
                              parseFloat(e.target.value)
                            )
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Period (days)</Label>
                        <Input
                          value={rule.params.period || "30d"}
                          onChange={(e) =>
                            updateRuleParam(index, "period", e.target.value)
                          }
                          className="h-8"
                          placeholder="e.g. 30d"
                        />
                      </div>
                    </div>
                  )}

                  {rule.rule_type === "min_tx_count" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Min Count</Label>
                      <Input
                        type="number"
                        value={rule.params.count || ""}
                        onChange={(e) =>
                          updateRuleParam(
                            index,
                            "count",
                            parseInt(e.target.value)
                          )
                        }
                        className="h-8 max-w-[200px]"
                      />
                    </div>
                  )}

                  {rule.rule_type === "new_user" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Max Account Age (days)</Label>
                      <Input
                        type="number"
                        value={rule.params.days || ""}
                        onChange={(e) =>
                          updateRuleParam(
                            index,
                            "days",
                            parseInt(e.target.value)
                          )
                        }
                        className="h-8 max-w-[200px]"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
