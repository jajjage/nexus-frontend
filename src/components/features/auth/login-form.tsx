"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  credentials: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  role?: "user" | "admin";
}

export function LoginForm({ role = "user" }: LoginFormProps) {
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      credentials: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    const { credentials, password } = data;
    const isEmail = credentials.includes("@");

    const payload = {
      password,
      ...(isEmail ? { email: credentials } : { phone: credentials }),
    };

    loginMutation.mutate(payload);
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

  return (
    <Card className="mx-auto w-full md:max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {loginMutation.isError &&
            loginMutation.error?.response?.data?.message && (
              <Alert variant="destructive">
                <AlertDescription>
                  {loginMutation.error.response.data.message}
                </AlertDescription>
              </Alert>
            )}
          <div className="grid gap-2">
            <Label htmlFor="credentials">Email or Phone Number</Label>
            <Input
              id="credentials"
              type="text"
              placeholder="m@example.com or 08012345678"
              {...credentialsRegister}
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
              <a href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...passwordRegister}
            />
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
