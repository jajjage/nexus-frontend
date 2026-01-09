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
import { LoginRequest } from "@/types/auth.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  // Pre-fill email and password from URL params and sessionStorage (when redirected from register)
  useEffect(() => {
    console.log("Login form mounted, searchParams:", {
      email: searchParams.get("email"),
      fromRegister: searchParams.get("fromRegister"),
    });

    const email = searchParams.get("email");
    const fromRegister = searchParams.get("fromRegister");

    if (email) {
      console.log("Setting email from URL param:", email);
      setValue("credentials", email);
    }

    if (fromRegister === "true") {
      const storedPassword = sessionStorage.getItem("registrationPassword");
      const storedEmail = sessionStorage.getItem("registrationEmail");

      console.log("Coming from register, checking sessionStorage:", {
        hasPassword: !!storedPassword,
        hasEmail: !!storedEmail,
      });

      if (storedPassword) {
        console.log("Setting password from sessionStorage");
        setValue("password", storedPassword);
      }
      if (storedEmail && !email) {
        console.log("Setting email from sessionStorage");
        setValue("credentials", storedEmail);
      }
    }

    if (!email) {
      const fallbackEmail = sessionStorage.getItem("registrationEmail");
      if (fallbackEmail) {
        console.log("Setting fallback email from sessionStorage");
        setValue("credentials", fallbackEmail);
      }
    }

    if (!searchParams.get("password")) {
      const fallbackPassword = sessionStorage.getItem("registrationPassword");
      if (fallbackPassword) {
        console.log("Setting fallback password from sessionStorage");
        setValue("password", fallbackPassword);
      }
    }

    setTimeout(() => {
      trigger();
    }, 100);
  }, [searchParams, setValue, trigger]);

  const onSubmit = async (data: LoginFormValues) => {
    const { credentials, password } = data;
    const isEmail = credentials.includes("@");

    const payload: LoginRequest = {
      password,
      ...(isEmail ? { email: credentials } : { phone: credentials }),
    };

    // Store credentials for potential 2FA retry
    setPendingCredentials(payload);
    setTwoFactorError(undefined);

    console.log("[DEBUG] Login Payload:", payload); // Added debug log

    loginMutation.mutate(payload, {
      onError: (error: AxiosError<any>) => {
        // Check if the error response indicates 2FA is required
        //  console.log("reponse 2fa", responseData?.require2fa);
        const responseData = error.response?.data;
        console.log("reponse 2fa", responseData?.message, responseData?.error);
        if (
          responseData?.message === "2FA code is required" ||
          responseData?.error === "2FA code is required"
        ) {
          console.log("[AUTH] 2FA required - transitioning to 2FA step");
          setStep("2fa");
        }
        // Regular errors are handled by the mutation's default onError
      },
    });
  };

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

  // Separate the register calls to avoid ref conflicts
  const credentialsRegister = register("credentials");
  const passwordRegister = register("password");

  useEffect(() => {
    const handleAutofill = async (event: AnimationEvent) => {
      if (event.animationName === "onAutoFillStart") {
        const isValid = await trigger();
        if (isValid) {
          setTimeout(() => {
            handleSubmit(onSubmit)();
          }, 100);
        }
      }
    };

    const credentialsInput = document.getElementById("credentials");
    const passwordInput = document.getElementById("password");

    credentialsInput?.addEventListener("animationstart", handleAutofill as any);
    passwordInput?.addEventListener("animationstart", handleAutofill as any);

    return () => {
      credentialsInput?.removeEventListener(
        "animationstart",
        handleAutofill as any
      );
      passwordInput?.removeEventListener(
        "animationstart",
        handleAutofill as any
      );
    };
  }, [handleSubmit, trigger]);

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
  const showError = loginMutation.isError && !is2faError;

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
