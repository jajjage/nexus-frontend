"use client";

import { Button } from "@/components/ui/button";
import { useSecurityStore } from "@/store/securityStore";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * InactivityWarning Component
 *
 * Displays a countdown timer showing when app will lock due to inactivity
 * - Appears 2 minutes before soft-lock (at 13 minutes of inactivity)
 * - Shows remaining minutes:seconds
 * - Allows user to stay active by clicking button or moving mouse
 * - Auto-dismisses if user becomes active
 * - Appears as fixed banner in bottom-right corner
 */
export function InactivityWarning() {
  const {
    showInactivityWarning,
    inactivityTimeRemaining,
    recordActivity,
    appState,
  } = useSecurityStore();

  const [timeDisplay, setTimeDisplay] = useState("2:00");
  const [showBanner, setShowBanner] = useState(false);

  // Calculate remaining time from milliseconds
  useEffect(() => {
    if (showInactivityWarning && inactivityTimeRemaining > 0) {
      const totalSeconds = Math.max(
        0,
        Math.ceil(inactivityTimeRemaining / 1000)
      );
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const paddedSeconds = String(seconds).padStart(2, "0");
      setTimeDisplay(`${minutes}:${paddedSeconds}`);
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [showInactivityWarning, inactivityTimeRemaining]);

  // Auto-hide when app gets locked (inactivity warning served its purpose)
  useEffect(() => {
    if (appState === "LOCKED") {
      setShowBanner(false);
    }
  }, [appState]);

  if (!showBanner) {
    return null;
  }

  const handleStayActive = () => {
    console.log("[InactivityWarning] User clicked stay active");
    recordActivity();
    setShowBanner(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 fixed right-4 bottom-4 z-50">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-amber-900">Still here?</h3>
              <span className="text-sm text-amber-800">
                Locking in {timeDisplay}
              </span>
            </div>
            <p className="text-sm text-amber-700">
              Your app will lock due to inactivity. Move your mouse or click
              below to stay active.
            </p>
            <Button
              onClick={handleStayActive}
              variant="outline"
              size="sm"
              className="w-fit border-amber-300 bg-white text-amber-900 hover:bg-amber-50 hover:text-amber-950"
            >
              Stay Active
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
