"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail } from "@/hooks/useAuth";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const {
    mutate: verify,
    isPending,
    isError,
    isSuccess,
    error,
  } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verify(token);
    }
  }, [token, verify]);

  if (!token) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Invalid Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            The verification link is missing or malformed.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
          <CardTitle>Verifying Your Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please wait while we validate your security token...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Verification Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {(error as any)?.response?.data?.message ||
              "The verification link may have expired or is invalid."}
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Verification Successful</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Your email has been verified. You will be redirected to the
            referrals page shortly.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/referrals">Continue to Referrals</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">
              Loading...
            </p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
