# 🔧 Biometric Payload Format Debugging Guide

## Your Error Analysis

**Error Message**: `"Length not supported or not well formed"`
**HTTP Status**: 400
**Endpoint**: `POST /biometric/register/verify`

### What Went Wrong

Your mobile app sent a biometric registration response, but the **backend rejected it** because the payload format doesn't match expectations.

From your logs, the payload structure looks correct, but one of these is likely the issue:

1. ❌ `rawId` encoding format (base64 vs base64URL)
2. ❌ `rawId` or `id` length validation
3. ❌ `clientDataJSON` or `attestationObject` malformed
4. ❌ Challenge mismatch in the response

---

## 🔍 Debugging Steps

### Step 1: Verify Base64URL Encoding

**The Problem**: WebAuthn uses **base64URL**, not standard base64.

```javascript
// ❌ WRONG (standard base64)
const standardBase64 =
  "MDAwMDAxOWJlMzRlYjM2OTE2YTEzNGM2YzZlOWM0MDAwMDAwMDAwMDAwMDAwMDAw";

// ✅ CORRECT (base64URL - with - and _ and no padding)
const base64URL = standardBase64
  .replace(/\+/g, "-") // + becomes -
  .replace(/\//g, "_") // / becomes _
  .replace(/=/g, ""); // Remove padding =
```

### Step 2: Check Credential ID Length

Log the decoded length:

```javascript
function decodeBase64URL(str) {
  const binary = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const rawIdBytes = decodeBase64URL(
  "MDAwMDAxOWJlMzRlYjM2OTE2YTEzNGM2YzZlOWM0MDAwMDAwMDAwMDAwMDAwMDAw"
);
console.log("Decoded ID length:", rawIdBytes.length);
console.log(
  "Decoded ID (hex):",
  Array.from(rawIdBytes)
    .map((b) => b.toString(16))
    .join(" ")
);
```

**Valid lengths**:

- Minimum: 4 bytes
- Maximum: 1023 bytes
- Typical: 32-64 bytes for FIDO2 platform authenticators

### Step 3: Verify clientDataJSON Structure

Decode and verify:

```javascript
function decodeJSON(base64urlStr) {
  const binary = atob(base64urlStr.replace(/-/g, "+").replace(/_/g, "/"));
  const json = JSON.parse(binary);
  return json;
}

const clientData = decodeJSON(
  "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiM0dfSnoxTG1ZOVg2OVNwbFA0ZzZnem5CdFpKNE16el8wNUVFWXVJeHlpTSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImNyb3NzT3JpZ2luIjpmYWxzZX0="
);

console.log("Type:", clientData.type); // Must be "webauthn.create"
console.log("Challenge:", clientData.challenge); // Must match backend challenge
console.log("Origin:", clientData.origin); // Must match backend origin
console.log("CrossOrigin:", clientData.crossOrigin); // Should be false for same-origin
```

**Expected clientDataJSON structure:**

```json
{
  "type": "webauthn.create",
  "challenge": "3G_Jz1LmY9X69SplP4g6gznBtZJ4Mzz_05EEYuIxyiM",
  "origin": "http://localhost:3001",
  "crossOrigin": false
}
```

### Step 4: Check Challenge Match

```javascript
// From backend response (when getting options)
const serverChallenge = "3G_Jz1LmY9X69SplP4g6gznBtZJ4Mzz_05EEYuIxyiM";

// From clientDataJSON in registration response
const responseChallenge = "3G_Jz1LmY9X69SplP4g6gznBtZJ4Mzz_05EEYuIxyiM";

if (serverChallenge !== responseChallenge) {
  console.error("❌ Challenge mismatch!");
} else {
  console.log("✅ Challenge matches");
}
```

---

## 🛠️ Mobile Implementation Fixes

### For React Native (Expo)

```typescript
import * as WebAuthn from "@github/webauthn-json";

async function registerBiometric() {
  try {
    // Step 1: Get options from backend
    const optionsResponse = await apiClient.get("/biometric/register/options");
    const options = optionsResponse.data.data;

    console.log("[Register] Got options:", {
      challenge: options.challenge,
      rp: options.rp,
      user: options.user,
    });

    // Step 2: Create credential
    const credential = await WebAuthn.create({
      publicKey: {
        challenge: base64URLtoBuffer(options.challenge),
        rp: options.rp,
        user: {
          id: base64URLtoBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        attestation: "direct",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "preferred",
        },
      },
    });

    console.log("[Register] Credential created:", credential);

    // Step 3: Prepare payload with CORRECT encoding
    const payload = {
      id: credential.id, // Already base64URL from library
      rawId: credential.id, // Same as id
      response: {
        clientDataJSON: credential.response.clientDataJSON, // Already base64URL
        attestationObject: credential.response.attestationObject, // Already base64URL
      },
      type: credential.type,
      deviceName: getDeviceName(),
      platform: Platform.OS.toLowerCase(),
      authenticatorAttachment: credential.authenticatorAttachment,
    };

    console.log("[Register] Sending payload:", {
      ...payload,
      response: {
        clientDataJSON:
          payload.response.clientDataJSON.substring(0, 30) + "...",
        attestationObject:
          payload.response.attestationObject.substring(0, 30) + "...",
      },
    });

    // Step 4: Send to backend
    const verifyResponse = await apiClient.post(
      "/biometric/register/verify",
      payload
    );

    return verifyResponse.data.data;
  } catch (error) {
    console.error("[Register] Error:", error);
    throw error;
  }
}

// Helper: Convert base64URL to ArrayBuffer
function base64URLtoBuffer(base64URL: string): ArrayBuffer {
  const binary = atob(base64URL.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

### For Android (Native)

```kotlin
// Using Fido2 for WebAuthn support

import com.google.android.gms.fido.Fido
import com.google.android.gms.fido.fido2.Fido2PendingIntent
import android.util.Base64

suspend fun registerBiometric() {
    try {
        // Step 1: Get options from backend
        val optionsResponse = apiClient.get("/biometric/register/options")
        val options = optionsResponse.data.data as RegisterOptions

        Log.d("Register", "Got options: ${options.challenge}")

        // Step 2: Create registration request
        val registrationRequest = PublicKeyCredentialCreationOptions(
            challenge = base64URLtoBuffer(options.challenge),
            rp = PublicKeyCredentialRpEntity(
                id = options.rp.id,
                name = options.rp.name
            ),
            user = PublicKeyCredentialUserEntity(
                id = base64URLtoBuffer(options.user.id),
                name = options.user.name,
                displayName = options.user.displayName
            ),
            pubKeyCredParams = options.pubKeyCredParams.map { param ->
                PublicKeyCredentialParameters(
                    type = param.type,
                    alg = param.alg
                )
            },
            attestation = options.attestation ?: "direct",
            authenticatorSelection = AuthenticatorSelectionCriteria(
                authenticatorAttachment = "platform",
                userVerification = "preferred"
            )
        )

        // Step 3: Call Fido2 API
        val fido2Client = Fido.getFido2ApiClient(context)
        val credentialCreationTask = fido2Client.getRegisterPendingIntent(registrationRequest)

        val result = Tasks.await(credentialCreationTask)
        val attestationResponse = result.getRegistrationResponseOrNull()

        if (attestationResponse == null) {
            throw Exception("Registration failed: null response")
        }

        // Step 4: Prepare payload
        val payload = mapOf(
            "id" to attestationResponse.id,
            "rawId" to attestationResponse.rawId,
            "response" to mapOf(
                "clientDataJSON" to attestationResponse.clientDataJSON,
                "attestationObject" to attestationResponse.attestationObject
            ),
            "type" to attestationResponse.type,
            "deviceName" to Build.MODEL,
            "platform" to "android",
            "authenticatorAttachment" to "platform"
        )

        Log.d("Register", "Sending payload with id length: ${payload["id"].toString().length}")

        // Step 5: Send to backend
        val verifyResponse = apiClient.post("/biometric/register/verify", payload)
        return verifyResponse.data.data

    } catch (e: Exception) {
        Log.e("Register", "Error: ${e.message}", e)
        throw e
    }
}

private fun base64URLtoBuffer(base64URL: String): ByteArray {
    val modified = base64URL
        .replace('-', '+')
        .replace('_', '/')
    val padded = when {
        modified.length % 4 == 0 -> modified
        modified.length % 4 == 2 -> modified + "=="
        modified.length % 4 == 3 -> modified + "="
        else -> throw IllegalArgumentException("Invalid base64URL")
    }
    return Base64.decode(padded, Base64.DEFAULT)
}
```

### For iOS (Swift)

```swift
import AuthenticationServices

@available(iOS 14.0, *)
func registerBiometric() async throws {
    // Step 1: Get options from backend
    let optionsResponse = try await apiClient.get("/biometric/register/options")
    let options = optionsResponse.data.data as! [String: Any]

    let challenge = options["challenge"] as! String
    let rp = options["rp"] as! [String: String]
    let user = options["user"] as! [String: Any]

    print("[Register] Got challenge: \(challenge)")

    // Step 2: Convert base64URL to Data
    let challengeData = base64URLtoData(challenge)
    let userIDData = base64URLtoData(user["id"] as! String)

    // Step 3: Create registration request
    let request = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rp["id"]!)
        .createCredentialRegistrationRequest(
            challenge: challengeData,
            name: user["name"] as! String,
            userID: userIDData
        )

    // Step 4: Get credential
    let authController = ASAuthorizationController(authorizationRequests: [request])
    // Set delegate and present...

    // In delegate's didCompleteWithAuthorization:
    if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {
        let attestationObject = credential.attestationObject!
        let clientDataJSON = credential.clientDataJSON!

        // Step 5: Prepare payload
        let payload: [String: Any] = [
            "id": dataToBase64URL(credential.credentialID),
            "rawId": dataToBase64URL(credential.credentialID),
            "response": [
                "clientDataJSON": dataToBase64URL(clientDataJSON),
                "attestationObject": dataToBase64URL(attestationObject)
            ],
            "type": "public-key",
            "deviceName": UIDevice.current.name,
            "platform": "ios",
            "authenticatorAttachment": "platform"
        ]

        print("[Register] Sending payload with id length: \(payload["id"] as? String)??.count)")

        // Step 6: Send to backend
        let verifyResponse = try await apiClient.post("/biometric/register/verify", with: payload)
        return verifyResponse.data.data
    }
}

private func base64URLtoData(_ string: String) -> Data {
    var modified = string
        .replacingOccurrences(of: "-", with: "+")
        .replacingOccurrences(of: "_", with: "/")

    while modified.count % 4 != 0 {
        modified.append("=")
    }

    return Data(base64Encoded: modified)!
}

private func dataToBase64URL(_ data: Data) -> String {
    let base64 = data.base64EncodedString()
    return base64
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .trimmingCharacters(in: CharacterSet(charactersIn: "="))
}
```

---

## 🎯 What to Check in Your Mobile App

1. **Are you using the correct library?**
   - React Native: `@github/webauthn-json` ✅
   - Android: `com.google.android.gms.fido` ✅
   - iOS: `AuthenticationServices` ✅

2. **Is the challenge being base64URL encoded?**
   - Log: `console.log('Challenge:', options.challenge)`
   - Should contain only: `A-Z a-z 0-9 - _`
   - Should NOT contain: `+ / =`

3. **Is the credential ID the right length?**
   - Decode it: `atob(credentialId)`
   - Check length: Should be 32+ bytes

4. **Does clientDataJSON match the backend challenge?**
   - Decode: `JSON.parse(atob(clientDataJSON))`
   - Check: `clientDataJSON.challenge === serverChallenge`

---

## 📝 Backend Validation (For Backend Team)

The error message "Length not supported or not well formed" typically comes from one of these backend validations:

```python
# Example backend validation (pseudocode)

def verify_registration(payload):
    # Check rawId length
    raw_id = base64url_decode(payload['rawId'])
    if len(raw_id) < 4 or len(raw_id) > 1023:
        raise ValidationError("Length not supported or not well formed")

    # Check clientDataJSON format
    client_data = json.loads(base64url_decode(payload['response']['clientDataJSON']))
    if 'challenge' not in client_data or 'origin' not in client_data:
        raise ValidationError("Length not supported or not well formed")

    # Verify challenge
    if client_data['challenge'] != expected_challenge:
        raise ValidationError("Challenge verification failed")

    # Decode attestation object
    attestation = cbor.decode(base64url_decode(payload['response']['attestationObject']))
    if 'fmt' not in attestation or 'attStmt' not in attestation:
        raise ValidationError("Attestation format invalid")
```

---

## ✅ Quick Checklist to Fix the Error

- [ ] Payload contains `id` and `rawId` (both base64URL encoded)
- [ ] `rawId` length is 4-1023 bytes when decoded
- [ ] `clientDataJSON` is valid JSON when decoded
- [ ] `clientDataJSON.type` === `"webauthn.create"`
- [ ] `clientDataJSON.challenge` matches server challenge
- [ ] `clientDataJSON.origin` matches expected origin
- [ ] `attestationObject` is not empty
- [ ] All fields are base64URL encoded (-, \_, no = padding)
- [ ] No circular references in payload
- [ ] Challenge was received from `GET /biometric/register/options` before sending credential

---

## 🔗 References

- [WebAuthn Level 2 Spec](https://w3c.github.io/webauthn/)
- Base64URL RFC: https://tools.ietf.org/html/rfc4648#section-5
- [GitHub WebAuthn JSON](https://github.com/github/webauthn-json) - Recommended library for encoding
