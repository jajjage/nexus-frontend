import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useAvailableBalance,
  useWalletWithdrawal,
} from "@/hooks/useWithdrawal";
import React, { useState } from "react";
import { toast } from "sonner";

interface WalletWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletWithdrawModal: React.FC<WalletWithdrawModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [amount, setAmount] = useState("");
  const { data: balanceData } = useAvailableBalance();
  const { mutate: withdrawToWallet, isPending } = useWalletWithdrawal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (balanceData && withdrawAmount > (balanceData.availableBalance || 0)) {
      toast.error("Insufficient available balance");
      return;
    }

    withdrawToWallet(
      { amount: withdrawAmount },
      {
        onSuccess: (response) => {
          toast.success(response.data.message || "Withdrawal successful");
          setAmount("");
          onClose();
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || "Withdrawal failed";
          toast.error(message);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw to Wallet</DialogTitle>
          <DialogDescription>
            Instant withdrawal to your app wallet. Funds will be credited
            immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Available Balance: ₦
              {balanceData?.availableBalance?.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Withdraw
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
