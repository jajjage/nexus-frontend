"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSettlement } from "@/hooks/admin/useAdminSettlements";
import { CreateSettlementRequest } from "@/types/admin/settlement.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const formSchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  settlementDate: z.string().min(1, "Settlement date is required"),
  amount: z.number().positive("Amount must be positive"),
  fees: z.number().min(0, "Fees cannot be negative"),
  reference: z.string().min(1, "Reference is required"),
  rawReport: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateSettlementForm() {
  const router = useRouter();
  const createMutation = useCreateSettlement();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerId: "",
      settlementDate: new Date().toISOString().split("T")[0],
      amount: 0,
      fees: 0,
      reference: "",
      rawReport: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const data: CreateSettlementRequest = {
      providerId: values.providerId,
      settlementDate: values.settlementDate,
      amount: values.amount,
      fees: values.fees,
      reference: values.reference,
    };

    // Parse rawReport JSON if provided
    if (values.rawReport) {
      try {
        data.rawReport = JSON.parse(values.rawReport);
      } catch {
        form.setError("rawReport", { message: "Invalid JSON format" });
        return;
      }
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        router.push("/admin/dashboard/settlements");
      },
    });
  };

  // Calculate net amount
  const amount = form.watch("amount") || 0;
  const fees = form.watch("fees") || 0;
  const netAmount = amount - fees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/settlements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settlements
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Settlement Information</CardTitle>
                <CardDescription>Enter the settlement details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., provider_123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settlementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Settlement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SET-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Amount Info */}
            <Card>
              <CardHeader>
                <CardTitle>Amount Details</CardTitle>
                <CardDescription>Enter the financial details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Amount (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fees (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Net Amount Preview */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-muted-foreground text-sm">Net Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦
                    {netAmount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Raw Report */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Raw Report (Optional)</CardTitle>
                <CardDescription>
                  Paste the original settlement report as JSON
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="rawReport"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder='{"key": "value"}'
                          className="min-h-[120px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter valid JSON or leave empty
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/dashboard/settlements">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Create Settlement
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
