import { useEffect, useState } from "react";

export type BiometricType = "face" | "fingerprint" | "mac" | "unknown";

interface BiometricState {
  type: BiometricType;
  label: string;
  isAvailable: boolean;
}

export function useBiometricType(): BiometricState {
  const [state, setState] = useState<BiometricState>({
    type: "fingerprint",
    label: "Fingerprint",
    isAvailable: false,
  });

  useEffect(() => {
    // Check if platform authenticator is available (biometrics)
    const checkAvailability = async () => {
      let isAvailable = false;
      try {
        if (
          window.PublicKeyCredential &&
          window.PublicKeyCredential
            .isUserVerifyingPlatformAuthenticatorAvailable
        ) {
          isAvailable =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        }
      } catch (e) {
        console.error("Biometric availability check failed", e);
      }

      // Detection Heuristics
      const ua = navigator.userAgent;
      const types = getBiometricTypeFromUA(ua);

      setState({
        type: types.type,
        label: types.label,
        isAvailable,
      });
    };

    checkAvailability();
  }, []);

  return state;
}

function getBiometricTypeFromUA(ua: string): {
  type: BiometricType;
  label: string;
} {
  // Apple Mobile Devices (iPhone X+, iPad Pro) likely FaceID
  // But older iPhones (SE, 8, etc) use TouchID.
  // We can't distinguish precisely, but "Face ID" is the premium default for modern iOS.
  // "Touch ID" for older iOS.

  // Heuristic: Apple Mobile
  if (/iPhone|iPad|iPod/.test(ua)) {
    // There is no sure way to detect model from UA alone without advanced fingerprinting.
    // However, users asked for "smart" detection.
    // If it's an iPhone, we can lean towards FaceID as it's the standard since 2017.
    // If we want to be safe, we can say "Biometric".
    // But the user specifically asked for "smart to detect which phone".

    // Let's default to FaceID for iOS as it looks cooler/modern and covers 90% of user base.
    return { type: "face", label: "Face ID" };
  }

  // Mac Devices (MacBooks with TouchID)
  if (/Mac/.test(ua)) {
    return { type: "mac", label: "Touch ID" };
  }

  // Android Devices -> Customarily Fingerprint
  if (/Android/.test(ua)) {
    return { type: "fingerprint", label: "Fingerprint" };
  }

  // Windows Hello / Generic
  return { type: "fingerprint", label: "Fingerprint" };
}
