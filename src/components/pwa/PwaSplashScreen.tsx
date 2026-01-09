"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Helper to detect theme synchronously (runs during initial render)
function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;

  // Check localStorage first (user preference)
  try {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") return true;
    if (storedTheme === "light") return false;
  } catch {
    // localStorage might not be available
  }

  // Fall back to system preference
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

// Helper to detect if running as PWA
function getIsPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * PWA Splash Screen - Shows immediately when app opens
 * Provides visual feedback while the app is loading
 * Adapts to system theme preference (light/dark mode)
 */
export function PwaSplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPwa, setIsPwa] = useState(getIsPwa);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    // Re-check PWA status on mount (in case SSR was different)
    setIsPwa(getIsPwa());
    setIsDarkMode(getInitialTheme());

    // Minimum splash display time for PWA (500ms)
    const minTime = getIsPwa() ? 500 : 0;
    const startTime = Date.now();

    // Wait for document to be ready
    const checkReady = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTime - elapsed);

      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    };

    if (document.readyState === "complete") {
      checkReady();
    } else {
      window.addEventListener("load", checkReady);
      return () => window.removeEventListener("load", checkReady);
    }
  }, []);

  // Only show splash for PWA users
  if (!isPwa || !isLoading) {
    return <>{children}</>;
  }

  // Dynamic colors based on detected theme
  const bgColor = isDarkMode ? "bg-zinc-950" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-zinc-900";
  const mutedColor = isDarkMode ? "text-zinc-400" : "text-zinc-500";
  const spinnerBg = isDarkMode ? "border-amber-500/20" : "border-amber-600/20";
  const spinnerFg = isDarkMode ? "border-t-amber-500" : "border-t-amber-600";
  const logoSrc = isDarkMode
    ? "/images/splash-icon-dark.png"
    : "/images/splash-icon-light.png";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgColor} ${textColor}`}
    >
      {/* Logo - animated pulse */}
      <div className="animate-pulse">
        <Image
          src={logoSrc}
          alt="Nexus Data"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* Tagline */}
      <p className={`mt-6 text-sm ${mutedColor}`}>
        Your Gateway to Seamless Data
      </p>
    </div>
  );
}
