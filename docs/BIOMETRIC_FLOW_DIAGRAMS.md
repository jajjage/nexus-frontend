# Biometric Implementation Flow Diagrams

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXUS DATA APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         SOFT LOCK LAYER                                   │  │
│  │         (Device-Only, NO Backend)                         │  │
│  │                                                           │  │
│  │  Biometric Prompt (Face ID / Fingerprint)               │  │
│  │         ↓                                                 │  │
│  │  Local PIN Check (if biometric fails)                   │  │
│  │         ↓                                                 │  │
│  │  Session Flag Set (no re-prompt)                        │  │
│  │                                                           │  │
│  │  ✓ Access Granted → Normal App Usage                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         TRANSACTION LAYER                                │  │
│  │         (Device + Backend, Security-Critical)            │  │
│  │                                                           │  │
│  │  "Buy Airtime" → Checkout Modal                         │  │
│  │         ↓                                                 │  │
│  │  GET /biometric/auth/options (backend challenge)        │  │
│  │         ↓                                                 │  │
│  │  Biometric Prompt (Face ID / Fingerprint)               │  │
│  │  ┌─ LOCAL, NO BACKEND YET ─┐                            │  │
│  │  └──────────────────────────┘                            │  │
│  │         ↓                                                 │  │
│  │  Sign Challenge with Private Key                        │  │
│  │  (SecKey on iOS, Signature API on Android)              │  │
│  │         ↓                                                 │  │
│  │  POST /biometric/auth/verify (send proof)               │  │
│  │         ↓                                                 │  │
│  │  ← verificationToken (JWT from backend)                 │  │
│  │         ↓                                                 │  │
│  │  POST /user/topup + verificationToken                   │  │
│  │         ↓                                                 │  │
│  │  ✓ Transaction Complete                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
                  BACKEND SERVER
                   (WebAuthn validation,
                    transaction processing)
```

---

## Soft Lock Flow (Device-Only)

```
User Opens App
    ↓
┌─────────────────────────┐
│ Biometric Available?    │
└────┬────────────────────┘
     ├─ YES → Face ID / Fingerprint Prompt
     │          ↓
     │        User Completes Biometric
     │          ↓
     │        ✓ Access Granted
     │
     └─ NO → Show PIN Input Screen
               ↓
             Enter PIN (local verification only)
               ↓
             PIN Correct? → ✓ Access Granted
                           → ✗ Try Again

✓ Session Flag Set
  (app won't re-prompt for biometric during session)

NETWORK CALLS: 0 ❌
```

---

## Transaction Biometric Flow (With Backend)

```
User Initiates Purchase (Buy Airtime)
    ↓
┌────────────────────────────────────────────────────────┐
│ Step 1: Get Backend Challenge                          │
│ GET /biometric/auth/options                            │
└────────────────────────────────────────────────────────┘
    ↓
Response: {
  challenge: "base64_challenge_xyz",
  rpId: "nexus-data.com",
  allowCredentials: [...],
  userVerification: "preferred"
}
    ↓
┌────────────────────────────────────────────────────────┐
│ Step 2: Local Biometric Verification                   │
│ (NO BACKEND CALL)                                      │
│                                                        │
│ Biometric Available? → YES                             │
│ ↓                                                      │
│ Face ID / Fingerprint Prompt                          │
│ ↓                                                      │
│ User Completes Biometric                              │
│ ↓                                                      │
│ Biometric Success                                      │
└────────────────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────────────────┐
│ Step 3: Sign Challenge with Private Key               │
│ (LOCAL OPERATION)                                      │
│                                                        │
│ iOS: SecKeyCreateSignature(privateKey, challenge)    │
│ Android: Signature.getInstance("SHA256withECDSA")    │
│           .sign(challengeData)                        │
└────────────────────────────────────────────────────────┘
    ↓
Signature created (base64 encoded)
    ↓
┌────────────────────────────────────────────────────────┐
│ Step 4: Send Proof to Backend for Verification        │
│ POST /biometric/auth/verify                           │
│                                                        │
│ Body: {                                               │
│   id: "credential_id",                                │
│   rawId: "base64_rawId",                              │
│   response: {                                         │
│     clientDataJSON: "base64_...",                     │
│     authenticatorData: "base64_...",                  │
│     signature: "base64_signature_xyz"                 │
│   },                                                  │
│   type: "public-key"                                  │
│ }                                                      │
└────────────────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────────────────┐
│ Backend: Validate Signature                           │
│ 1. Verify signature matches public key                │
│ 2. Verify challenge in clientDataJSON                 │
│ 3. Verify timestamp within tolerance                  │
│                                                        │
│ ✓ All Checks Passed                                   │
└────────────────────────────────────────────────────────┘
    ↓
Response: {
  verified: true,
  verificationToken: "jwt_token_xyz...",
  expiresIn: 300
}
    ↓
┌────────────────────────────────────────────────────────┐
│ Step 5: Complete Transaction with Token               │
│ POST /user/topup                                       │
│                                                        │
│ Body: {                                               │
│   amount: 500,                                        │
│   productCode: "AIRTIME_MTN",                         │
│   recipientPhone: "08012345678",                      │
│   verificationToken: "jwt_token_xyz..."               │
│ }                                                      │
└────────────────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────────────────┐
│ Backend: Process Transaction                          │
│ 1. Verify token is valid (not expired)                │
│ 2. Verify token belongs to this user                  │
│ 3. Deduct amount from wallet                          │
│ 4. Send airtime to recipient                          │
│ 5. Create transaction record                          │
│                                                        │
│ ✓ Transaction Approved & Complete                     │
└────────────────────────────────────────────────────────┘
    ↓
✓ SUCCESS - Display confirmation to user

NETWORK CALLS: 3 ✅
  1. GET /biometric/auth/options
  2. POST /biometric/auth/verify
  3. POST /user/topup
```

---

## Fallback: PIN-Based Transaction

```
User Initiates Purchase
    ↓
Biometric Available?
    ├─ YES → Try Biometric Flow (as above)
    │        Biometric Failed or Skipped?
    │        ├─ Biometric Failed 3x → Show PIN
    │        └─ User Chose PIN → Show PIN
    │
    └─ NO → Show PIN Input

┌────────────────────────────────────────────────────────┐
│ PIN Entry Screen                                       │
│                                                        │
│ User enters 4-digit PIN                                │
│ ↓                                                      │
│ POST /user/topup                                       │
│   amount: 500                                          │
│   productCode: "AIRTIME_MTN"                          │
│   pin: "1234"                                          │
└────────────────────────────────────────────────────────┘
    ↓
Backend validates PIN and processes transaction
    ↓
✓ SUCCESS - Same result as biometric path

NETWORK CALLS: 1 or 2 (depending on backend PIN validation)
```

---

## Compare: Web vs iOS vs Android

```
┌──────────────────────────────────────────────────────────────┐
│                        WEB FRONTEND                          │
├──────────────────────────────────────────────────────────────┤
│ GET /biometric/auth/options                                  │
│ ↓                                                            │
│ WebAuthn Browser API                                         │
│ (navigator.credentials.get)                                  │
│ ↓                                                            │
│ Browser shows biometric prompt                              │
│ (Face ID / Fingerprint / Windows Hello / etc)               │
│ ↓                                                            │
│ Browser internally signs challenge                          │
│ (no JavaScript access to private key)                       │
│ ↓                                                            │
│ POST /biometric/auth/verify                                 │
│ ↓                                                            │
│ POST /user/topup + verificationToken                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                          iOS NATIVE                          │
├──────────────────────────────────────────────────────────────┤
│ GET /biometric/auth/options                                  │
│ ↓                                                            │
│ LocalAuthentication.framework                               │
│ (LAContext.evaluatePolicy)                                  │
│ ↓                                                            │
│ System shows biometric prompt                               │
│ (Face ID / Touch ID)                                        │
│ ↓                                                            │
│ Your code signs challenge                                   │
│ (SecKeyCreateSignature)                                     │
│ ↓                                                            │
│ POST /biometric/auth/verify                                 │
│ ↓                                                            │
│ POST /user/topup + verificationToken                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        ANDROID NATIVE                        │
├──────────────────────────────────────────────────────────────┤
│ GET /biometric/auth/options                                  │
│ ↓                                                            │
│ androidx.biometric.BiometricPrompt                          │
│ ↓                                                            │
│ System shows biometric prompt                               │
│ (Fingerprint / Face ID / Iris / etc)                        │
│ ↓                                                            │
│ Your code signs challenge                                   │
│ (Signature.getInstance("SHA256withECDSA"))                 │
│ ↓                                                            │
│ POST /biometric/auth/verify                                 │
│ ↓                                                            │
│ POST /user/topup + verificationToken                        │
└──────────────────────────────────────────────────────────────┘

KEY: All three use SAME backend flow, only local biometric differs
```

---

## Error Handling Flows

### Biometric Not Available

```
User Initiates Purchase
    ↓
GET /biometric/auth/options
    ↓
Try Biometric Prompt
    ↓
BiometricPrompt throws: NOT_AVAILABLE
    ↓
┌──────────────────────────────────────────────┐
│ Biometric Fallback Branch                    │
│                                              │
│ Show message: "Biometric unavailable"        │
│ Switch to PIN input                          │
│                                              │
│ User enters PIN → POST /user/topup + pin    │
└──────────────────────────────────────────────┘
    ↓
✓ Transaction completes via PIN
```

### Biometric Failed (User Canceled)

```
User Initiates Purchase
    ↓
GET /biometric/auth/options
    ↓
Biometric Prompt Shows
    ↓
User Cancels or Fails 3x
    ↓
┌──────────────────────────────────────────────┐
│ Failed Biometric Fallback                    │
│                                              │
│ Show message: "Biometric failed"             │
│ Offer: "Use PIN instead?" (button)           │
│                                              │
│ User clicks → PIN input shown                │
│ User enters PIN → POST /user/topup + pin    │
└──────────────────────────────────────────────┘
    ↓
✓ Transaction completes via PIN
```

### Backend Verification Failed

```
Biometric Proof Sent
    ↓
POST /biometric/auth/verify
    ↓
Backend: Signature validation fails
    ↓
Response: 401 Unauthorized / 400 Bad Request
{
  "verified": false,
  "message": "Signature verification failed"
}
    ↓
┌──────────────────────────────────────────────┐
│ User Sees Error Message                      │
│ "Verification failed. Try again or use PIN"  │
│                                              │
│ Options:                                     │
│ - Retry Biometric                            │
│ - Switch to PIN                              │
└──────────────────────────────────────────────┘
```

---

## Network Timeline: Transaction Biometric

```
Timeline                     Action                      Network?
─────────────────────────────────────────────────────────────────
T0:00                    User taps "Buy Airtime"
T0:01  GET /biometric/auth/options                      ✅ CALL 1
       ← Challenge received

T0:02                   Local biometric prompt shown   ✅ LOCAL ONLY
       (Face ID / Fingerprint)

T0:05                   User completes biometric      ✅ LOCAL ONLY

T0:06                   Sign challenge locally         ✅ LOCAL ONLY
       (no network call)

T0:07  POST /biometric/auth/verify                      ✅ CALL 2
       ← verificationToken received

T0:08  POST /user/topup + verificationToken             ✅ CALL 3
       ← transactionId, status, balance

T0:09                   Show success screen

TOTAL TIME: ~9 seconds (depends on backend response time)
NETWORK CALLS: 3
LOCAL PROCESSING TIME: ~4 seconds (most of the user wait time)
```

---

## Key Validation Points

```
For Soft Lock:
✓ Zero network calls captured in Charles Proxy
✓ App grants access after successful biometric/PIN
✓ Session persists without re-prompting
✓ Logout clears session flag

For Transaction Biometric:
✓ Challenge received from backend before local biometric
✓ Local biometric succeeds
✓ Signature sent to backend in correct format
✓ verificationToken received from backend
✓ verificationToken used in /user/topup
✓ Transaction completes successfully
✓ PIN fallback works if biometric fails
✓ Error handling graceful and user-friendly
```

---

## Reference: Expected Response Formats

### GET /biometric/auth/options Response

```json
{
  "challenge": "dG9udHlscWJkdGRkZHliaWdidWhyYnl0YXJidXJ0",
  "rpId": "nexus-data.com",
  "allowCredentials": [
    {
      "id": "Ym9iYmJib2JiYm9iYg==",
      "type": "public-key",
      "transports": ["platform"]
    }
  ],
  "userVerification": "preferred",
  "timeout": 60000
}
```

### POST /biometric/auth/verify Response

```json
{
  "verified": true,
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 300,
  "message": "Authentication successful"
}
```

### POST /user/topup Request (with biometric token)

```json
{
  "amount": 500,
  "productCode": "AIRTIME_MTN",
  "recipientPhone": "08012345678",
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "supplierSlug": "mtn",
  "useCashback": false
}
```

### POST /user/topup Response

```json
{
  "success": true,
  "message": "Topup successful",
  "data": {
    "transactionId": "tx_abc123xyz",
    "status": "completed",
    "amount": 500,
    "balance": 4500,
    "timestamp": "2024-01-22T10:30:45Z"
  }
}
```
