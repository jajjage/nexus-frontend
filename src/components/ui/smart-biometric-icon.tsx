"use client";

import { useBiometricType } from "@/hooks/useBiometricType";
import { cn } from "@/lib/utils";
import { Fingerprint, ScanFace } from "lucide-react";

interface SmartBiometricIconProps {
  className?: string; // Additional classes
  size?: number | string; // Size of the icon
  showLabel?: boolean; // Whether to show the label text
  labelClassName?: string;
}

export function SmartBiometricIcon({
  className,
  size = 24,
  showLabel = false,
  labelClassName,
}: SmartBiometricIconProps) {
  const { type, label } = useBiometricType();

  const IconComponent = () => {
    switch (type) {
      case "face":
        return <ScanFace className={className} size={size} />;
      case "mac":
        // Mac TouchID usually represented by Fingerprint, but we could use something specific if needed.
        // For now, Fingerprint is standard for TouchID.
        // Laptop icon could signal the device, but Fingerprint signals the action.
        return <Fingerprint className={className} size={size} />;
      case "fingerprint":
      default:
        return <Fingerprint className={className} size={size} />;
    }
  };

  if (!showLabel) {
    return <IconComponent />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <IconComponent />
      <span className={cn("text-xs font-medium", labelClassName)}>{label}</span>
    </div>
  );
}
