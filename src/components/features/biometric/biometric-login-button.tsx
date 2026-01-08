"use client";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useBiometricAuthentication } from "@/hooks/useBiometric";
import { WebAuthnService } from "@/services/webauthn.service";
import { useQueryClient } from "@tanstack/react-query";
import { Fingerprint, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BiometricLoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export function BiometricLoginButton({
  className,
  variant = "outline",
}: BiometricLoginButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const { mutate: authenticate, isPending } = useBiometricAuthentication();
  const { setUser } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    WebAuthnService.isWebAuthnSupported().then(setIsSupported);
  }, []);

  const handleLogin = () => {
    authenticate(undefined, {
      onSuccess: (data) => {
        // Force a reload of the current user to update context
        queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });

        // Manually refetch profile to be safe and update context
        // Or just redirect and let the protected route logic handle it
        toast.success("Welcome back!");
        window.location.href = "/dashboard";
      },
    });
  };

  if (!isSupported) return null;

  return (
    <Button
      variant={variant}
      type="button"
      className={className}
      onClick={handleLogin}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 size-4" />
      )}
      Biometric Login
    </Button>
  );
}
