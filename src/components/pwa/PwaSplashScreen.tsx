"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Helper to detect theme synchronously
function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") return true;
    if (storedTheme === "light") return false;
  } catch {
    // localStorage might not be available
  }
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
 * PWA Splash Screen - Clean design with circular spinner around logo
 * Inspired by Hostinger's loading animation
 */
export function PwaSplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPwa, setIsPwa] = useState(getIsPwa);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    setIsPwa(getIsPwa());
    setIsDarkMode(getInitialTheme());

    const minTime = getIsPwa() ? 1500 : 0;
    const maxTime = 5000; // Maximum wait time - fallback for iOS issues
    const startTime = Date.now();
    let hasCompleted = false;

    const checkReady = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTime - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    };

    // Check if already loaded
    if (document.readyState === "complete") {
      checkReady();
      return;
    }

    // Multiple event listeners for iOS reliability
    window.addEventListener("load", checkReady);
    document.addEventListener("DOMContentLoaded", () => {
      // On DOMContentLoaded, wait a bit more for resources
      setTimeout(checkReady, 500);
    });

    // CRITICAL: Fallback timeout for iOS PWA where events may not fire
    const fallbackTimer = setTimeout(() => {
      console.warn("[PwaSplashScreen] Fallback timeout triggered");
      checkReady();
    }, maxTime);

    return () => {
      window.removeEventListener("load", checkReady);
      clearTimeout(fallbackTimer);
    };
  }, []);

  if (!isPwa || !isLoading) {
    return <>{children}</>;
  }

  // Theme colors
  const bgColor = isDarkMode ? "#09090b" : "#f5f5f5";
  const spinnerColor = isDarkMode ? "#f59e0b" : "#d97706"; // amber-500/600

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgColor,
        }}
      >
        {/* Circular spinner container with logo inside */}
        <div
          style={{
            position: "relative",
            width: 140,
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Circular spinner ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `3px solid ${isDarkMode ? "#27272a" : "#e5e7eb"}`,
              borderTopColor: spinnerColor,
              animation: "spin 1s linear infinite",
            }}
          />

          {/* Logo in center - use theme-appropriate splash icon */}
          <div style={{ animation: "pulse 2s ease-in-out infinite" }}>
            <Image
              src={
                isDarkMode
                  ? "/images/splash-icon-dark.png"
                  : "/images/splash-icon-light.png"
              }
              alt="Nexus Data"
              width={100}
              height={100}
              priority
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
