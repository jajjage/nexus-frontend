/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthenticationOptionsResponse } from "@/types/biometric.types";
import { create } from "@github/webauthn-json";
import { biometricService } from "./biometric.service";

/**
 * WebAuthn Service
 * Handles the Options → Verify flow for both registration and authentication
 * Uses the @github/webauthn-json library for simplified binary handling
 */
export class WebAuthnService {
  /**
   * Check if WebAuthn is supported on this device
   */
  static async isWebAuthnSupported(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    return (
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
    );
  }

  // ===================================================================
  // REGISTRATION FLOW
  // ===================================================================

  /**
   * Get registration options from backend
   */
  static async getRegistrationOptions(): Promise<any> {
    const options = await biometricService.getRegistrationOptions();
    return options;
  }

  /**
   * Create WebAuthn credential (uses the options from step 1)
   */
  static async createCredential(options: any): Promise<any> {
    // @github/webauthn-json handles the conversion from JSON to binary
    const credential = await create({
      publicKey: options as any,
    });

    return credential;
  }

  /**
   * Verify credential on backend
   */
  static async verifyCredential(
    credential: any,
    deviceInfo?: {
      deviceName?: string;
      platform?: string;
      authenticatorAttachment?: string;
    }
  ) {
    return await biometricService.verifyRegistration({
      ...credential,
      ...deviceInfo,
    });
  }

  // ===================================================================
  // AUTHENTICATION FLOW
  // ===================================================================

  /**
   * Get authentication options from backend
   */
  static async getAuthenticationOptions(): Promise<AuthenticationOptionsResponse> {
    return await biometricService.getAuthenticationOptions();
  }

  /**
   * Sign assertion using WebAuthn
   * NOTE: Bypassing @github/webauthn-json's get() due to its bug that converts undefined to null
   */
  static async signAssertion(
    options: AuthenticationOptionsResponse,
    mediation?: CredentialMediationRequirement,
    signal?: AbortSignal
  ): Promise<any> {
    // Convert base64url challenge to ArrayBuffer
    const challenge = this.base64urlToBuffer(options.challenge);

    // Convert allowCredentials if present
    const allowCredentials = options.allowCredentials?.map((cred) => ({
      type: cred.type as PublicKeyCredentialType,
      id: this.base64urlToBuffer(cred.id),
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    }));

    // Build the publicKey options, only including defined properties
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      ...(options.rpId && { rpId: options.rpId }),
      ...(options.timeout && { timeout: options.timeout }),
      ...(allowCredentials && { allowCredentials }),
      ...(options.userVerification && {
        userVerification:
          options.userVerification as UserVerificationRequirement,
      }),
    };

    // Build credential request options, only including defined properties
    const requestOptions: CredentialRequestOptions = {
      publicKey: publicKeyOptions,
      mediation: mediation || "optional",
      ...(signal && { signal }),
    };

    const credential = (await navigator.credentials.get(
      requestOptions
    )) as PublicKeyCredential;

    if (!credential) {
      throw new Error("No credential returned");
    }

    // Convert response to JSON-friendly format
    const response = credential.response as AuthenticatorAssertionResponse;
    return {
      id: credential.id,
      rawId: this.bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this.bufferToBase64url(response.clientDataJSON),
        authenticatorData: this.bufferToBase64url(response.authenticatorData),
        signature: this.bufferToBase64url(response.signature),
        ...(response.userHandle && {
          userHandle: this.bufferToBase64url(response.userHandle),
        }),
      },
    };
  }

  /**
   * Convert base64url string to ArrayBuffer
   */
  private static base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = atob(padded);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer.buffer;
  }

  /**
   * Convert ArrayBuffer to base64url string
   */
  private static bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  /**
   * Verify assertion on backend
   */
  static async verifyAssertion(assertion: any) {
    return await biometricService.verifyAuthentication(assertion);
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  /**
   * Get device/platform information
   */
  static getDeviceInfo() {
    if (typeof navigator === "undefined") {
      return {
        platform: "web",
        deviceName: "Unknown Device",
        userAgent: "",
      };
    }

    const ua = navigator.userAgent;

    // Use multiple detection methods for more accurate results
    const isWindows =
      ua.includes("Windows NT") || ua.includes("Win32") || ua.includes("Win64");
    const isMac = ua.includes("Macintosh") || ua.includes("Mac OS X");
    const isIOS =
      ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod");
    const isAndroid = ua.includes("Android");
    const isLinux = ua.includes("Linux");

    // More accurate device name determination
    let deviceName = "Unknown Device";
    let platform: "ios" | "android" | "macos" | "windows" | "web" = "web";

    if (isIOS) {
      deviceName = ua.includes("iPhone")
        ? "iPhone"
        : ua.includes("iPad")
          ? "iPad"
          : "iPod Touch";
      platform = "ios";
    } else if (isAndroid) {
      deviceName = "Android Device";
      platform = "android";
    } else if (isWindows) {
      deviceName = "Windows PC";
      platform = "windows";
    } else if (isMac) {
      deviceName = "Mac";
      platform = "macos";
    } else if (isLinux) {
      deviceName = "Linux Device";
      platform = "web";
    }

    // Additional check: if we detect Android but also Windows, there might be a compatibility mode or hybrid environment
    // In such cases, Windows is more likely the primary OS
    if (isAndroid && isWindows) {
      deviceName = "Windows PC";
      platform = "windows";
    }

    return {
      platform,
      deviceName,
      userAgent: ua,
    };
  }

  /**
   * Get device name/model
   */
  private static getDeviceName(ua: string = navigator.userAgent): string {
    if (typeof navigator === "undefined") return "Unknown Device";

    // Mobile checks first (iOS)
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/iPod/.test(ua)) return "iPod Touch";

    // Mobile checks (Android) - must come before desktop Windows check
    // because some Android devices may have "Windows" in UA
    if (/Android/.test(ua)) return "Android Device";

    // Desktop checks (order matters - check more specific first)
    if (/Windows NT/.test(ua)) return "Windows PC";
    if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
    if (/X11.*Linux|Linux.*X11/.test(ua)) return "Linux Device";
    if (/Linux/.test(ua)) return "Linux Device";

    return "Unknown Device";
  }
}
