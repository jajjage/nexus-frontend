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
import { useAuth } from "@/hooks/useAuth";
import { useSetPin } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const pinSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    pin: z
      .string()
      .min(4, "PIN must be 4 digits")
      .max(4, "PIN must be 4 digits")
      .regex(/^\d+$/, "PIN must contain only digits"),
    confirmPin: z.string().min(1, "Confirm PIN is required"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

type PinFormValues = z.infer<typeof pinSchema>;

export function SetPinForm() {
  const { user } = useAuth();
  const { mutate: setPin, isPending } = useSetPin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: "",
      confirmPin: "",
      currentPassword: "",
    },
  });

  const hasPin = user?.hasPin;

  // Conditionally make currentPassword required
  useEffect(() => {
    form.clearErrors("currentPassword");
    form.setValue("currentPassword", "");
  }, [hasPin, form]);

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

          if (returnUrl) {
            router.push(returnUrl);
          } else {
            router.push("/dashboard/profile");
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
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Transaction PIN</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? (
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
          name="confirmPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Transaction PIN</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPin ? "text" : "password"}
                    maxLength={4}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? (
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
            {hasPin ? "Update PIN" : "Set PIN"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
