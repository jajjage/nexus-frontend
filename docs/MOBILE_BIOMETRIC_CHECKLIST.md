# Mobile Biometric Implementation Checklist

Quick reference for mobile engineers implementing biometric features to match web frontend.

## Phase 1: Soft Lock (Device-Only, No Backend)

### Requirements

- [ ] User passcode stored securely (encrypted local storage)
- [ ] **ZERO backend calls** during soft lock verification
- [ ] Biometric framework integrated (LocalAuthentication on iOS, BiometricPrompt on Android)
- [ ] Passcode fallback when biometric unavailable or fails
- [ ] Session flag set after successful unlock (no re-prompt for duration of session)

### iOS Checklist

- [ ] `LocalAuthentication.framework` imported
- [ ] `canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)` check
- [ ] `.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)` called async
- [ ] Private key stored in Secure Enclave (if needed for transaction biometric later)
- [ ] PIN fallback UI implemented

### Android Checklist

- [ ] `androidx.biometric.BiometricPrompt` imported
- [ ] `BiometricManager.canAuthenticate(BIOMETRIC_STRONG)` check
- [ ] `BiometricPrompt.authenticate()` with `PromptInfo`
- [ ] `onAuthenticationSucceeded` callback implemented
- [ ] PIN fallback UI implemented
- [ ] Private key stored in AndroidKeyStore (if needed for transaction biometric later)

### Testing

- [ ] No network requests appear in Charles Proxy / Fiddler during soft lock
- [ ] Passcode unlock works when biometric unavailable
- [ ] App doesn't re-prompt for biometric during same session
- [ ] Logout clears session flag, requires new unlock

---

## Phase 2: Transaction Biometric (With Backend)

### Backend Integration Points

- [ ] Backend provides `/biometric/auth/options` endpoint
- [ ] Backend provides `/biometric/auth/verify` endpoint
- [ ] Backend provides `/biometric/register/options` endpoint
- [ ] Backend provides `/biometric/register/verify` endpoint
- [ ] `/user/topup` accepts `verificationToken` parameter

### Registration Flow (One-Time Setup)

```
1. GET /biometric/register/options → challenge + options
2. Local biometric verification (device prompt)
3. Sign challenge with device private key
4. POST /biometric/register/verify → enrollment confirmation
```

- [ ] User initiates "Register Biometric" for payment
- [ ] Call `GET /biometric/register/options`
- [ ] Show biometric prompt
- [ ] Sign challenge with stored private key
- [ ] POST to `/biometric/register/verify`
- [ ] Store enrollment ID returned from backend

### Transaction Flow (Every Purchase)

```
1. GET /biometric/auth/options → challenge + options
2. Local biometric verification (device prompt)
3. Sign challenge with device private key
4. POST /biometric/auth/verify → verificationToken
5. POST /user/topup + verificationToken
```

- [ ] User initiates purchase (Topup/Airtime)
- [ ] Call `GET /biometric/auth/options` to get backend challenge
- [ ] Show biometric prompt ("Verify to complete purchase")
- [ ] Sign challenge with stored private key
- [ ] POST signature to `/biometric/auth/verify`
- [ ] **CRITICAL**: Receive `verificationToken` from backend
- [ ] Include `verificationToken` in `/user/topup` request
- [ ] Handle fallback to PIN if biometric fails

### iOS Implementation

- [ ] SecKey stored in Secure Enclave for transaction signing
- [ ] `SecKeyCreateSignature()` used to sign challenge
- [ ] Challenge response includes `clientDataJSON`, `authenticatorData`, `signature`
- [ ] Signature format: ECDSA with SHA256
- [ ] Private key accessible only during biometric verification

### Android Implementation

- [ ] Private key stored in AndroidKeyStore with biometric authentication required
- [ ] `Signature.getInstance("SHA256withECDSA")` used for signing
- [ ] Challenge response includes `clientDataJSON`, `authenticatorData`, `signature`
- [ ] Key alias: `com.nexus.biometric.key` (or your app's domain)
- [ ] Private key requires biometric unlock to use

### API Response Handling

- [ ] Parse `verificationToken` from `/biometric/auth/verify` response (JWT format)
- [ ] Validate token expiry before using in transaction
- [ ] Handle 401 "verification failed" gracefully
- [ ] Show clear error messages if signature validation fails

### Testing

- [ ] Backend receives signed challenge in correct WebAuthn format
- [ ] Signature matches corresponding public key registered during enrollment
- [ ] Verification token successfully used in `/user/topup` request
- [ ] Transaction completes after successful biometric verification
- [ ] Biometric verification timeout handled (60 seconds)
- [ ] Concurrent biometric requests don't create race conditions
- [ ] Offline scenario: graceful error when backend unreachable

---

## Fallback: PIN-Based Transaction

### When to Use PIN

- [ ] Biometric unavailable on device
- [ ] Biometric authentication failed 3+ times
- [ ] User prefers PIN over biometric

### Implementation

- [ ] `/user/topup` accepts `pin` parameter (alternative to `verificationToken`)
- [ ] PIN validated locally OR sent to backend (verify with backend team)
- [ ] Clear UI indication that PIN (not biometric) is being used
- [ ] Same transaction flow works with `pin` instead of `verificationToken`

### Request Structure

```
// Biometric option (preferred)
POST /user/topup {
  "amount": 500,
  "productCode": "AIRTIME_MTN",
  "recipientPhone": "08012345678",
  "verificationToken": "jwt_token_xyz"
}

// PIN fallback
POST /user/topup {
  "amount": 500,
  "productCode": "AIRTIME_MTN",
  "recipientPhone": "08012345678",
  "pin": "1234"
}
```

---

## Common Mistakes to Avoid

- [ ] ❌ Making backend call during soft lock (defeats purpose)
- [ ] ❌ Skipping backend verification for transaction biometric (security issue)
- [ ] ❌ Storing private key without encryption
- [ ] ❌ Not implementing PIN fallback
- [ ] ❌ Showing biometric prompt for non-security operations
- [ ] ❌ Reusing old `verificationToken` in multiple transactions
- [ ] ❌ Not handling token expiry
- [ ] ❌ Incorrect WebAuthn response format sent to backend

---

## Network Debugging

### Tools

- Charles Proxy / Fiddler / mitmproxy - Intercept network calls
- Backend logs - Verify what signatures backend receives
- Local biometric simulator - Test without real device

### Checklist

- [ ] Soft lock: **Zero** network requests
- [ ] Registration: `GET /biometric/register/options` → LOCAL PROMPT → `POST /biometric/register/verify`
- [ ] Transaction: `GET /biometric/auth/options` → LOCAL PROMPT → `POST /biometric/auth/verify` → `POST /user/topup`
- [ ] Challenge encoding: base64 format for backend
- [ ] Signature format: base64 encoded ECDSA signature

### Logs to Check

```
// Registration flow
GET /biometric/register/options
→ Biometric prompt shown to user
→ Challenge signed locally
POST /biometric/register/verify
→ Enrollment confirmed

// Transaction flow
GET /biometric/auth/options
→ Biometric prompt shown to user
→ Challenge signed locally
POST /biometric/auth/verify
→ verificationToken received
POST /user/topup
→ Transaction processed
```

---

## Reference: Web Frontend Implementation

To match intended behavior exactly, reference:

- `src/services/biometric.service.ts` - API contracts
- `src/hooks/useBiometric.ts` - Hook patterns
- `src/components/features/checkout/BiometricVerificationModal.tsx` - UI flow
- `src/services/topup.service.ts` - Transaction API
- `docs/MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md` - Full integration guide

---

## Validation Checklist Before Shipping

### Soft Lock Validation

- [ ] No Charles Proxy calls during app unlock
- [ ] Biometric fails gracefully (shows PIN prompt)
- [ ] Logout properly clears session
- [ ] Device rotation handled correctly

### Transaction Biometric Validation

- [ ] All biometric responses match WebAuthn format
- [ ] Backend successfully verifies signatures
- [ ] Verification tokens expire after use
- [ ] PIN fallback works identically to web
- [ ] Error messages clear and helpful

### Cross-Platform Validation

- [ ] iOS and Android behavior identical from UX perspective
- [ ] Same enrollment and transaction flow
- [ ] Same error handling and fallbacks
- [ ] Backend receives identical request formats

---

## Support

Questions? Check:

1. [MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md](MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md) - Full technical guide
2. Backend team - Confirm endpoint formats and response structures
3. Web team - Review web implementation for exact UX flow
4. Security team - Validate cryptographic implementation
