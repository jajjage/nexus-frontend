# Biometric Authentication Implementation Guide

## Overview

This document details the implementation of the WebAuthn-based biometric authentication system in the Nexus Data frontend. It allows users to register their devices (FaceID, TouchID, Windows Hello, etc.) and use them for secure, passwordless login.

## Architecture

The system uses the standard WebAuthn **Options → Verify** flow for both registration and authentication.

### Key Components

1.  **Service Layer**:
    - `src/services/webauthn.service.ts`: A high-level wrapper that handles the browser's `navigator.credentials` API using `@github/webauthn-json`. It abstracts away the complexity of binary/JSON conversion.
    - `src/services/biometric.service.ts`: Handles HTTP communication with the backend API endpoints.

2.  **State Management**:
    - `src/hooks/useBiometric.ts`: Custom React Query hooks (`useBiometricRegistration`, `useBiometricAuthentication`, `useBiometricEnrollments`) that manage the async state of biometric operations.

3.  **UI Components**:
    - `BiometricLoginButton`: A button component used in the login form to trigger biometric authentication.
    - `BiometricPromptModal`: A smart modal that prompts users to enable biometrics after a successful login if they haven't made a choice yet.
    - `BiometricRegistration`: A component for the settings page to manually register a new device.
    - `BiometricManagement`: A list view to manage and revoke registered devices.

## Flows

### 1. Registration (Enrollment)

1.  **Initiate**: User clicks "Register This Device" or "Enable Biometrics".
2.  **Get Options**: Frontend calls `GET /biometric/register/options`. Backend returns a challenge and user info.
3.  **Create Credential**: `WebAuthnService` calls `navigator.credentials.create()` with these options. The browser prompts the user to scan their finger/face.
4.  **Verify**: The browser returns a new public key credential. Frontend sends this to `POST /biometric/register/verify`.
5.  **Success**: Backend stores the public key and links it to the user.

### 2. Authentication (Login)

1.  **Initiate**: User clicks "Biometric Login" on the login page.
2.  **Get Options**: Frontend calls `GET /biometric/auth/options`. Backend returns a challenge.
3.  **Sign Assertion**: `WebAuthnService` calls `navigator.credentials.get()` with these options. User authenticates with their device.
4.  **Verify**: The browser returns a signed assertion. Frontend sends this to `POST /biometric/auth/verify`.
5.  **Success**: Backend validates the signature and returns an auth token (JWT) via HTTP-only cookie. Frontend redirects to dashboard.

## File Structure

```
src/
├── services/
│   ├── biometric.service.ts       # API calls
│   └── webauthn.service.ts        # Browser WebAuthn API wrapper
├── hooks/
│   └── useBiometric.ts            # React Query hooks
├── components/
│   └── features/
│       └── biometric/
│           ├── biometric-login-button.tsx
│           ├── biometric-management.tsx
│           ├── biometric-prompt-modal.tsx
│           └── biometric-registration.tsx
└── types/
    └── biometric.types.ts         # TypeScript interfaces
```

## Troubleshooting

### "User verification failed" or "NotAllowedError"

- **Cause**: The user cancelled the operation or the device timed out.
- **Handling**: We catch this error and suppress the toast notification if it's a cancellation, as it's a normal user action.

### "WebAuthn not supported"

- **Cause**: The device doesn't have a biometric sensor, or the browser doesn't support WebAuthn (e.g., insecure context like non-HTTPS).
- **Handling**: `WebAuthnService.isWebAuthnSupported()` checks for `PublicKeyCredential` availability. The UI hides biometric options if this returns false.

### "Challenge not found" (400 Bad Request)

- **Cause**: The session cookie containing the challenge might be missing or expired.
- **Fix**: Ensure `withCredentials: true` is set in the API client (it is by default in our `api-client.ts`).

## Security Considerations

- **No Biometrics on Server**: The actual fingerprint/face data _never_ leaves the user's device. The server only stores a public key.
- **HTTPS Required**: WebAuthn strictly requires a secure context (HTTPS) or `localhost`.
- **Challenge-Response**: The backend generates a random challenge for every attempt to prevent replay attacks.
