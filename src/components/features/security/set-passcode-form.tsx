"use client";

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
import { useSetPasscode } from "@/hooks/usePasscode";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const passcodeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    passcode: z
      .string()
      .min(6, "Passcode must be 6 digits")
      .max(6, "Passcode must be 6 digits")
      .regex(/^\d+$/, "Passcode must contain only digits"),
    confirmPasscode: z.string().min(1, "Confirm passcode is required"),
  })
  .refine((data) => data.passcode === data.confirmPasscode, {
    message: "Passcodes do not match",
    path: ["confirmPasscode"],
  });

type PasscodeFormValues = z.infer<typeof passcodeSchema>;

export function SetPasscodeForm() {
  const router = useRouter();
  const { mutate: setPasscode, isPending } = useSetPasscode();
  const [showPasscode, setShowPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);

  const form = useForm<PasscodeFormValues>({
    resolver: zodResolver(passcodeSchema),
    defaultValues: {
      passcode: "",
      confirmPasscode: "",
      currentPassword: "",
    },
  });

  const hasPasscode = false; // TODO: Add hasPasscode to User type when backend supports it

  // Clear password field when component mounts
  useEffect(() => {
    form.clearErrors("currentPassword");
    form.setValue("currentPassword", "");
  }, [form]);

  function onSubmit(data: PasscodeFormValues) {
    setPasscode(
      {
        passcode: data.passcode,
        currentPasscode: data.currentPassword, // Backend requires this, service maps to currentPassword
      },
      {
        onSuccess: () => {
          toast.success(
            `App Passcode ${hasPasscode ? "updated" : "set"} successfully`
          );
          form.reset();
          router.push("/dashboard/profile/security");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message ||
              `Failed to ${hasPasscode ? "update" : "set"} passcode`
          );
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New App Passcode</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPasscode ? "text" : "password"}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="000000"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowPasscode(!showPasscode)}
                  >
                    {showPasscode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPasscode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New App Passcode</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPasscode ? "text" : "password"}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="000000"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowConfirmPasscode(!showConfirmPasscode)}
                  >
                    {showConfirmPasscode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
            {hasPasscode ? "Update Passcode" : "Set Passcode"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
