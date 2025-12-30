"use client";

import { Button } from "@/components/ui/button";
import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false); // NEW: Track dismissal animation

  // Dismissal tracking
  const DISMISS_KEY = "pwa_install_dismiss_time";
  const DISMISS_COOLDOWN_DAYS = 7; // Show again after 7 days

  const isDismissedRecently = (): boolean => {
    if (typeof window === "undefined") return false;

    const dismissTime = localStorage.getItem(DISMISS_KEY);
    if (!dismissTime) return false;

    const dismissedAt = parseInt(dismissTime, 10);
    const now = Date.now();
    const daysPassed = (now - dismissedAt) / (1000 * 60 * 60 * 24);

    return daysPassed < DISMISS_COOLDOWN_DAYS;
  };

  const recordDismissal = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
  };

  const clearDismissal = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DISMISS_KEY);
    }
  };

  useEffect(() => {
    console.log("[PWA] Checking installability and display mode");

    // Check if recently dismissed
    if (isDismissedRecently()) {
      console.log("[PWA] Prompt was dismissed recently, skipping");
      return;
    }

    // Detect iOS
    const detectIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream
      );
    };

    const iosDevice = detectIOS();
    setIsIOS(iosDevice);

    // Check if app is already installed
    if (
      (window.navigator as any).standalone ||
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setIsInstalled(true);
      return;
    }

    // For iOS, always show the prompt (no beforeinstallprompt event)
    if (iosDevice) {
      setShowPrompt(true);
      return;
    }

    // For other platforms, listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] beforeinstallprompt event fired", e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Check if app was successfully installed
    const handleAppInstalled = () => {
      console.log("PWA installed successfully");
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted PWA installation");
      clearDismissal(); // Clear dismissal on successful install
    } else {
      console.log("User dismissed PWA installation");
      recordDismissal(); // Record dismissal time
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    console.log("[PWA] User dismissed PWA prompt");
    recordDismissal(); // Record dismissal time
    setIsDismissing(true); // Start dismissal animation

    // Hide after animation (300ms)
    setTimeout(() => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsDismissing(false);
    }, 300);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt) {
    return null;
  }

  // iOS-specific UI
  if (isIOS) {
    return (
      <div
        className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg transition-all duration-300 dark:border-blue-800 dark:bg-blue-900/20 ${
          isDismissing
            ? "translate-y-4 opacity-0"
            : "animate-in slide-in-from-bottom opacity-100"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              Install Nexus Data
            </h3>
            <ol className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
              <li className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold dark:bg-blue-800">
                  1
                </span>
                <span>Tap the Share button</span>
                <Share2 className="size-3.5" />
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold dark:bg-blue-800">
                  2
                </span>
                <span>Select "Add to Home Screen"</span>
              </li>
            </ol>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="mt-3 w-full"
        >
          Got it
        </Button>
      </div>
    );
  }

  // Android/Other platforms UI
  return (
    <div
      className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 ${
        isDismissing
          ? "translate-y-4 opacity-0"
          : "animate-in slide-in-from-bottom opacity-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-semibold">Install App</h3>
          <p className="text-muted-foreground text-xs">
            Install Nexus Data on your home screen for quick access
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={handleInstall} size="sm" className="flex-1">
          <Download className="mr-1 size-4" />
          Install
        </Button>
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Later
        </Button>
      </div>
    </div>
  );
}
