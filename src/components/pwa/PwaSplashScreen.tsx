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
 *
 * IMPORTANT: Uses inline styles for background to ensure immediate application
 * before CSS classes are processed.
 */
export function PwaSplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPwa, setIsPwa] = useState(getIsPwa);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    // Re-check PWA status on mount (in case SSR was different)
    setIsPwa(getIsPwa());
    setIsDarkMode(getInitialTheme());

    // Minimum splash display time for PWA (1.5 seconds for polished loading feel)
    const minTime = getIsPwa() ? 1500 : 0;
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

  // Use inline styles for IMMEDIATE theme application
  // This prevents flash where CSS classes haven't loaded yet
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // CRITICAL: Inline background color ensures no flash
    backgroundColor: isDarkMode ? "#09090b" : "#ffffff", // zinc-950 / white
    color: isDarkMode ? "#ffffff" : "#18181b", // white / zinc-900
  };

  const mutedColor = isDarkMode ? "#a1a1aa" : "#71717a"; // zinc-400 / zinc-500
  const spinnerStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: `2px solid ${isDarkMode ? "#3f3f46" : "#e4e4e7"}`, // zinc-700 / zinc-200
    borderTopColor: isDarkMode ? "#f59e0b" : "#d97706", // amber-500 / amber-600
    animation: "spin 1s linear infinite",
  };

  // Use the same logo for both themes - just ensure it's visible
  // The icon should be designed to work on both backgrounds
  const logoSrc = isDarkMode
    ? "/images/splash-icon-dark.png"
    : "/images/splash-icon-light.png";

  return (
    <>
      {/* Inject keyframes for spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div style={containerStyle}>
        {/* Logo with subtle scale animation */}
        <div style={{ animation: "pulse 2s ease-in-out infinite" }}>
          <Image
            src={logoSrc}
            alt="Nexus Data"
            width={120}
            height={120}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Brand name */}
        <h1
          style={{
            marginTop: 16,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.025em",
          }}
        >
          Nexus Data
        </h1>

        {/* Tagline */}
        <p
          style={{
            marginTop: 8,
            fontSize: 14,
            color: mutedColor,
          }}
        >
          Your Gateway to Seamless Data
        </p>

        {/* Loading spinner */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={spinnerStyle} />
          <p style={{ fontSize: 12, color: mutedColor }}>Loading...</p>
        </div>
      </div>
    </>
  );
}
