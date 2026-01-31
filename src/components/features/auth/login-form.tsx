/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useLogin } from "@/hooks/useAuth";
import { credentialManager } from "@/services/credential-manager.service";
import { LoginRequest } from "@/types/auth.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TwoFactorForm } from "./TwoFactorForm";

const loginSchema = z.object({
  credentials: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  role?: "user" | "admin";
}

type LoginStep = "credentials" | "2fa";

export function LoginForm({ role = "user" }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");
  const [pendingCredentials, setPendingCredentials] =
    useState<LoginRequest | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | undefined>();

  /* Removed biometric state as requested */

  const searchParams = useSearchParams();
  const loginMutation = useLogin(role);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      credentials: "",
      password: "",
    },
  });
  console.log("API BASE URL:", process.env.NEXT_PUBLIC_API_URL);

  // Pre-fill email and password from URL params only (not browser storage)
  useEffect(() => {
    const email = searchParams.get("email");
    const fromRegister = searchParams.get("fromRegister");

    // Only fill from URL param if explicitly provided
    if (email) {
      setValue("credentials", email);
    }

    // Only check session storage if we just came from registration
    if (fromRegister === "true") {
      const storedPassword = sessionStorage.getItem("registrationPassword");
      const storedEmail = sessionStorage.getItem("registrationEmail");

      if (storedPassword) setValue("password", storedPassword);
      // Only override email if not in URL
      if (storedEmail && !email) setValue("credentials", storedEmail);

      // Cleanup storage after using it to prevent "ghost" fills later
      sessionStorage.removeItem("registrationPassword");
      sessionStorage.removeItem("registrationEmail");
    }

    // Trigger validation if we filled something
    if (email || fromRegister) {
      setTimeout(() => trigger(), 100);
    }
  }, [searchParams, setValue, trigger]);

  // Handle "Conditional UI" (Browser Autofill hooked to Biometric API)
  // DEFERRED: Backend endpoint /biometric/auth/options is protected.
  // Can be re-enabled when a public endpoint is available.
  /*
  useEffect(() => {
    // ... code removed ...
  }, []);
  */

  const onSubmit = useCallback(
    async (data: LoginFormValues) => {
      const { credentials, password } = data;
      const isEmail = credentials.includes("@");

      const payload: LoginRequest = {
        password,
        ...(isEmail ? { email: credentials } : { phone: credentials }),
      };

      // Store credentials for potential 2FA retry
      setPendingCredentials(payload);
      setTwoFactorError(undefined);

      console.log("[DEBUG] Login Payload:", payload);

      loginMutation.mutate(payload, {
        onSuccess: async () => {
          // Store credentials for future biometric login
          try {
            await credentialManager.storeCredentials(
              credentials,
              password,
              credentials
            );
          } catch (err) {
            console.log("[LoginForm] Credential storage skipped", err);
          }
        },
        onError: (error: AxiosError<any>) => {
          const responseData = error.response?.data;
          if (
            responseData?.message === "2FA code is required" ||
            responseData?.error === "2FA code is required"
          ) {
            setStep("2fa");
          }
        },
      });
    },
    [loginMutation]
  );

  /* Removed handleBiometricLogin as requested */

  const handleTwoFactorSubmit = (code: string, isBackupCode: boolean) => {
    if (!pendingCredentials) return;

    setTwoFactorError(undefined);
    const payload: LoginRequest = {
      ...pendingCredentials,
      ...(isBackupCode ? { backupCode: code } : { totpCode: code }),
    };

    loginMutation.mutate(payload, {
      onError: (error: AxiosError<any>) => {
        const errorMsg =
          error.response?.data?.message || "Invalid code. Please try again.";
        setTwoFactorError(errorMsg);
      },
    });
  };

  const handleTwoFactorCancel = () => {
    setStep("credentials");
    setPendingCredentials(null);
    setTwoFactorError(undefined);
    loginMutation.reset();
  };

  const handleAutoFill = (e: React.AnimationEvent<HTMLInputElement>) => {
    if (e.animationName === "onAutoFillStart") {
      console.log("[LoginForm] Autofill detected, submitting...");
      handleSubmit(onSubmit)();
    }
  };

  // Separate the register calls to avoid ref conflicts
  const credentialsRegister = register("credentials");
  const passwordRegister = register("password");

  const title = role === "admin" ? "Admin Login" : "Login";
  const description =
    role === "admin"
      ? "Enter your credentials to access the admin dashboard"
      : "Enter your email or phone number below to login to your account";

  // Render 2FA form if in 2FA step
  if (step === "2fa") {
    return (
      <TwoFactorForm
        onSubmit={handleTwoFactorSubmit}
        onCancel={handleTwoFactorCancel}
        isPending={loginMutation.isPending}
        error={twoFactorError}
      />
    );
  }

  // Check if error is a 2FA requirement (don't show as error)
  const is2faError =
    loginMutation.error?.response?.data?.require2fa ||
    loginMutation.error?.response?.data?.twoFactor;

  const errorMessage = loginMutation.error?.response?.data?.message || "";
  const isMigrationError =
    errorMessage === "Account Update Required" ||
    errorMessage.toLowerCase().includes("invalid credentials") ||
    errorMessage.toLowerCase().includes("user not found") ||
    errorMessage.toLowerCase().includes("incorrect password");

  const showError = loginMutation.isError && !is2faError && !isMigrationError;

  return (
    <Card className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4"
          autoComplete="on"
        >
          {isMigrationError && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 dark:bg-red-900/10"
            >
              <AlertDescription className="text-sm leading-relaxed text-red-800 dark:text-red-200">
                <div className="space-y-3">
                  <p className="text-base font-bold">Account Update Required</p>
                  <p>
                    We recently migrated our servers to a new platform to
                    improve performance. During this transition, some user
                    accounts could not be automatically transferred.
                  </p>
                  <p>
                    If you think this is wrong, please check your credentials
                    and try again. If the issue persists, it looks like your
                    account was affected.
                  </p>
                  <p>
                    We sincerely apologize for this inconvenience. Please{" "}
                    <Link href="/register" className="font-bold underline">
                      Create a New Account
                    </Link>{" "}
                    to regain access immediately.
                  </p>
                  <p className="text-xs opacity-80">
                    Note: This is a temporary notice that will be removed within
                    a week.
                  </p>
                  <p>
                    If you have any concerns or need to recover specific data,
                    please contact the maintainer at <p>07033776056</p>.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {showError && loginMutation.error?.response?.data?.message && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginMutation.error.response.data.message}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="credentials">Email or Phone Number</Label>
            <Input
              {...credentialsRegister}
              id="credentials"
              type="text"
              autoComplete="username"
              placeholder="m@example.com or 08012345678"
              onAnimationStart={handleAutoFill}
            />
            {errors.credentials && (
              <p className="text-sm text-red-500">
                {errors.credentials.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="ml-auto inline-block text-sm underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                {...passwordRegister}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                onAnimationStart={handleAutoFill}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Biometric Login Button Removed */}

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <div className="flex items-center gap-x-2">
                <Spinner />
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>
        </form>
        {role === "user" && (
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="/register" className="underline">
              Sign up
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
