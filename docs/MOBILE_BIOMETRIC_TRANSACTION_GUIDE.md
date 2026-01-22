# Mobile Biometric Transaction Integration Guide

## Overview

This guide explains how mobile developers should implement biometric transaction authentication for the Nexus Data Frontend, integrating with the native ecosystem's constraints while matching the web frontend's intended functionality.

### Key Principle

**Web & Native Split Pattern:**

- **Soft Lock** (Local biometric): No backend communication - device-level only
- **Transaction Approval** (Payment/Topup): **Requires backend** - security-critical operation

---

## Architecture: Two-Tier Biometric System

### Tier 1: Soft Lock (Device-Only, No Backend)

Used for: App access, sensitive screen viewing, general security

**Platform Implementation:**

- **iOS**: LocalAuthentication framework (Face ID / Touch ID)
- **Android**: BiometricPrompt API
- **No backend call required** - purely local device security
- User must pass biometric once, then can access app

**Flow:**

```
User launches app → Biometric verification (local) → Access granted → Can view wallet/transactions
                      ↓ Fails
                      PIN fallback (local)
```

### Tier 2: Transaction Approval (Biometric + Backend Token)

Used for: Topup/Airtime purchases, payment transactions, critical operations

**Platform Implementation:**

- **iOS**: Biometric + WebAuthn token exchange
- **Android**: Biometric + WebAuthn token exchange
- **Requires backend verification** - security-critical
- Backend validates the biometric proof token before approving transaction

**Flow:**

```
User initiates topup → Biometric challenge (local) → Backend verification → Transaction approved
                           ↓ Success
                      Generate proof token
                           ↓
                      POST /user/topup with token
```

---

## Web Frontend: How It Works (Reference)

### 1. Soft Lock Implementation (Web)

**Location:** `src/components/features/security/SoftLockModal.tsx`

```typescript
// Web: No backend involved - purely client-side passcode
const validateSoftLock = (userPin: string) => {
  // Check against locally stored PIN
  // Set session flag "softLockBypass" = true
  // No API call
};
```

### 2. Transaction Biometric Flow (Web)

**Key Files:**

- `src/services/biometric.service.ts` - WebAuthn options & verification
- `src/hooks/useBiometric.ts` - Registration & authentication hooks
- `src/components/features/checkout/BiometricVerificationModal.tsx` - UI

**Step-by-Step Web Flow:**

```typescript
// Step 1: User clicks "Buy Airtime" → Checkout Modal appears
// Location: src/components/features/buy-airtime/CheckoutModal.tsx

// Step 2: User confirms purchase → Biometric challenge triggered
const handlePurchase = async () => {
  // Get biometric authentication options from backend
  const options = await biometricService.getAuthenticationOptions();
  // Options include: challenge, rpId, allowCredentials, etc.
};

// Step 3: Local biometric prompt (device-specific, no backend yet)
// iOS/Web: Face ID prompt via WebAuthn API
// User completes fingerprint/face scan

// Step 4: Sign challenge with device key
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: options.challenge, // From backend
    rpId: options.rpId, // From backend
    userVerification: "preferred",
    allowCredentials: options.allowCredentials,
  },
});

// Step 5: Send proof to backend for verification
const verificationResult =
  await biometricService.verifyAuthentication(assertion);
// Backend validates the cryptographic proof

// Step 6: Backend returns verification token
// Response: { verificationToken: "abc123xyz...", verified: true }

// Step 7: Use token to complete transaction
const topupResponse = await topupService.initiateTopup({
  amount: 500,
  productCode: "AIRTIME_MTN",
  recipientPhone: "08012345678",
  verificationToken: verificationResult.verificationToken, // ← Biometric proof
  // Alternative: pin: "1234" if user chose PIN instead
});
```

**Web Implementation Details:**

```typescript
// Location: src/hooks/useBiometric.ts - Authentication Hook

export function useBiometricAuthentication() {
  return useMutation({
    mutationFn: async () => {
      try {
        // Step 1: Get auth options from backend
        const options = await biometricService.getAuthenticationOptions();

        // Step 2: Local device biometric (WebAuthn)
        const assertion = await getWebAuthnAssertion(options);

        // Step 3: Verify with backend
        const result = await biometricService.verifyAuthentication(assertion);

        return result;
      } catch (error) {
        if (!biometricAvailable) {
          // Fall back to PIN
          throw new BiometricUnavailableError();
        }
      }
    },
  });
}
```

**Transaction Request Structure:**

```typescript
// Location: src/types/topup.types.ts

interface TopupRequest {
  amount: number;
  productCode: string;
  recipientPhone: string;

  // One of these MUST be provided:
  pin?: string; // User's local PIN
  verificationToken?: string; // Biometric proof token from backend

  supplierSlug?: string;
  offerId?: string;
}
```

---

## Mobile Implementation: How To Match Web Behavior

### Native Architecture Requirements

```
Mobile App Structure:
├── Security Layer
│   ├── SoftLock Module (LOCAL ONLY - no backend)
│   │   ├── iOS: LocalAuthentication.framework
│   │   └── Android: BiometricPrompt
│   │
│   └── Transaction Biometric Module (LOCAL + BACKEND)
│       ├── iOS: LAContext + URLSession (HTTP calls)
│       ├── Android: BiometricPrompt + Retrofit/OkHttp
│       └── Backend: WebAuthn verification, token generation
│
├── Transaction Layer
│   ├── TopupRequest (with verificationToken or PIN)
│   └── Backend: POST /user/topup
│
└── API Client
    ├── withCredentials: true (cookies)
    └── Token refresh queue (401 handling)
```

### Phase 1: Soft Lock (Device-Only)

**iOS Implementation:**

```swift
import LocalAuthentication

class SoftLockManager {
    let context = LAContext()

    func authenticateForAppAccess() async -> Bool {
        // Soft lock - NO BACKEND CALL
        var error: NSError?
        let canEvaluate = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )

        if canEvaluate {
            do {
                let success = try await context.evaluatePolicy(
                    .deviceOwnerAuthenticationWithBiometrics,
                    localizedReason: "Unlock Nexus Data"
                )
                return success
            } catch {
                // Fall back to PIN (local verification only)
                return showPINScreen()
            }
        } else {
            // Device doesn't support biometric
            return showPINScreen()
        }
    }

    private func showPINScreen() -> Bool {
        // Compare PIN against locally stored hash
        // NO backend call
        let userInput = getUserPINInput()
        let storedHash = retrieveStoredPINHash()
        return hashFunction(userInput) == storedHash
    }
}
```

**Android Implementation:**

```kotlin
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.core.content.ContextCompat

class SoftLockManager(private val context: Context) {

    fun authenticateForAppAccess(
        onSuccess: () -> Unit,
        onFailure: () -> Unit
    ) {
        // Soft lock - NO BACKEND CALL
        val executor = ContextCompat.getMainExecutor(context)
        val biometricPrompt = BiometricPrompt(
            activity as FragmentActivity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(
                    result: BiometricPrompt.AuthenticationResult
                ) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess() // App unlock - no backend needed
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    showPINScreen() // Fallback to local PIN
                }
            }
        )

        val promptInfo = PromptInfo.Builder()
            .setTitle("Unlock Nexus Data")
            .setNegativeButtonText("Cancel")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }
}
```

### Phase 2: Transaction Biometric (With Backend)

**The Critical Difference:** This phase REQUIRES backend communication

#### Step 1: Backend Setup (What Mobile Expects)

Backend must provide WebAuthn endpoints matching web implementation:

```http
GET /biometric/auth/options
Response: {
  "challenge": "base64_challenge_string",
  "rpId": "nexus-data.com",
  "allowCredentials": [
    {
      "id": "base64_credential_id",
      "type": "public-key",
      "transports": ["platform", "usb"]
    }
  ],
  "userVerification": "preferred",
  "timeout": 60000
}

POST /biometric/auth/verify
Request: {
  "id": "credential_id",
  "rawId": "base64_rawId",
  "response": {
    "clientDataJSON": "base64_client_data",
    "authenticatorData": "base64_auth_data",
    "signature": "base64_signature"
  },
  "type": "public-key"
}
Response: {
  "verified": true,
  "verificationToken": "jwt_token_xyz",
  "message": "Authentication successful"
}
```

#### Step 2: Mobile Implementation - iOS

```swift
import AuthenticationServices

class TransactionBiometricManager {
    let apiClient: APIClient

    func initiateTransaction(
        amount: Double,
        productCode: String,
        recipientPhone: String,
        onCompletion: @escaping (Result<TransactionResponse, Error>) -> Void
    ) async {
        do {
            // Step 1: Get biometric challenge from backend
            let authOptions = try await apiClient.get(
                "/biometric/auth/options",
                as: AuthenticationOptionsResponse.self
            )

            // Step 2: Local biometric verification (Face ID / Touch ID)
            // Platform: NO backend talk yet - purely device-level
            let assertion = try await performBiometricChallenge(authOptions)

            // Step 3: Send proof to backend for verification
            let verificationResult = try await apiClient.post(
                "/biometric/auth/verify",
                body: assertion,
                as: VerificationResponse.self
            )

            // Step 4: Backend verified the proof - get token
            guard let verificationToken = verificationResult.verificationToken else {
                throw BiometricError.tokenGenerationFailed
            }

            // Step 5: Complete transaction using biometric token
            let topupRequest = TopupRequest(
                amount: amount,
                productCode: productCode,
                recipientPhone: recipientPhone,
                verificationToken: verificationToken  // ← Biometric proof
            )

            let response = try await apiClient.post(
                "/user/topup",
                body: topupRequest,
                as: TopupResponse.self
            )

            onCompletion(.success(response))

        } catch let error as BiometricError where error == .unavailable {
            // Fallback: Use PIN instead
            await fallbackToPIN(
                amount: amount,
                productCode: productCode,
                recipientPhone: recipientPhone,
                onCompletion: onCompletion
            )
        } catch {
            onCompletion(.failure(error))
        }
    }

    private func performBiometricChallenge(
        _ options: AuthenticationOptionsResponse
    ) async throws -> WebAuthnAssertionResponse {
        // Platform-specific biometric (Face ID/Touch ID)
        // This is LOCAL - no backend communication

        let context = LAContext()
        var error: NSError?

        // Check if device supports biometric
        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        ) else {
            throw BiometricError.unavailable
        }

        // Perform biometric verification
        try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Verify to complete purchase"
        )

        // After biometric success, use stored credential to sign challenge
        return try signChallengeWithBiometricKey(
            challenge: options.challenge,
            rpId: options.rpId
        )
    }

    private func signChallengeWithBiometricKey(
        challenge: String,
        rpId: String
    ) throws -> WebAuthnAssertionResponse {
        // Use SecKey to sign the challenge
        // (Implementation depends on how you stored the public key during enrollment)

        let challengeData = Data(base64Encoded: challenge)!

        // Get the stored private key reference
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: "com.nexus.biometric.key",
            kSecReturnRef as String: true
        ]

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let keyRef = result as! SecKey? else {
            throw BiometricError.keyNotFound
        }

        // Sign the challenge
        var signError: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(
            keyRef,
            .ecdsaSignatureMessageX962SHA256,
            challengeData as CFData,
            &signError
        ) else {
            throw BiometricError.signingFailed
        }

        // Return assertion (matching WebAuthn format)
        return WebAuthnAssertionResponse(
            id: credentialId,
            rawId: credentialIdBase64,
            response: AssertionResponse(
                clientDataJSON: buildClientDataJSON(challenge, rpId),
                authenticatorData: buildAuthenticatorData(),
                signature: (signature as Data).base64EncodedString()
            ),
            type: "public-key"
        )
    }
}
```

#### Step 3: Mobile Implementation - Android

```kotlin
import android.content.Context
import androidx.biometric.BiometricPrompt
import androidx.security.crypto.EncryptedSharedPreferences
import java.security.KeyStore
import javax.crypto.Cipher

class TransactionBiometricManager(
    private val context: Context,
    private val apiClient: APIClient
) {

    suspend fun initiateTransaction(
        amount: Double,
        productCode: String,
        recipientPhone: String
    ): Result<TransactionResponse> = try {
        // Step 1: Get biometric challenge from backend
        val authOptions = apiClient.get(
            "/biometric/auth/options"
        ).getOrThrow() as AuthenticationOptionsResponse

        // Step 2: Local biometric verification (fingerprint/face)
        val assertion = performBiometricChallenge(authOptions)

        // Step 3: Send proof to backend for verification
        val verificationResult = apiClient.post(
            "/biometric/auth/verify",
            body = assertion
        ).getOrThrow() as VerificationResponse

        // Step 4: Get verification token from backend
        val verificationToken = verificationResult.verificationToken
            ?: throw BiometricException("Token generation failed")

        // Step 5: Complete transaction with biometric token
        val topupRequest = TopupRequest(
            amount = amount,
            productCode = productCode,
            recipientPhone = recipientPhone,
            verificationToken = verificationToken
        )

        val response = apiClient.post(
            "/user/topup",
            body = topupRequest
        ).getOrThrow() as TransactionResponse

        Result.success(response)

    } catch (e: BiometricException) {
        if (e.reason == BiometricReason.UNAVAILABLE) {
            // Fallback to PIN
            fallbackToPIN(amount, productCode, recipientPhone)
        } else {
            Result.failure(e)
        }
    }

    private suspend fun performBiometricChallenge(
        options: AuthenticationOptionsResponse
    ): WebAuthnAssertionResponse {
        // Local biometric - NO BACKEND CALL

        return suspendCancellableCoroutine { continuation ->
            val executor = ContextCompat.getMainExecutor(context)

            val biometricPrompt = BiometricPrompt(
                activity as FragmentActivity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(
                        result: BiometricPrompt.AuthenticationResult
                    ) {
                        try {
                            // Biometric success - sign the challenge
                            val assertion = signChallengeWithBiometricKey(
                                challenge = options.challenge,
                                rpId = options.rpId
                            )
                            continuation.resume(assertion)
                        } catch (e: Exception) {
                            continuation.resumeWithException(e)
                        }
                    }

                    override fun onAuthenticationFailed() {
                        continuation.resumeWithException(
                            BiometricException("Biometric verification failed")
                        )
                    }

                    override fun onAuthenticationError(
                        errorCode: Int,
                        errString: CharSequence
                    ) {
                        continuation.resumeWithException(
                            BiometricException(
                                errString.toString(),
                                reason = BiometricReason.UNAVAILABLE
                            )
                        )
                    }
                }
            )

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Verify Purchase")
                .setSubtitle("Use biometric to confirm transaction")
                .setNegativeButtonText("Cancel")
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG
                )
                .build()

            biometricPrompt.authenticate(promptInfo)
        }
    }

    private fun signChallengeWithBiometricKey(
        challenge: String,
        rpId: String
    ): WebAuthnAssertionResponse {
        // Get stored private key from KeyStore
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        val privateKey = keyStore.getKey("com.nexus.biometric.key", null) as PrivateKey

        // Sign the challenge
        val signature = Signature.getInstance("SHA256withECDSA")
        signature.initSign(privateKey)
        signature.update(Base64.decode(challenge, Base64.DEFAULT))
        val signedData = signature.sign()

        // Return assertion matching WebAuthn format
        return WebAuthnAssertionResponse(
            id = credentialId,
            rawId = credentialIdBase64,
            response = AssertionResponse(
                clientDataJSON = buildClientDataJSON(challenge, rpId),
                authenticatorData = buildAuthenticatorData(),
                signature = Base64.encodeToString(signedData, Base64.DEFAULT)
            ),
            type = "public-key"
        )
    }
}
```

---

## Transaction Flow Diagram

### Web (Reference)

```
User → "Buy Airtime" → Checkout → Biometric Modal
                         ↓
                   Get /biometric/auth/options (backend challenge)
                         ↓
                   Local biometric prompt (device - Face ID / fingerprint)
                         ↓
                   Sign with local private key
                         ↓
                   POST /biometric/auth/verify → Backend validates signature
                         ↓ Success
                   ← verificationToken (JWT from backend)
                         ↓
                   POST /user/topup + verificationToken
                         ↓ Backend
                   Verify token → Approve transaction → Complete
```

### Mobile (Should Match)

```
User → "Buy Airtime" → Checkout → Biometric Modal
                         ↓
                   GET /biometric/auth/options (backend challenge)
                         ↓
                   Local biometric prompt (device - Face ID / fingerprint)
                         ↓
                   Sign with stored private key (device secure storage)
                         ↓
                   POST /biometric/auth/verify → Backend validates signature
                         ↓ Success
                   ← verificationToken (JWT from backend)
                         ↓
                   POST /user/topup + verificationToken
                         ↓ Backend
                   Verify token → Approve transaction → Complete
```

---

## Backend Contract (What Mobile Receives)

### Registration Endpoints (Enrollment)

```http
GET /biometric/register/options
→ Returns registration challenge & options

POST /biometric/register/verify
← Accepts WebAuthn attestation response
→ Returns enrollment confirmation
```

### Authentication Endpoints (Transaction)

```http
GET /biometric/auth/options
→ challenge: base64 challenge string
→ rpId: "nexus-data.com"
→ allowCredentials: [array of credential IDs]
→ userVerification: "preferred"
→ timeout: 60000

POST /biometric/auth/verify
← id, rawId, response.{clientDataJSON, authenticatorData, signature}
→ verified: true
→ verificationToken: "jwt_xyz..." (use in /user/topup)
```

### Topup with Biometric

```http
POST /user/topup
Body: {
  "amount": 500,
  "productCode": "AIRTIME_MTN",
  "recipientPhone": "08012345678",
  "verificationToken": "jwt_xyz..."  // From /biometric/auth/verify
}
→ transactionId, status, balance
```

---

## Key Differences: Web vs Mobile Implementation

| Aspect                  | Web                             | Native iOS                      | Native Android                  |
| ----------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| **Soft Lock**           | Passcode check (localStorage)   | LocalAuthentication framework   | BiometricPrompt API             |
| **Soft Lock Backend**   | ❌ None                         | ❌ None                         | ❌ None                         |
| **Transaction Bio**     | WebAuthn (native)               | LAContext + SecKey              | BiometricPrompt + PrivateKey    |
| **Transaction Backend** | ✅ YES - /biometric/auth/verify | ✅ YES - /biometric/auth/verify | ✅ YES - /biometric/auth/verify |
| **Challenge Signing**   | Browser native                  | SecKeyCreateSignature           | Signature.getInstance().sign()  |
| **Key Storage**         | Browser keystore                | Secure Enclave (iOS)            | AndroidKeyStore                 |
| **Fallback**            | PIN (local check)               | PIN (local check)               | PIN (local check)               |

---

## Common Implementation Pitfalls

### ❌ DON'T: Make Backend Call for Soft Lock

```swift
// WRONG: Soft lock should be local only
func softLock() async throws {
    let response = try await apiClient.post("/verify/soft-lock")
    // ❌ This defeats the purpose of soft lock
}
```

### ✅ DO: Keep Soft Lock Local

```swift
// CORRECT: No network call for soft lock
func authenticateForAppAccess() async -> Bool {
    let context = LAContext()
    try await context.evaluatePolicy(
        .deviceOwnerAuthenticationWithBiometrics,
        localizedReason: "Unlock app"
    )
    return true  // No backend involved
}
```

### ❌ DON'T: Skip Biometric Backend Verification

```kotlin
// WRONG: Biometric proof must be verified by backend
fun completeTransaction(amount: Double) {
    val biometricSuccess = performLocalBiometric()
    if (biometricSuccess) {
        // ❌ Just trusting local biometric - dangerous!
        apiClient.post("/user/topup", body = topupRequest)
    }
}
```

### ✅ DO: Always Verify Biometric Proof with Backend

```kotlin
// CORRECT: Get backend verification before transaction
suspend fun completeTransaction(amount: Double) {
    // Step 1: Local biometric
    val assertion = performLocalBiometric()

    // Step 2: Backend verification (cryptographic proof validation)
    val verificationResult = apiClient.post(
        "/biometric/auth/verify",
        body = assertion  // Send proof to backend
    )

    // Step 3: Use verified token for transaction
    val token = verificationResult.verificationToken
    apiClient.post("/user/topup", body = TopupRequest(
        verificationToken = token
    ))
}
```

---

## Testing Checklist for Mobile Teams

- [ ] **Soft Lock** - No network requests made during app unlock
- [ ] **Soft Lock Fallback** - PIN works when biometric unavailable
- [ ] **Transaction Biometric** - Backend challenge received before local biometric prompt
- [ ] **Signature Validation** - Backend receives signed assertion matching WebAuthn format
- [ ] **Verification Token** - Correctly passed to /user/topup endpoint
- [ ] **Network Offline** - Graceful handling when backend unreachable
- [ ] **Biometric Unavailable** - Smooth fallback to PIN flow
- [ ] **Token Expiry** - Verification token validated before transaction attempt
- [ ] **Concurrent Requests** - Multiple concurrent biometric requests don't duplicate calls
- [ ] **Cookie Management** - withCredentials sent for authenticated requests

---

## Reference Implementation Files (Web)

For exact behavior matching:

- [biometric.service.ts](../src/services/biometric.service.ts) - API contracts
- [useBiometric.ts](../src/hooks/useBiometric.ts) - React Query hooks
- [BiometricVerificationModal.tsx](../src/components/features/checkout/BiometricVerificationModal.tsx) - UI flow
- [topup.service.ts](../src/services/topup.service.ts) - Transaction API
- [topup.types.ts](../src/types/topup.types.ts) - Request/response shapes

---

## Backend Integration Points

### Endpoints Mobile Must Call

1. **`GET /biometric/auth/options`** - Get challenge before transaction
2. **`POST /biometric/auth/verify`** - Verify biometric proof
3. **`GET /biometric/register/options`** - Get options for enrollment
4. **`POST /biometric/register/verify`** - Complete enrollment
5. **`POST /user/topup`** - Initiate transaction with verification token

### Expected Response Formats

All responses must match web implementation for parity:

- Verification token format (JWT)
- Challenge encoding (base64)
- Error messages and codes
- Timeout values

---

## Support & Questions

If unclear on any aspect:

1. Check web implementation in reference files above
2. Review backend WebAuthn spec documentation
3. Ensure biometric proof is sent to backend (not skipped)
4. Verify soft lock uses ZERO backend calls
5. Confirm transaction uses verification token from backend
