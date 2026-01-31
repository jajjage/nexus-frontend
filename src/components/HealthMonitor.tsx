"use client";

import { useEffect } from "react";
import {
  checkInitialHealthStatus,
  startHealthMonitoring,
  stopHealthMonitoring,
} from "@/lib/health-check";

interface HealthMonitorProps {
  children: React.ReactNode;
}

/**
 * Health Monitor Component
 * Monitors backend health
 */
export function HealthMonitor({ children }: HealthMonitorProps) {
  useEffect(() => {
    // Perform an immediate health check when component mounts
    checkInitialHealthStatus();

    // Start health monitoring when component mounts
    startHealthMonitoring();

    // Cleanup function to stop monitoring when component unmounts
    return () => {
      stopHealthMonitoring();
    };
  }, []);

  return <>{children}</>;
}
