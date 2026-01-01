"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useAvailableBalanceV2,
  useRequestWithdrawalV2,
} from "@/hooks/useReferrals";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface WithdrawalModalProps {
  userType: "referrer" | "referred";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, "Minimum withdrawal is ₦100")
    .max(1000000, "Maximum withdrawal is ₦1,000,000"),
});

export function WithdrawalModal({
  userType,
  open,
  onOpenChange,
}: WithdrawalModalProps) {
  const { data: balance, isLoading: isLoadingBalance } =
    useAvailableBalanceV2(userType);
  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawalV2();

  const availableAmount = balance?.totalAvailable || 0;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({ amount: availableAmount });
    }
  }, [open, availableAmount, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.amount > availableAmount) {
      form.setError("amount", {
        type: "manual",
        message: "Amount exceeds available balance",
      });
      return;
    }

    requestWithdrawal(
      {
        userType,
        amount: values.amount,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  const title =
    userType === "referrer"
      ? "Withdraw Referral Earnings"
      : "Withdraw Signup Bonus";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Transfer your earnings to your main wallet balance.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted mb-6 flex items-center justify-between rounded-lg p-4">
            <span className="text-sm font-medium">Available to Withdraw:</span>
            {isLoadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="text-xl font-bold text-green-600">
                ₦{availableAmount.toLocaleString()}
              </span>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Withdraw</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum withdrawal amount is ₦100.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isPending || availableAmount < 100}
                  className="w-full"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirm Withdrawal
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
