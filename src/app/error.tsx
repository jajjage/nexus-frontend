"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <div className="bg-destructive/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-10 w-10" />
      </div>
      <h1 className="text-foreground mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected error. Please try refreshing the page or
        return to the home screen.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button onClick={() => reset()} size="lg" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" size="lg" className="gap-2" asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <div className="bg-muted text-muted-foreground mt-12 max-w-2xl overflow-auto rounded-lg p-6 text-left font-mono text-xs">
          <p className="text-foreground mb-2 font-bold tracking-wider uppercase">
            Debug Information:
          </p>
          <pre>{error.stack || error.message}</pre>
        </div>
      )}
    </div>
  );
}
