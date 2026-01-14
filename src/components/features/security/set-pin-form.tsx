"use client";

import { PinInput } from "@/components/pin-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSetPin } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type PinFormValues = {
  pin: string;
  confirmPin: string;
  currentPassword?: string;
};

interface SetPinFormProps {
  onSuccess?: () => void;
}

export function SetPinForm({ onSuccess }: SetPinFormProps) {
  const { user } = useAuth();
  const { mutate: setPin, isPending } = useSetPin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const pinInputRef = useRef<HTMLInputElement>(null);
  const confirmPinInputRef = useRef<HTMLInputElement>(null);

  const hasPin = user?.hasPin;

  // Dynamic schema based on hasPin status
  const pinSchema = z
    .object({
      pin: z
        .string()
        .min(4, "PIN must be 4 digits")
        .max(4, "PIN must be 4 digits")
        .regex(/^\d+$/, "PIN must contain only digits"),
      confirmPin: z.string().min(1, "Confirm PIN is required"),
      currentPassword: z.string().optional(),
    })
    .refine((data) => data.pin === data.confirmPin, {
      message: "PINs do not match",
      path: ["confirmPin"],
    })
    .superRefine((data, ctx) => {
      if (hasPin && !data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Current password is required",
          path: ["currentPassword"],
        });
      }
    });

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: "",
      confirmPin: "",
      currentPassword: "",
    },
  });

  // Auto-focus first PIN input on mount (if no password field) or when password is filled
  useEffect(() => {
    if (!hasPin) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [hasPin]);

  function onSubmit(data: PinFormValues) {
    setPin(
      {
        pin: data.pin,
        currentPassword: data.currentPassword,
      },
      {
        onSuccess: () => {
          toast.success(
            `Transaction PIN ${hasPin ? "updated" : "set"} successfully`
          );
          form.reset();

          if (onSuccess) {
            onSuccess();
          } else if (returnUrl) {
            window.location.href = returnUrl;
          } else {
            window.location.href = "/dashboard/profile";
          }
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message ||
              `Failed to ${hasPin ? "update" : "set"} PIN`
          );
        },
      }
    );
  }

  const handlePinComplete = () => {
    // Auto-advance to confirm PIN
    setTimeout(() => {
      confirmPinInputRef.current?.focus();
    }, 50);
  };

  const handleConfirmComplete = () => {
    // Auto-submit if valid
    form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {hasPin && (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {hasPin ? "New Transaction PIN" : "Set Transaction PIN"}
              </FormLabel>
              <FormControl>
                <PinInput
                  ref={pinInputRef}
                  length={4}
                  value={field.value}
                  onChange={field.onChange}
                  onComplete={handlePinComplete}
                  masked={true}
                  error={!!form.formState.errors.pin}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Transaction PIN</FormLabel>
              <FormControl>
                <PinInput
                  ref={confirmPinInputRef}
                  length={4}
                  value={field.value}
                  onChange={field.onChange}
                  onComplete={handleConfirmComplete}
                  masked={true}
                  error={!!form.formState.errors.confirmPin}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            className="mb-2 w-full"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {hasPin ? "Update PIN" : "Set PIN"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
