"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface PageLoaderProps {
  /** Optional loading message */
  message?: string;
  /** Size of the loader: 'sm' = 80px, 'md' = 120px, 'lg' = 160px */
  size?: "sm" | "md" | "lg";
  /** Whether to show full screen overlay or inline */
  fullScreen?: boolean;
}

/**
 * PageLoader - Reusable loader component with logo inside circular spinner
 * Inspired by Hostinger's clean loading animation
 *
 * Usage:
 * - <PageLoader /> // Full screen loader
 * - <PageLoader message="Loading dashboard..." />
 * - <PageLoader size="sm" fullScreen={false} /> // Inline small loader
 */
export function PageLoader({
  message,
  size = "md",
  fullScreen = true,
}: PageLoaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    }
  }, []);

  // Size configurations
  const sizeConfig = {
    sm: { container: 80, logo: 48, border: 2, fontSize: 12 },
    md: { container: 120, logo: 70, border: 3, fontSize: 13 },
    lg: { container: 160, logo: 100, border: 4, fontSize: 14 },
  };

  const config = sizeConfig[size];
  const bgColor = isDarkMode ? "#09090b" : "#f5f5f5";
  const textColor = isDarkMode ? "#a1a1aa" : "#71717a";
  const spinnerTrack = isDarkMode ? "#27272a" : "#e5e7eb";
  const spinnerActive = isDarkMode ? "#f59e0b" : "#d97706";

  const loaderContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      {/* Circular spinner with logo */}
      <div
        style={{
          position: "relative",
          width: config.container,
          height: config.container,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Spinner ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${config.border}px solid ${spinnerTrack}`,
            borderTopColor: spinnerActive,
            animation: "page-loader-spin 1s linear infinite",
          }}
        />

        {/* Logo */}
        <div style={{ animation: "page-loader-pulse 2s ease-in-out infinite" }}>
          <Image
            src="/images/adaptive-icon.png"
            alt="Loading"
            width={config.logo}
            height={config.logo}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Optional message */}
      {message && (
        <p
          style={{
            color: textColor,
            fontSize: config.fontSize,
            fontWeight: 500,
            margin: 0,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <>
        <style jsx global>{`
          @keyframes page-loader-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes page-loader-pulse {
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
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgColor,
          }}
        >
          {loaderContent}
        </div>
      </>
    );
  }

  // Inline loader
  return (
    <>
      <style jsx global>{`
        @keyframes page-loader-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes page-loader-pulse {
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {loaderContent}
      </div>
    </>
  );
}
