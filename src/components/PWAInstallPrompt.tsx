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

  useEffect(() => {
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
    } else {
      console.log("User dismissed PWA installation");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt) {
    return null;
  }

  // iOS-specific UI
  if (isIOS) {
    return (
      <div className="animate-in slide-in-from-bottom fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-800 dark:bg-blue-900/20">
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
    <div className="animate-in slide-in-from-bottom fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
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
