# Biometric Integration: Web vs Native Quick Reference

## The Critical Distinction

| Operation                  | Backend Call | When Used              | Implementation                                                                 |
| -------------------------- | :----------: | ---------------------- | ------------------------------------------------------------------------------ |
| **Soft Lock (App Unlock)** |  ❌ **NO**   | User opens app         | Face ID / Fingerprint → Direct access                                          |
| **Transaction Biometric**  |  ✅ **YES**  | User buys airtime/data | Face ID/fingerprint → Cryptographic proof → Backend verification → Transaction |

---

## Web Frontend Implementation (Reference)

### 1. Soft Lock (Not visible in these docs - likely in security/settings)

```typescript
// Conceptual: Passcode check against localStorage
// NO backend call
const validateSoftLock = (userPin: string) => {
  const stored = localStorage.getItem("softLockPin");
  return bcrypt.compare(userPin, stored);
};
```

### 2. Transaction Biometric (Main implementation)

**Key Files:**

- `src/services/biometric.service.ts` - WebAuthn API calls
- `src/hooks/useBiometric.ts` - React Query hooks
- `src/types/biometric.types.ts` - Request/response types
- `src/components/features/checkout/BiometricVerificationModal.tsx` - UI

**Transaction Flow:**

```typescript
// User clicks "Buy Airtime" → BiometricVerificationModal shown

// Step 1: Get challenge from backend
const options = await biometricService.getAuthenticationOptions();
// Returns: { challenge, rpId, allowCredentials, ... }

// Step 2: Local biometric (no backend)
const assertion = await navigator.credentials.get({ publicKey: options });
// Returns: { id, rawId, response: { clientDataJSON, authenticatorData, signature } }

// Step 3: Verify with backend (CRITICAL)
const result = await biometricService.verifyAuthentication(assertion);
// Returns: { verified: true, verificationToken: "jwt_xyz" }

// Step 4: Complete transaction with token
const topupResponse = await topupService.initiateTopup({
  amount: 500,
  productCode: "AIRTIME_MTN",
  recipientPhone: "08012345678",
  verificationToken: result.verificationToken, // ← Biometric proof
});
```

---

## Mobile Implementation Requirements

### Soft Lock Phase

**No Backend Involved**

#### iOS

```swift
import LocalAuthentication

let context = LAContext()
do {
    let success = try await context.evaluatePolicy(
        .deviceOwnerAuthenticationWithBiometrics,
        localizedReason: "Unlock app"
    )
    // success: true → grant access
    // success: false → show PIN prompt
} catch {
    // Biometric unavailable → show PIN prompt
}
```

#### Android

```kotlin
import androidx.biometric.BiometricPrompt

val biometricPrompt = BiometricPrompt(/* ... */)
biometricPrompt.authenticate(promptInfo)

// onAuthenticationSucceeded → grant access
// onAuthenticationFailed → show PIN prompt
// onAuthenticationError → show PIN prompt
```

### Transaction Biometric Phase

**Backend MUST Be Involved**

#### Flow (Both iOS & Android)

```
┌─────────────────────────────────────────────────┐
│ User initiates transaction (e.g., "Buy Airtime")│
└────────────────────┬────────────────────────────┘
                     ↓
         GET /biometric/auth/options
         Backend returns: { challenge, rpId, ... }
                     ↓
        ┌────────────────────────────────┐
        │ LOCAL BIOMETRIC PROMPT         │
        │ (Face ID / Fingerprint)        │
        │ NO BACKEND CALL YET            │
        └────────────────┬───────────────┘
                     ↓ Success
    Sign challenge with local private key
         (SecKeyCreateSignature on iOS)
         (Signature.getInstance on Android)
                     ↓
         POST /biometric/auth/verify
         Backend validates signature
                     ↓ Verified
    Backend returns: { verificationToken: "jwt_xyz" }
                     ↓
         POST /user/topup + verificationToken
                     ↓ Backend
         Process transaction with verified token
```

#### iOS Code (Conceptual)

```swift
// Step 1: Get challenge from backend
let options = try await apiClient.get("/biometric/auth/options")

// Step 2: Local biometric verification
let context = LAContext()
try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)

// Step 3: Sign challenge (local key)
let signature = SecKeyCreateSignature(
    privateKey,
    .ecdsaSignatureMessageX962SHA256,
    challengeData
)

// Step 4: Send proof to backend
let verification = try await apiClient.post(
    "/biometric/auth/verify",
    body: WebAuthnAssertionResponse(
        id: credentialId,
        response: AssertionResponse(
            clientDataJSON: clientData,
            authenticatorData: authData,
            signature: signature
        )
    )
)

// Step 5: Use verification token for transaction
let topup = try await apiClient.post(
    "/user/topup",
    body: TopupRequest(
        amount: 500,
        productCode: "AIRTIME_MTN",
        verificationToken: verification.verificationToken
    )
)
```

#### Android Code (Conceptual)

```kotlin
// Step 1: Get challenge from backend
val options = apiClient.get("/biometric/auth/options")

// Step 2: Local biometric verification
val biometricPrompt = BiometricPrompt(/* ... */)
biometricPrompt.authenticate(promptInfo)

// Step 3 (in onAuthenticationSucceeded): Sign challenge
val keyStore = KeyStore.getInstance("AndroidKeyStore")
val privateKey = keyStore.getKey("com.nexus.biometric.key")

val signature = Signature.getInstance("SHA256withECDSA")
signature.initSign(privateKey)
signature.update(Base64.decode(options.challenge))
val signedData = signature.sign()

// Step 4: Send proof to backend
val verification = apiClient.post(
    "/biometric/auth/verify",
    body = WebAuthnAssertionResponse(
        id = credentialId,
        response = AssertionResponse(
            clientDataJSON = clientData,
            authenticatorData = authData,
            signature = Base64.encode(signedData)
        )
    )
)

// Step 5: Use verification token for transaction
val topup = apiClient.post(
    "/user/topup",
    body = TopupRequest(
        amount = 500,
        productCode = "AIRTIME_MTN",
        verificationToken = verification.verificationToken
    )
)
```

---

## Backend Contracts (What Mobile Needs)

### Soft Lock Endpoints

- **None** - Soft lock is client-side only

### Transaction Biometric Endpoints

#### 1. Get Registration Options

```http
GET /biometric/register/options
Response: {
  "challenge": "base64_string",
  "rp": { "name": "Nexus", "id": "nexus-data.com" },
  "user": { "id": "user_id", "name": "email@example.com", "displayName": "User Name" },
  "pubKeyCredParams": [{ "alg": -7, "type": "public-key" }],
  "attestation": "direct",
  "authenticatorSelection": { "authenticatorAttachment": "platform", ... }
}
```

#### 2. Verify Registration

```http
POST /biometric/register/verify
Request: {
  "id": "credential_id",
  "rawId": "base64_rawId",
  "response": {
    "clientDataJSON": "base64_client_data",
    "attestationObject": "base64_attestation"
  },
  "type": "public-key",
  "deviceName": "iPhone 15 Pro",
  "platform": "ios"
}
Response: {
  "verified": true,
  "enrollmentId": "enrollment_id",
  "message": "Biometric registered successfully"
}
```

#### 3. Get Authentication Options

```http
GET /biometric/auth/options
Response: {
  "challenge": "base64_challenge",
  "rpId": "nexus-data.com",
  "allowCredentials": [
    {
      "id": "base64_cred_id",
      "type": "public-key",
      "transports": ["platform"]
    }
  ],
  "userVerification": "preferred",
  "timeout": 60000
}
```

#### 4. Verify Authentication

```http
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
  "expiresIn": 300,
  "message": "Authentication successful"
}
```

#### 5. Topup with Verification Token

```http
POST /user/topup
Request: {
  "amount": 500,
  "productCode": "AIRTIME_MTN",
  "recipientPhone": "08012345678",
  "verificationToken": "jwt_token_xyz",
  "supplierSlug": "mtn",
  "useCashback": false
}
Response: {
  "success": true,
  "message": "Transaction successful",
  "data": {
    "transactionId": "tx_123",
    "status": "completed",
    "amount": 500,
    "balance": 4500,
    "timestamp": "2024-01-22T10:30:00Z"
  }
}
```

#### 6. Topup with PIN (Fallback)

```http
POST /user/topup
Request: {
  "amount": 500,
  "productCode": "AIRTIME_MTN",
  "recipientPhone": "08012345678",
  "pin": "1234",
  "supplierSlug": "mtn"
}
Response: {
  "success": true,
  "message": "Transaction successful",
  "data": { ... }
}
```

---

## Key Architectural Principles

### ✅ DO

1. **Soft Lock = Zero Backend**

   ```
   Biometric prompt → Local verification → Session flag → Done
   (No network call)
   ```

2. **Transaction Bio = With Backend**

   ```
   Backend challenge → Local biometric → Backend verification → Token → Transaction
   (3 network calls)
   ```

3. **Same Format for All Platforms**
   - Web, iOS, Android all send identical WebAuthn response format
   - Backend treats all equally

4. **Token-Based Security**
   - Verification token proves biometric happened
   - Backend validates token, not just trusting "biometric succeeded"

### ❌ DON'T

1. Make backend call for soft lock
2. Skip backend verification for transaction biometric
3. Reuse verification tokens across multiple transactions
4. Store private keys unencrypted
5. Ignore PIN fallback requirement

---

## Testing Checklist

### Soft Lock

- [ ] No network calls in Charles Proxy during unlock
- [ ] Passcode works when biometric fails
- [ ] App doesn't re-prompt after successful unlock (same session)

### Transaction Biometric

- [ ] `GET /biometric/auth/options` received before biometric prompt
- [ ] Biometric prompt shown and user completes verification
- [ ] `POST /biometric/auth/verify` sent with signature
- [ ] `verificationToken` received and used in `/user/topup`
- [ ] Transaction succeeds
- [ ] PIN fallback works identically

---

## Documentation Map

| Document                                                                                                                              | Audience         | Purpose                                     |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------- |
| [MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md](MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md)                                                        | Mobile Engineers | Full implementation guide with code samples |
| [MOBILE_BIOMETRIC_CHECKLIST.md](MOBILE_BIOMETRIC_CHECKLIST.md)                                                                        | Mobile Engineers | Step-by-step checklist for implementation   |
| [BIOMETRIC_INTEGRATION_QUICKREF.md](BIOMETRIC_INTEGRATION_QUICKREF.md)                                                                | All              | This file - high-level overview             |
| [src/services/biometric.service.ts](../src/services/biometric.service.ts)                                                             | Web Developers   | Reference implementation                    |
| [src/components/features/checkout/BiometricVerificationModal.tsx](../src/components/features/checkout/BiometricVerificationModal.tsx) | Web Developers   | UI flow reference                           |
