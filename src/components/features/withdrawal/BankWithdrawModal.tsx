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
  useBankWithdrawalRequest,
} from "@/hooks/useWithdrawal";
import { BankWithdrawalRequest } from "@/types/withdrawal.types";
import React, { useState } from "react";
import { toast } from "sonner";

interface BankWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankWithdrawModal: React.FC<BankWithdrawModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<BankWithdrawalRequest>({
    amount: 0,
    bankName: "",
    bankCode: "",
    accountName: "",
    accountNumber: "",
    narration: "",
    requestNotes: "",
  });

  const { data: balanceData } = useAvailableBalance();
  const { mutate: requestBankWithdrawal, isPending } =
    useBankWithdrawalRequest();

  const handleInputChange = (
    field: keyof BankWithdrawalRequest,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (balanceData && formData.amount > (balanceData.availableBalance || 0)) {
      toast.error("Insufficient available balance");
      return;
    }

    if (!formData.bankName.trim()) {
      toast.error("Bank name is required");
      return;
    }

    if (!formData.accountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }

    requestBankWithdrawal(formData, {
      onSuccess: (response) => {
        toast.success(
          response.data.message || "Bank withdrawal request submitted"
        );
        setFormData({
          amount: 0,
          bankName: "",
          bankCode: "",
          accountName: "",
          accountNumber: "",
          narration: "",
          requestNotes: "",
        });
        onClose();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || "Request failed";
        toast.error(message);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Bank Withdrawal</DialogTitle>
          <DialogDescription>
            Submit a bank payout request. Admin will review and process it. Your
            commission balance is deducted only after approval.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="max-h-[500px] space-y-4 overflow-y-auto"
        >
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
            <Label htmlFor="amount">Withdrawal Amount (₦) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={formData.amount || ""}
              onChange={(e) =>
                handleInputChange("amount", parseFloat(e.target.value) || 0)
              }
              min="1"
              step="0.01"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              type="text"
              placeholder="e.g., Access Bank"
              value={formData.bankName}
              onChange={(e) => handleInputChange("bankName", e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank Code</Label>
            <Input
              id="bankCode"
              type="text"
              placeholder="e.g., 044"
              value={formData.bankCode || ""}
              onChange={(e) => handleInputChange("bankCode", e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name *</Label>
            <Input
              id="accountName"
              type="text"
              placeholder="e.g., John Agent"
              value={formData.accountName}
              onChange={(e) => handleInputChange("accountName", e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              type="text"
              placeholder="e.g., 0123456789"
              value={formData.accountNumber}
              onChange={(e) =>
                handleInputChange("accountNumber", e.target.value)
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Input
              id="narration"
              type="text"
              placeholder="Optional narration"
              value={formData.narration || ""}
              onChange={(e) => handleInputChange("narration", e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestNotes">Request Notes</Label>
            <Input
              id="requestNotes"
              type="text"
              placeholder="Optional notes for admin"
              value={formData.requestNotes || ""}
              onChange={(e) =>
                handleInputChange("requestNotes", e.target.value)
              }
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
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
