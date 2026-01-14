"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// ==================== PIN Input Component ====================
interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  masked?: boolean;
}

export const PinInput = forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      length = 4,
      value,
      onChange,
      onComplete,
      error = false,
      disabled = false,
      className,
      masked = true,
    },
    forwardedRef
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sync forwarded ref with internal input ref
    useImperativeHandle(
      forwardedRef,
      () => inputRef.current as HTMLInputElement
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const rawValue = e.target.value;
      // Only allow digits
      const sanitizedValue = rawValue.replace(/\D/g, "").slice(0, length);

      onChange(sanitizedValue);

      if (sanitizedValue.length === length) {
        onComplete?.(sanitizedValue);
      }
    };

    // Focus input when container is clicked
    const handleContainerClick = () => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    };

    return (
      <div
        className={cn("relative w-full", className)}
        onClick={handleContainerClick}
      >
        {/* Visual Boxes */}
        <div className="flex w-full justify-center gap-3">
          {Array.from({ length }).map((_, index) => {
            const digit = value[index];
            const isActive = isFocused && index === value.length;
            const isFilled = digit !== undefined;

            return (
              <div
                key={index}
                className={cn(
                  "flex h-14 w-full max-w-[70px] flex-1 items-center justify-center rounded-md border text-2xl font-semibold transition-all duration-200",
                  "text-foreground bg-transparent",
                  // Error state
                  error
                    ? "border-red-500 bg-red-50/10 text-red-600"
                    : isFilled
                      ? "border-primary/50"
                      : "border-input",
                  // Focus state (active box)
                  isActive &&
                    !error &&
                    "border-ring ring-ring/20 border-2 ring-4",
                  // Disabled state
                  disabled && "bg-muted cursor-not-allowed opacity-50"
                )}
              >
                {isFilled ? (
                  masked ? (
                    <div className="size-3 rounded-full bg-current" />
                  ) : (
                    digit
                  )
                ) : (
                  // Blinking Cursor for active empty box
                  isActive &&
                  !disabled && (
                    <div className="bg-primary h-6 w-0.5 animate-pulse" />
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Hidden Input Overlay */}
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={length}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 h-full w-full cursor-text caret-transparent opacity-0"
          aria-label="PIN Input"
          style={{ transform: "scale(1)" }} // Fix for iOS zoom sometimes
        />
      </div>
    );
  }
);

PinInput.displayName = "PinInput";
