"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useRegister } from "@/hooks/useAuth";
import { useValidateReferralCode } from "@/hooks/useReferrals";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine(
        (val) => {
          const digitsOnly = val.replace(/\D/g, "");
          // Must be exactly 11 digits
          if (digitsOnly.length !== 11) return false;
          // Must start with valid Nigerian prefixes (0 followed by valid network codes)
          // MTN: 0803, 0806, 0703, 0706, 0813, 0816, 0810, 0814, 0903, 0906, 0913, 0916
          // Airtel: 0802, 0808, 0701, 0708, 0812, 0902, 0907, 0912, 0901
          // Glo: 0805, 0807, 0705, 0815, 0811, 0905, 0915
          // 9mobile: 0809, 0817, 0818, 0909, 0908
          const validPrefixes = /^0(70[1-9]|80[1-9]|81[0-8]|90[1-9]|91[0-6])/;
          return validPrefixes.test(digitsOnly);
        },
        {
          message:
            "Please enter a valid Nigerian phone number (e.g., 08012345678)",
        }
      ),
    referralCode: z.string().optional(),
    password: z.preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
    ),
    confirmPassword: z.preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string()
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") || searchParams.get("ref");

  const registerMutation = useRegister();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutateAsync: validateCode, isPending: isValidating } =
    useValidateReferralCode();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(
      registerSchema
    ) as unknown as Resolver<RegisterFormValues>,
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      referralCode: urlCode || "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid, errors },
  } = form;

  // Update referralCode if URL changes
  useEffect(() => {
    if (urlCode) {
      setValue("referralCode", urlCode);
    }
  }, [urlCode, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    const { confirmPassword: _confirmPassword, ...rest } = data;

    // TODO: Re-enable when referrals feature is ready
    // Validate referral code if provided
    // if (rest.referralCode) {
    //   try {
    //     await validateCode(rest.referralCode);
    //   } catch (error: any) {
    //     setError("referralCode", {
    //       message: error.response?.data?.message || "Invalid referral code",
    //     });
    //     return;
    //   }
    // }

    // Normalize phone number (strip non-digits)
    const normalizedPhone = rest.phoneNumber.replace(/\D/g, "");

    const dataToSend = {
      email: rest.email,
      password: rest.password,
      phoneNumber: normalizedPhone,
      fullName: rest.fullName,
      // referralCode: rest.referralCode, // Disabled - referrals Coming Soon
    };

    // Store password in sessionStorage temporarily for auto-fill on login page
    sessionStorage.setItem("registrationPassword", rest.password);
    sessionStorage.setItem("registrationEmail", rest.email);

    try {
      await registerMutation.mutateAsync(dataToSend);
    } catch (err: any) {
      // Defensive parsing of server validation errors and surface them in the form
      const error = err as AxiosError<any>;
      const errorData = error.response?.data;

      console.error("[RegisterForm] Registration error", errorData || error);

      // If server returned details as object mapping fields to messages
      if (errorData?.details && typeof errorData.details === "object") {
        Object.entries(errorData.details).forEach(([field, msg]) => {
          try {
            // Only set known fields
            if (field === "password" || field === "confirmPassword") {
              form.setError("password", { message: String(msg) });
            } else if (field === "email") {
              form.setError("email", { message: String(msg) });
            } else if (field === "phoneNumber") {
              form.setError("phoneNumber", { message: String(msg) });
            } else if (field === "fullName") {
              form.setError("fullName", { message: String(msg) });
            } else {
              // set generic form-level toast for unknown fields
              toast.error(`${field}: ${msg}`);
            }
          } catch (e) {
            // ignore
          }
        });
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "registrationLastError",
              JSON.stringify(errorData)
            );
          }
        } catch {}
        return;
      }

      // If server returned an array of errors
      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        errorData.errors.forEach((e: any) => {
          const msg = typeof e === "string" ? e : e.message || e.msg || e;
          // Heuristic field assignment
          if (/(password)/i.test(msg)) {
            form.setError("password", { message: String(msg) });
          } else if (/(email)/i.test(msg)) {
            form.setError("email", { message: String(msg) });
          } else if (/(phone|phoneNumber)/i.test(msg)) {
            form.setError("phoneNumber", { message: String(msg) });
          } else {
            toast.error(String(msg));
          }
        });
        return;
      }

      // If server returned a single message string
      const singleMessage =
        errorData?.message ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : null);
      if (singleMessage) {
        // Try to attach to password if it mentions password, else show toast
        if (/(password)/i.test(String(singleMessage))) {
          form.setError("password", { message: String(singleMessage) });
        } else {
          toast.error(String(singleMessage));
        }
        return;
      }

      // Persist last registration error so it can be shown after a page refresh
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "registrationLastError",
            JSON.stringify(errorData || { message: String(error?.message) })
          );
        }
      } catch (e) {
        /* ignore storage errors */
      }

      // Fallback: generic toast
      toast.error("Registration failed. Please try again.");
    }
  };

  // On mount, rehydrate last registration error (if any) to show after refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("registrationLastError");
    if (!raw) return;

    try {
      const errorData = JSON.parse(raw);

      if (errorData?.details && typeof errorData.details === "object") {
        Object.entries(errorData.details).forEach(([field, msg]) => {
          try {
            if (field === "password" || field === "confirmPassword") {
              form.setError("password", { message: String(msg) });
            } else if (field === "email") {
              form.setError("email", { message: String(msg) });
            } else if (field === "phoneNumber") {
              form.setError("phoneNumber", { message: String(msg) });
            } else if (field === "fullName") {
              form.setError("fullName", { message: String(msg) });
            } else {
              toast.error(`${field}: ${msg}`);
            }
          } catch (e) {
            /* ignore */
          }
        });
      } else if (
        Array.isArray(errorData?.errors) &&
        errorData.errors.length > 0
      ) {
        errorData.errors.forEach((e: any) => {
          const msg = typeof e === "string" ? e : e.message || e.msg || e;
          if (/(password)/i.test(msg)) {
            form.setError("password", { message: String(msg) });
          } else if (/(email)/i.test(msg)) {
            form.setError("email", { message: String(msg) });
          } else if (/(phone|phoneNumber)/i.test(msg)) {
            form.setError("phoneNumber", { message: String(msg) });
          } else {
            toast.error(String(msg));
          }
        });
      } else if (errorData?.message || errorData?.error) {
        const singleMessage = errorData.message || errorData.error;
        if (/(password)/i.test(String(singleMessage))) {
          form.setError("password", { message: String(singleMessage) });
        } else {
          toast.error(String(singleMessage));
        }
      }
    } catch (e) {
      console.error(
        "[RegisterForm] Failed to parse persisted registration error",
        e
      );
    }
    // do not clear here; clear when user starts editing
  }, [form]);

  // Clear persisted error when user starts typing to avoid stale messages
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        if (sessionStorage.getItem("registrationLastError")) {
          sessionStorage.removeItem("registrationLastError");
        }
      } catch {
        /* ignore */
      }
    };

    document.addEventListener("input", handler);
    return () => document.removeEventListener("input", handler);
  }, []);

  return (
    <Card className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Doe" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="08012345678"
              maxLength={11}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          {/* TODO: Re-enable when referrals feature is ready
          <div className="grid gap-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              placeholder="e.g. JOHND123"
              {...register("referralCode")}
            />
            {errors.referralCode && (
              <p className="text-sm text-red-500">
                {errors.referralCode.message}
              </p>
            )}
          </div>
          */}
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || registerMutation.isPending || isValidating}
          >
            {registerMutation.isPending ? (
              <div className="flex items-center gap-x-2">
                <Spinner />
                <span>Creating account...</span>
              </div>
            ) : isValidating ? (
              <div className="flex items-center gap-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validating code...</span>
              </div>
            ) : (
              "Create an account"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Login
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
