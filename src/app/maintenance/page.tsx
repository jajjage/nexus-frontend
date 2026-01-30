"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [timeRemaining, setTimeRemaining] = useState(30); // Countdown timer
  const [isChecking, setIsChecking] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleRetry = async () => {
    setIsChecking(true);

    try {
      // Try to ping the backend
      const response = await fetch("/api/v1/health", { method: "GET" });

      if (response.ok) {
        // Backend is back up, redirect to home
        window.location.href = "/";
      } else {
        // Still down, reset timer
        setTimeRemaining(30);
      }
    } catch (error) {
      // Still down, reset timer
      setTimeRemaining(30);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100">
              <WifiOff className="size-8 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
              Service Temporarily Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-gray-600">
              We're currently experiencing technical difficulties with our
              backend services. We're working hard to resolve this issue as
              quickly as possible.
            </p>

            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-800">
                Our Commitment:
              </h3>
              <ul className="space-y-1 text-left text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>We are actively monitoring the situation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>
                    Our team is working to restore service immediately
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>We apologize for any inconvenience caused</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>
                    Service should be restored within the next few minutes
                  </span>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <p className="mb-2 font-medium text-gray-700">
                Estimated time until service restoration:
              </p>
              <div className="text-3xl font-bold text-orange-600">
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleRetry}
                disabled={isChecking}
                className="flex-1"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 size-4" />
                    Check Again
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Error Code: MAINTENANCE-001 | Time:{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
