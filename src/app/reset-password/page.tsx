import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import Link from "next/link";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it's strong and secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center py-4">
                <Spinner className="text-primary size-8" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-4 text-center text-sm">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
