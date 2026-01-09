"use client";

import { PinInput } from "@/components/pin-input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseCsvToBulkItems,
  useBulkTopup,
  validateBatchSize,
} from "@/hooks/useReseller";
import { cn } from "@/lib/utils";
import type { BulkTopupItem } from "@/types/reseller.types";
import {
  AlertCircle,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { BulkTopupReport } from "./BulkTopupReport";

interface BulkTopupFormProps {
  className?: string;
}

export function BulkTopupForm({ className }: BulkTopupFormProps) {
  const [batchName, setBatchName] = useState("");
  const [pin, setPin] = useState("");
  const [items, setItems] = useState<BulkTopupItem[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [csvErrors, setCsvErrors] = useState<
    Array<{ row: number; message: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkTopupMutation = useBulkTopup();

  // Add empty item
  const addItem = () => {
    if (items.length >= 50) {
      toast.error("Maximum 50 items per batch");
      return;
    }
    setItems([...items, { recipientPhone: "", amount: 0, productCode: "" }]);
  };

  // Update item at index
  const updateItem = (
    index: number,
    field: keyof BulkTopupItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Remove item at index
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle CSV file upload
  const handleCsvUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { items: parsedItems, errors } = parseCsvToBulkItems(content);

        if (errors.length > 0) {
          setCsvErrors(errors);
          toast.error(`${errors.length} rows had errors`);
        } else {
          setCsvErrors([]);
        }

        if (parsedItems.length > 0) {
          // Append to existing items (up to 50)
          const combined = [...items, ...parsedItems].slice(0, 50);
          setItems(combined);
          toast.success(`Added ${parsedItems.length} items from CSV`);
        }
      };
      reader.readAsText(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [items]
  );

  // Submit batch
  const handleSubmit = () => {
    const sizeError = validateBatchSize(items);
    if (sizeError) {
      toast.error(sizeError);
      return;
    }

    if (pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN");
      return;
    }

    bulkTopupMutation.mutate(
      {
        batchName: batchName || undefined,
        pin,
        requests: items,
      },
      {
        onSuccess: () => {
          setShowReport(true);
        },
      }
    );
  };

  // Clear all
  const clearAll = () => {
    setItems([]);
    setBatchName("");
    setPin("");
    setCsvErrors([]);
  };

  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="size-5" />
            Bulk Topup
          </CardTitle>
          <CardDescription>
            Process up to 50 topups in a single batch
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Batch Name */}
          <div className="space-y-2">
            <Label htmlFor="batchName">Batch Name (optional)</Label>
            <Input
              id="batchName"
              placeholder="e.g., Monday Orders"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          {/* CSV Upload */}
          <div className="space-y-2">
            <Label>Import from CSV</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 size-4" />
                Upload CSV
              </Button>
              <Button variant="outline" onClick={addItem}>
                <Plus className="mr-2 size-4" />
                Add Row
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              CSV format: recipientPhone,amount,productCode
            </p>
          </div>

          {/* CSV Errors */}
          {csvErrors.length > 0 && (
            <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-3">
              <div className="text-destructive flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="size-4" />
                CSV Import Errors
              </div>
              <ul className="text-destructive mt-2 space-y-1 text-xs">
                {csvErrors.slice(0, 5).map((err) => (
                  <li key={err.row}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
                {csvErrors.length > 5 && (
                  <li>...and {csvErrors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items ({items.length}/50)</Label>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>

              <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 flex items-center gap-2 rounded-md p-2"
                  >
                    <Input
                      placeholder="Phone"
                      value={item.recipientPhone}
                      onChange={(e) =>
                        updateItem(index, "recipientPhone", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-24"
                    />
                    <Select
                      value={item.productCode}
                      onValueChange={(value) =>
                        updateItem(index, "productCode", value)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN-AIRTIME">MTN Airtime</SelectItem>
                        <SelectItem value="GLO-AIRTIME">Glo Airtime</SelectItem>
                        <SelectItem value="AIRTEL-AIRTIME">
                          Airtel Airtime
                        </SelectItem>
                        <SelectItem value="9MOBILE-AIRTIME">
                          9Mobile Airtime
                        </SelectItem>
                        <SelectItem value="MTN-DATA-1GB">MTN 1GB</SelectItem>
                        <SelectItem value="MTN-DATA-2GB">MTN 2GB</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PIN Input */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Enter your PIN to confirm</Label>
              <PinInput
                value={pin}
                onChange={setPin}
                length={4}
                className="max-w-[280px]"
              />
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={items.length === 0 || bulkTopupMutation.isPending}
            className="w-full"
          >
            {bulkTopupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing {items.length} items...
              </>
            ) : (
              `Process ${items.length} Topups`
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Modal */}
      {bulkTopupMutation.data && (
        <BulkTopupReport
          open={showReport}
          onOpenChange={setShowReport}
          results={bulkTopupMutation.data.data!}
          onClearBatch={clearAll}
        />
      )}
    </>
  );
}
