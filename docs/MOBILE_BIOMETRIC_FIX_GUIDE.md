# Mobile Biometric Authentication Fix Guide

> **CRITICAL**: This guide explains why mobile biometric authentication is failing and provides the exact fixes needed.

## The Core Problem

The mobile app is trying to **simulate** WebAuthn instead of using the **native biometric authentication** that's appropriate for mobile devices. Here's the fundamental mismatch:

| Aspect            | Web Frontend (Works)                                 | Mobile (Broken)                        |
| ----------------- | ---------------------------------------------------- | -------------------------------------- |
| **Auth Method**   | WebAuthn API (`navigator.credentials.get()`)         | Fake/Mock WebAuthn responses           |
| **Signature**     | Real cryptographic signature from TPM/Secure Enclave | Mock deterministic string              |
| **Challenge**     | Signed by hardware                                   | Manually constructed                   |
| **Credential ID** | From backend `allowCredentials`                      | Stored in AsyncStorage (may not match) |

---

## Understanding the Web Frontend Flow

The web frontend works because it uses the **real WebAuthn browser API**:

```typescript
// Web: webauthn.service.ts - REAL WebAuthn flow
static async signAssertion(options: AuthenticationOptionsResponse): Promise<any> {
  // 1. Convert challenge from base64url to ArrayBuffer
  const challenge = this.base64urlToBuffer(options.challenge);

  // 2. Convert allowCredentials (credential IDs the backend knows about)
  const allowCredentials = options.allowCredentials?.map((cred) => ({
    type: cred.type as PublicKeyCredentialType,
    id: this.base64urlToBuffer(cred.id),
    transports: cred.transports as AuthenticatorTransport[] | undefined,
  }));

  // 3. Call the REAL browser API - this prompts fingerprint/face
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: options.rpId,
      allowCredentials,
      userVerification: options.userVerification,
    }
  }) as PublicKeyCredential;

  // 4. Return REAL cryptographic response
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: this.bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: this.bufferToBase64url(response.clientDataJSON),
      authenticatorData: this.bufferToBase64url(response.authenticatorData),
      signature: this.bufferToBase64url(response.signature),  // REAL signature!
    },
  };
}
```

---

## Why Mobile Fails

The mobile `lib/webauthn-mobile.ts` creates **fake** WebAuthn responses:

```typescript
// Mobile: webauthn-mobile.ts - FAKE responses that backend will REJECT

// ❌ Problem 1: Credential ID from AsyncStorage may not match backend
const storedCredentialId = await AsyncStorage.getItem(
  "biometric_credential_id"
);

// ❌ Problem 2: Mock signature is NOT a real cryptographic signature
const signature = generateSignature(challenge, storedCredentialId); // Just a hash, not real!

// ❌ Problem 3: authenticatorData is manually constructed, not from hardware
const authenticatorData = buildAuthenticatorData(); // Fake 37 bytes

// ❌ Problem 4: clientDataJSON is manually built, not from browser
const clientDataJSON = {
  type: "webauthn.get",
  challenge: challenge,
  origin: rpId,
};
```

The backend validates these cryptographic signatures. A fake signature will **always fail**.

---

## The Solution: Native Mobile Biometric Flow

Mobile apps should **NOT** try to replicate WebAuthn. Instead, use a **native mobile biometric flow** with a different backend endpoint.

### Option A: Backend Creates a Mobile-Specific Endpoint (Recommended)

The backend should expose a mobile-friendly endpoint that:

1. Accepts a **device attestation** or **signed challenge** from native biometric
2. Validates it differently than WebAuthn
3. Returns the same `verificationToken` JWT

**Proposed Mobile Flow:**

```
┌─────────────┐      ┌─────────────────────────┐      ┌─────────────┐
│   Mobile    │      │ expo-local-authentication│      │   Backend   │
│     App     │      │                         │      │             │
└──────┬──────┘      └───────────┬─────────────┘      └──────┬──────┘
       │                         │                            │
       │  1. Prompt biometric    │                            │
       │────────────────────────>│                            │
       │                         │                            │
       │  2. User authenticates  │                            │
       │<────────────────────────│                            │
       │                         │                            │
       │  3. POST /mobile/biometric/verify                    │
       │  { deviceId, timestamp, signature? }                 │
       │─────────────────────────────────────────────────────>│
       │                         │                            │
       │  4. { verificationToken: "JWT..." }                  │
       │<─────────────────────────────────────────────────────│
       │                         │                            │
       │  5. POST /user/topup (with verificationToken)        │
       │─────────────────────────────────────────────────────>│
```

### Option B: Use Existing PIN Flow as Fallback

If the backend cannot be modified, mobile should **always use PIN** for transactions:

```typescript
// Mobile: Always use PIN for transactions
export async function determinePaymentMethod(
  hasBiometric: boolean
): Promise<"pin"> {
  // On mobile, always use PIN since WebAuthn is not available
  return "pin";
}
```

---

## Immediate Fix: Disable Fake WebAuthn

Until a proper mobile biometric flow is implemented, disable the fake WebAuthn:

### Step 1: Update `lib/payment-flow.ts`

```typescript
// lib/payment-flow.ts

export async function determinePaymentMethod(
  hasBiometric: boolean
): Promise<"biometric" | "pin"> {
  // TEMPORARY FIX: Always use PIN on mobile
  // WebAuthn is not supported in React Native
  // A proper native biometric flow needs backend support

  console.log("[PaymentFlow] Mobile detected - using PIN authentication");
  return "pin";
}

// REMOVE or comment out these functions:
// - getBiometricChallenge()
// - verifyBiometricAndGetToken()
// - buildWebAuthnAssertion()
```

### Step 2: Update `hooks/useCompletePaymentFlow.ts`

```typescript
// hooks/useCompletePaymentFlow.ts

const processPayment = async (
  params: PaymentParams
): Promise<PaymentResult> => {
  // For now, always require PIN on mobile
  // Show PIN modal directly
  return {
    success: false,
    error: "PIN verification required",
    requiresPin: true,
  };
};
```

---

## Proper Mobile Biometric Implementation (If Backend Supports)

If the backend team adds a `/mobile/biometric/verify` endpoint, here's the correct implementation:

### Step 1: Create `services/mobile-biometric.service.ts`

```typescript
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import apiClient from "./api-client";

interface MobileAuthResponse {
  success: boolean;
  verificationToken?: string;
  message?: string;
}

export const mobileBiometricService = {
  /**
   * Check if device supports biometric authentication
   */
  async isSupported(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /**
   * Get the biometric type available on device
   */
  async getBiometricType(): Promise<"fingerprint" | "facial" | "none"> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return "facial";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    return "none";
  },

  /**
   * Authenticate locally and get verification token from backend
   */
  async authenticateForTransaction(): Promise<MobileAuthResponse> {
    // Step 1: Authenticate locally
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to complete payment",
      fallbackLabel: "Use PIN Instead",
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return {
        success: false,
        message:
          result.error === "user_cancel"
            ? "Authentication cancelled"
            : "Authentication failed",
      };
    }

    // Step 2: Get device identifier (stored during enrollment)
    const deviceId = await SecureStore.getItemAsync("biometric_device_id");

    if (!deviceId) {
      return {
        success: false,
        message: "No biometric enrollment found. Please re-enroll.",
      };
    }

    // Step 3: Request verification token from backend
    try {
      const response = await apiClient.post<{ data: MobileAuthResponse }>(
        "/mobile/biometric/verify", // NEW endpoint needed
        {
          deviceId,
          timestamp: Date.now(),
          platform: Platform.OS,
          intent: "transaction",
        }
      );

      return {
        success: true,
        verificationToken: response.data.data.verificationToken,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Verification failed",
      };
    }
  },

  /**
   * Enroll biometric on mobile device
   * This should be called when user enables biometric in settings
   */
  async enroll(): Promise<{ success: boolean; message?: string }> {
    // Step 1: Check device capability
    const isSupported = await this.isSupported();
    if (!isSupported) {
      return {
        success: false,
        message: "Biometric not available on this device",
      };
    }

    // Step 2: Authenticate to confirm user identity
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to enable biometric login",
    });

    if (!authResult.success) {
      return {
        success: false,
        message: "Authentication failed",
      };
    }

    // Step 3: Register with backend
    try {
      const response = await apiClient.post<{ data: { deviceId: string } }>(
        "/mobile/biometric/enroll", // NEW endpoint needed
        {
          platform: Platform.OS,
          deviceModel: Device.modelName,
          biometricType: await this.getBiometricType(),
        }
      );

      // Step 4: Store device ID securely
      await SecureStore.setItemAsync(
        "biometric_device_id",
        response.data.data.deviceId
      );

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Enrollment failed",
      };
    }
  },
};
```

### Step 2: Update `hooks/useCompletePaymentFlow.ts`

```typescript
import { mobileBiometricService } from "@/services/mobile-biometric.service";

export function useCompletePaymentFlow() {
  const processPayment = async (
    params: PaymentParams
  ): Promise<PaymentResult> => {
    const {
      product,
      phoneNumber,
      useCashback,
      markupPercent,
      userCashbackBalance,
    } = params;

    // Check if mobile biometric is available
    const hasMobileBiometric = await mobileBiometricService.isSupported();
    const hasDeviceEnrolled = await SecureStore.getItemAsync(
      "biometric_device_id"
    );

    let verificationToken: string | undefined;

    if (hasMobileBiometric && hasDeviceEnrolled) {
      // Try biometric first
      const biometricResult =
        await mobileBiometricService.authenticateForTransaction();

      if (biometricResult.success && biometricResult.verificationToken) {
        verificationToken = biometricResult.verificationToken;
      } else if (biometricResult.message !== "Authentication cancelled") {
        // Biometric failed, will fall back to PIN
        console.log("[PaymentFlow] Biometric failed, falling back to PIN");
      } else {
        // User cancelled, don't proceed
        return { success: false, error: "Cancelled" };
      }
    }

    // If no verification token, require PIN
    if (!verificationToken) {
      return {
        success: false,
        error: "PIN verification required",
        requiresPin: true,
      };
    }

    // Build topup request
    const topupRequest: TopupRequest = {
      amount: calculateFinalPrice(
        product,
        markupPercent,
        useCashback,
        userCashbackBalance
      ),
      productCode: product.productCode,
      recipientPhone: phoneNumber,
      supplierSlug: product.supplierOffers?.[0]?.supplierSlug || "",
      supplierMappingId: product.supplierOffers?.[0]?.mappingId || "",
      useCashback,
      verificationToken,
    };

    if (product.activeOffer?.id) {
      topupRequest.offerId = product.activeOffer.id;
    }

    // Submit topup
    const response = await topupService.initiateTopup(topupRequest);

    return {
      success: response.success,
      transaction: response.data,
    };
  };

  return { processPayment };
}
```

---

## Backend Requirements (For Proper Mobile Support)

The backend team needs to create these endpoints:

### `POST /mobile/biometric/enroll`

**Request:**

```json
{
  "platform": "ios" | "android",
  "deviceModel": "iPhone 15 Pro",
  "biometricType": "fingerprint" | "facial"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deviceId": "uuid-v4-device-identifier",
    "enrolledAt": "2026-01-23T22:00:00Z"
  }
}
```

### `POST /mobile/biometric/verify`

**Request:**

```json
{
  "deviceId": "uuid-v4-device-identifier",
  "timestamp": 1706047200000,
  "platform": "ios",
  "intent": "transaction" | "unlock"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verificationToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Summary of Required Changes

### Immediate (No Backend Changes)

| File                              | Change                                                |
| --------------------------------- | ----------------------------------------------------- |
| `lib/payment-flow.ts`             | Return `"pin"` always from `determinePaymentMethod()` |
| `lib/webauthn-mobile.ts`          | Delete or disable this file                           |
| `hooks/useCompletePaymentFlow.ts` | Remove biometric logic, always show PIN               |

### Long-term (With Backend Support)

| File                                        | Change                           |
| ------------------------------------------- | -------------------------------- |
| New: `services/mobile-biometric.service.ts` | Native biometric service         |
| `hooks/useCompletePaymentFlow.ts`           | Use new mobile biometric service |
| Backend: `/mobile/biometric/*`              | New endpoints for mobile         |

---

## Key Differences Summary

| Aspect                 | Web (WebAuthn)                | Mobile (Native)                  |
| ---------------------- | ----------------------------- | -------------------------------- |
| **API**                | `navigator.credentials.get()` | `expo-local-authentication`      |
| **Signature**          | Hardware-backed cryptographic | Device attestation/timestamp     |
| **Credential Storage** | Browser Credential Manager    | Device Keychain/Keystore         |
| **Backend Endpoint**   | `/biometric/auth/verify`      | `/mobile/biometric/verify` (NEW) |
| **Registration**       | WebAuthn register flow        | Simple device ID registration    |

---

## Testing the Fix

1. **Immediate Fix Test:**
   - Open app and try to make a purchase
   - Should immediately show PIN modal (no biometric prompt)
   - Enter PIN and complete transaction

2. **Full Mobile Biometric Test (After Backend Support):**
   - Enroll biometric in settings
   - Make a purchase
   - Should show device fingerprint/face prompt
   - After local auth, should get verification token from backend
   - Transaction should complete

---

## Questions for Backend Team

1. Is there an existing mobile biometric endpoint we can use?
2. Can `/biometric/auth/verify` accept a simplified payload without WebAuthn assertion?
3. What's the preferred device attestation method for mobile?
