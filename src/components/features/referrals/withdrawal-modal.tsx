"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  useRequestWithdrawal,
  useWithdrawalBalance,
} from "@/hooks/useReferrals";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface WithdrawalModalProps {
  rewardId: string; // The ID of the referral reward program
}

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, "Minimum withdrawal is ₦100")
    .max(1000000, "Maximum withdrawal is ₦1,000,000"),
});

export function WithdrawalModal({ rewardId }: WithdrawalModalProps) {
  const [open, setOpen] = useState(false);
  const { data: balanceResponse, isLoading: isLoadingBalance } =
    useWithdrawalBalance(rewardId);
  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawal();

  const balance = balanceResponse?.data;
  const availableAmount = balance?.totalAmount || 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

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
        rewardId,
        amount: values.amount,
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full sm:w-auto"
          disabled={!rewardId || availableAmount < 100}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Withdraw Rewards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Referral Rewards</DialogTitle>
          <DialogDescription>
            Transfer your earnings to your main wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted mb-6 flex items-center justify-between rounded-lg p-4">
            <span className="text-sm font-medium">Available Balance:</span>
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
                        onChange={(e) => field.onChange(e.target.valueAsNumber)} // Handle number conversion
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
