"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartBiometricIcon } from "@/components/ui/smart-biometric-icon";
import { useBiometricRegistration } from "@/hooks/useBiometric";
import { WebAuthnService } from "@/services/webauthn.service";
import { Loader2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export function BiometricRegistration() {
  const [deviceName, setDeviceName] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const { mutate: register, isPending } = useBiometricRegistration();

  useEffect(() => {
    WebAuthnService.isWebAuthnSupported().then(setIsSupported);
    const info = WebAuthnService.getDeviceInfo();
    // Only set the device name if it's not already set by the user
    if (!deviceName) {
      setDeviceName(info.deviceName);
    }
  }, [deviceName]);

  const handleRegister = () => {
    register(deviceName, {
      onSuccess: () => {
        setDeviceName(""); // Clear or reset if needed
      },
    });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SmartBiometricIcon size={20} />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Your device does not support biometric authentication or it is not
            available in this browser context.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SmartBiometricIcon size={20} />
          Register New Device
        </CardTitle>
        <CardDescription>
          Enable fingerprint or Face ID for faster and more secure login on this
          device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deviceName">Device Name</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Smartphone className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                id="deviceName"
                placeholder={`e.g. My ${/iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : "Device"}`}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleRegister}
          disabled={isPending || !deviceName}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <SmartBiometricIcon size={16} className="mr-2" />
              Register This Device
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
