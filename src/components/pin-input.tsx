"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClipboardEvent, KeyboardEvent, useRef } from "react";

// ==================== PIN Input Component ====================
interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  masked?: boolean;
}

export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  className,
  masked = true,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow digits
    const sanitized = digit.replace(/\D/g, "");
    if (sanitized.length === 0 && digit.length > 0) return;

    const newDigits = [...digits];
    newDigits[index] = sanitized[0] || "";
    const newValue = newDigits.join("").replace(/\s/g, "");

    onChange(newValue);

    // Auto-focus next input
    if (sanitized.length > 0 && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (
      sanitized.length > 0 &&
      index === length - 1 &&
      newValue.length === length
    ) {
      onComplete?.();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!digits[index]) {
        // If current is empty, focus previous
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join("").replace(/\s/g, ""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    const newValue = pastedData.slice(0, length);
    onChange(newValue);

    // Focus the next empty input or last input
    const nextIndex = Math.min(newValue.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Call onComplete if all digits filled
    if (newValue.length === length) {
      onComplete?.();
    }
  };

  return (
    <div className={cn("flex w-full justify-center gap-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="relative max-w-[70px] flex-1">
          <Input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type={masked ? "password" : "text"}
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "h-14 w-full text-center text-2xl font-semibold",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            aria-label={`PIN digit ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}
