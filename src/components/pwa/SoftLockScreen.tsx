"use client";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useSoftLock } from "@/context/SoftLockContext";
import {
  useBiometricAuthentication,
  useBiometricEnrollments,
  useBiometricRegistration,
} from "@/hooks/useBiometric";
import { useVerifyPasscode } from "@/hooks/usePasscode";
import { WebAuthnService } from "@/services/webauthn.service";
import { Fingerprint, Loader2, Lock, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * SoftLockScreen
 *
 * Full-screen overlay that appears when the app is soft-locked.
 * Users can unlock with biometric (if available) or passcode.
 *
 * IMPORTANT: This component only renders when:
 * 1. User is authenticated
 * 2. App is in PWA standalone mode
 * 3. Soft lock is enabled AND locked
 *
 * This prevents unnecessary API calls when not needed.
 */
export function SoftLockScreen() {
  const { isLocked, unlock, isEnabled } = useSoftLock();
  const { user, isAuthenticated } = useAuthContext();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(true);
  const passcodeInputRef = useRef<HTMLInputElement>(null);

  // CRITICAL: Don't render anything if not locked or not authenticated
  // This prevents API calls when user is not logged in
  const shouldRender = isAuthenticated && isLocked && isEnabled;

  // Biometric hooks - Only enabled when we're actually going to use them
  const { mutate: verifyBiometric, isPending: isBiometricPending } =
    useBiometricAuthentication();
  const { mutate: registerBiometric, isPending: isRegisteringBiometric } =
    useBiometricRegistration();

  // Only fetch enrollments when we need them (locked and authenticated)
  const { data: enrollments, isLoading: isLoadingEnrollments } =
    useBiometricEnrollments(shouldRender); // Only fetch when lock screen is active

  const { mutate: verifyPasscode, isPending: isPasscodePending } =
    useVerifyPasscode();

  // Check if user has active biometric enrollments
  const hasBiometricEnrolled = enrollments && enrollments.length > 0;

  // Determine theme for lock screen
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && shouldRender) {
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    }
  }, [shouldRender]);

  // Check biometric support and enrollments on mount - only when locked
  useEffect(() => {
    if (!shouldRender) {
      // Reset state when not locked
      setIsCheckingBiometric(true);
      setShowPasscode(false);
      setShowEnrollment(false);
      setPasscode("");
      setError("");
      return;
    }

    const checkBiometric = async () => {
      try {
        const supported = await WebAuthnService.isWebAuthnSupported();
        setIsBiometricSupported(supported);
        setIsCheckingBiometric(false);

        // Wait for enrollments query to complete
        if (isLoadingEnrollments) return;

        if (supported && hasBiometricEnrolled) {
          // User has biometric enrolled - auto-trigger
          handleBiometricUnlock();
        } else if (supported && !hasBiometricEnrolled) {
          // Biometric supported but not enrolled - offer enrollment
          setShowEnrollment(true);
        } else {
          // Not supported - show passcode
          setShowPasscode(true);
        }
      } catch {
        setIsBiometricSupported(false);
        setIsCheckingBiometric(false);
        setShowPasscode(true);
      }
    };

    checkBiometric();
  }, [shouldRender, isLoadingEnrollments, hasBiometricEnrolled]);

  // Focus passcode input when showing passcode screen
  useEffect(() => {
    if (showPasscode && passcodeInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        passcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showPasscode]);

  // Handle biometric unlock
  const handleBiometricUnlock = useCallback(() => {
    setError("");
    verifyBiometric(undefined, {
      onSuccess: () => {
        console.log("[SoftLockScreen] Biometric unlock successful");
        unlock();
      },
      onError: (err: any) => {
        console.log("[SoftLockScreen] Biometric failed:", err);
        setShowPasscode(true);
        setShowEnrollment(false);
        if (
          !err.message?.includes("cancelled") &&
          !err.message?.includes("not allowed")
        ) {
          setError("Biometric failed. Please use passcode.");
        }
      },
    });
  }, [verifyBiometric, unlock]);

  // Handle biometric enrollment
  const handleBiometricEnrollment = useCallback(() => {
    setError("");
    registerBiometric("Soft Lock Device", {
      onSuccess: () => {
        console.log("[SoftLockScreen] Biometric enrolled - now unlocking");
        handleBiometricUnlock();
      },
      onError: (err: any) => {
        console.log("[SoftLockScreen] Enrollment failed:", err);
        setError("Enrollment failed. Please use passcode.");
        setShowPasscode(true);
        setShowEnrollment(false);
      },
    });
  }, [registerBiometric, handleBiometricUnlock]);

  // Handle passcode input change
  const handlePasscodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPasscode(digits);
    setError("");

    if (digits.length === 6) {
      handlePasscodeUnlock(digits);
    }
  };

  // Handle passcode unlock
  const handlePasscodeUnlock = (code?: string) => {
    const codeToVerify = code || passcode;
    if (codeToVerify.length !== 6) {
      setError("Passcode must be 6 digits");
      return;
    }

    setError("");
    verifyPasscode(
      { passcode: codeToVerify, intent: "unlock" },
      {
        onSuccess: () => {
          console.log("[SoftLockScreen] Passcode unlock successful");
          setPasscode("");
          unlock();
        },
        onError: (err: any) => {
          console.log("[SoftLockScreen] Passcode failed:", err);
          setPasscode("");
          setError(err.response?.data?.message || "Invalid passcode");
        },
      }
    );
  };

  // CRITICAL: Don't render if not supposed to
  if (!shouldRender) return null;

  // Theme-aware colors
  const bgColor = isDarkMode ? "bg-zinc-950" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-zinc-900";
  const mutedColor = isDarkMode ? "text-zinc-400" : "text-zinc-500";
  const inputBg = isDarkMode
    ? "bg-zinc-800 border-zinc-700"
    : "bg-white border-zinc-300";

  const isPending =
    isBiometricPending || isPasscodePending || isRegisteringBiometric;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${bgColor} ${textColor}`}
    >
      {/* Lock Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>

      {/* User Info */}
      {user && (
        <div className="mb-6 text-center">
          <p className="font-semibold">{user.fullName}</p>
          <p className={`text-sm ${mutedColor}`}>{user.email}</p>
        </div>
      )}

      {/* Main Content */}
      {isCheckingBiometric || isLoadingEnrollments ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className={`text-sm ${mutedColor}`}>Checking biometric...</p>
        </div>
      ) : showPasscode ? (
        <div className="w-full max-w-xs px-4">
          <p className="mb-4 text-center text-sm">
            Enter your 6-digit passcode
          </p>

          {/* Passcode Input Container - clickable to focus */}
          <div
            className="relative mb-4 cursor-text"
            onClick={() => passcodeInputRef.current?.focus()}
          >
            {/* Visible digit boxes */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-bold ${inputBg} ${
                    index === passcode.length ? "ring-2 ring-amber-500" : ""
                  }`}
                >
                  {passcode[index] ? "•" : ""}
                </div>
              ))}
            </div>

            {/* Actual input - transparent and overlaid */}
            <input
              ref={passcodeInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={passcode}
              onChange={(e) => handlePasscodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  setPasscode((prev) => prev.slice(0, -1));
                }
              }}
              maxLength={6}
              disabled={isPending}
              autoFocus
              aria-label="Enter passcode"
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
              style={{ caretColor: "transparent" }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="mb-4 text-center text-sm text-red-500">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handlePasscodeUnlock()}
              disabled={passcode.length !== 6 || isPending}
              className="w-full"
            >
              {isPasscodePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock"
              )}
            </Button>

            {isBiometricSupported && hasBiometricEnrolled && (
              <Button
                variant="outline"
                onClick={handleBiometricUnlock}
                disabled={isPending}
                className="w-full"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Use Biometric
              </Button>
            )}
          </div>
        </div>
      ) : showEnrollment ? (
        // Offer biometric enrollment
        <div className="flex flex-col items-center gap-4 px-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Fingerprint className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="text-center">
            <p className="font-medium">Enable Biometric Unlock</p>
            <p className={`mt-1 text-sm ${mutedColor}`}>
              Set up fingerprint or Face ID for faster unlocking
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button
              onClick={handleBiometricEnrollment}
              disabled={isPending}
              className="w-full"
            >
              {isRegisteringBiometric ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Enable Biometric
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setShowEnrollment(false);
                setShowPasscode(true);
              }}
              disabled={isPending}
              className="w-full"
            >
              Use Passcode Instead
            </Button>
          </div>
        </div>
      ) : (
        // Biometric prompt (user has biometric enrolled)
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Fingerprint className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>

          <p className={`text-sm ${mutedColor}`}>
            {isBiometricPending
              ? "Touch your fingerprint sensor..."
              : "Tap to unlock with biometric"}
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleBiometricUnlock}
              disabled={isPending}
              className="min-w-[200px]"
            >
              {isBiometricPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Unlock with Biometric
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowPasscode(true)}
              disabled={isPending}
              className="min-w-[200px]"
            >
              Use Passcode Instead
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
