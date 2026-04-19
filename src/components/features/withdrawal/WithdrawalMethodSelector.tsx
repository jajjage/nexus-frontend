import { Banknote, Wallet } from "lucide-react";
import React from "react";

interface WithdrawalMethodSelectorProps {
  selectedMethod: "wallet" | "bank" | null;
  onSelectMethod: (method: "wallet" | "bank") => void;
}

export const WithdrawalMethodSelector: React.FC<
  WithdrawalMethodSelectorProps
> = ({ selectedMethod, onSelectMethod }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onSelectMethod("wallet")}
        className={`rounded-lg border p-4 transition-all ${
          selectedMethod === "wallet"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Wallet className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold">Wallet</h3>
            <p className="text-xs text-gray-600">Instant transfer</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelectMethod("bank")}
        className={`rounded-lg border p-4 transition-all ${
          selectedMethod === "bank"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Banknote className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="text-sm font-semibold">Bank</h3>
            <p className="text-xs text-gray-600">Admin review</p>
          </div>
        </div>
      </button>
    </div>
  );
};
