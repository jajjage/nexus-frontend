# Biometric Authentication Frontend Implementation Plan

## Overview

Complete plan to implement WebAuthn-based biometric authentication on the frontend, integrating with the fully-tested backend API (103/103 tests passing). This implementation uses the standard WebAuthn Options → Verify flow for both registration and authentication.

---

## Phase 1: Setup & Dependencies

### 1.1 Install Required Packages

```bash
# Biometric/Device APIs
npm install react-native-biometrics      # For React Native
npm install fingerprint-js               # For browser fingerprinting
npm install webauthn-json               # For WebAuthn support

# State Management (if using Redux/Zustand)
npm install zustand                      # Lightweight state management
# OR
npm install @reduxjs/toolkit react-redux # Full Redux setup

# API Communication
npm install axios                        # HTTP client (ensure >= 1.4.0)
npm install swr                          # Data fetching with caching

# UI Components
npm install @mantine/core @mantine-hooks/use-form  # Form handling
npm install react-toastify               # Toast notifications
npm install react-loading-skeleton       # Loading states

# Security
npm install crypto-js                    # Client-side encryption
npm install jose                         # JWT handling

# Utilities
npm install uuid                         # Generate UUIDs
npm install date-fns                     # Date formatting
```

### 1.2 TypeScript Types Setup

Create `/src/types/biometric.types.ts`:

```typescript
// WebAuthn-based biometric types
export interface PublicKeyCredentialCreationOptions {
  challenge: BufferSource;
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntity;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface PublicKeyCredentialRequestOptions {
  challenge: BufferSource;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface BiometricEnrollment {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  platform: "ios" | "android" | "macos" | "windows" | "web";
  authenticator_attachment: "platform" | "cross-platform";
  is_active: boolean;
  enrolled_at: string;
  last_verified_at?: string;
  verification_count: number;
}

export interface WebAuthnRegistrationResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  type: "public-key";
  deviceName?: string;
  platform?: string;
  authenticatorAttachment?: string;
}

export interface WebAuthnAuthenticationResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
  };
  type: "public-key";
}

export interface BiometricAuditLog {
  id: string;
  user_id: string;
  action_type: "register" | "authenticate" | "revoke" | "update";
  action_status: "success" | "failed" | "blocked";
  enrollment_id?: string | null;
  failure_reason?: string | null;
  created_at: string;
}

export interface RegistrationOptionsResponse {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: string;
  }>;
  timeout?: number;
  attestation?: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    userVerification?: string;
  };
}

export interface AuthenticationOptionsResponse {
  challenge: string;
  rpId?: string;
  timeout?: number;
  userVerification?: string;
  allowCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
}

export interface VerificationResponse {
  enrollmentId: string;
  credentialId: string;
}
```

---

## Phase 2: API Service Layer

### 2.1 Create Biometric API Service

Create `/src/services/biometricApi.service.ts`:

```typescript
import axios, { AxiosInstance } from "axios";
import {
  BiometricEnrollment,
  WebAuthnRegistrationResponse,
  WebAuthnAuthenticationResponse,
  RegistrationOptionsResponse,
  AuthenticationOptionsResponse,
  VerificationResponse,
  BiometricAuditLog,
} from "../types/biometric.types";

export class BiometricApiService {
  private api: AxiosInstance;
  private baseURL =
    process.env.REACT_APP_API_URL || "http://localhost:3000/api/v1";

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
    });
  }

  // ===================================================================
  // REGISTRATION ENDPOINTS (OPTIONS → VERIFY flow)
  // ===================================================================

  /**
   * STEP 1: Get registration options
   * GET /biometric/register/options
   *
   * Returns WebAuthn registration options with challenge
   */
  async getRegistrationOptions(): Promise<RegistrationOptionsResponse> {
    const response = await this.api.get("/biometric/register/options");
    return response.data.data;
  }

  /**
   * STEP 2: Verify registration response
   * POST /biometric/register/verify
   *
   * Sends WebAuthn attestation response and device info
   */
  async verifyRegistration(
    attestationResponse: WebAuthnRegistrationResponse
  ): Promise<VerificationResponse> {
    const response = await this.api.post("/biometric/register/verify", {
      id: attestationResponse.id,
      rawId: attestationResponse.rawId,
      response: attestationResponse.response,
      type: attestationResponse.type,
      deviceName: attestationResponse.deviceName,
      platform: attestationResponse.platform,
      authenticatorAttachment: attestationResponse.authenticatorAttachment,
    });
    return response.data.data;
  }

  // ===================================================================
  // AUTHENTICATION ENDPOINTS (OPTIONS → VERIFY flow)
  // ===================================================================

  /**
   * STEP 1: Get authentication options
   * GET /biometric/auth/options
   *
   * Returns WebAuthn authentication challenge
   */
  async getAuthenticationOptions(): Promise<AuthenticationOptionsResponse> {
    const response = await this.api.get("/biometric/auth/options");
    return response.data.data;
  }

  /**
   * STEP 2: Verify authentication response
   * POST /biometric/auth/verify
   *
   * Sends WebAuthn assertion response for verification
   */
  async verifyAuthentication(
    assertionResponse: WebAuthnAuthenticationResponse
  ): Promise<VerificationResponse> {
    const response = await this.api.post("/biometric/auth/verify", {
      id: assertionResponse.id,
      rawId: assertionResponse.rawId,
      response: assertionResponse.response,
      type: assertionResponse.type,
    });
    return response.data.data;
  }

  // ===================================================================
  // ENROLLMENT MANAGEMENT ENDPOINTS
  // ===================================================================

  /**
   * List user's biometric enrollments
   * GET /biometric/enrollments
   */
  async listEnrollments(): Promise<{
    enrollments: BiometricEnrollment[];
    count: number;
  }> {
    const response = await this.api.get("/biometric/enrollments");
    return response.data.data;
  }

  /**
   * Get specific enrollment details
   * GET /biometric/enrollments/:enrollmentId
   */
  async getEnrollmentDetails(
    enrollmentId: string
  ): Promise<BiometricEnrollment> {
    const response = await this.api.get(
      `/biometric/enrollments/${enrollmentId}`
    );
    return response.data.data;
  }

  /**
   * Revoke an enrollment
   * DELETE /biometric/enrollments/:enrollmentId
   */
  async revokeEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    await this.api.delete(`/biometric/enrollments/${enrollmentId}`, {
      data: { reason },
    });
  }

  // ===================================================================
  // AUDIT LOG ENDPOINTS
  // ===================================================================

  /**
   * Get user's audit logs
   * GET /biometric/audit-log
   */
  async getAuditLog(
    limit = 50,
    offset = 0
  ): Promise<{
    logs: BiometricAuditLog[];
    count: number;
  }> {
    const response = await this.api.get("/biometric/audit-log", {
      params: { limit, offset },
    });
    return response.data.data;
  }

  // ===================================================================
  // ADMIN ENDPOINTS
  // ===================================================================

  /**
   * Admin: Revoke all enrollments for a user
   * POST /admin/biometric/revoke-all
   */
  async adminRevokeAll(userId: string): Promise<{ revokedCount: number }> {
    const response = await this.api.post("/admin/biometric/revoke-all", {
      userId,
    });
    return response.data.data;
  }

  /**
   * Admin: Get user's enrollments
   * GET /admin/biometric/enrollments/:userId
   */
  async adminListEnrollments(userId: string): Promise<{
    userId: string;
    enrollments: BiometricEnrollment[];
    count: number;
    active_count: number;
  }> {
    const response = await this.api.get(
      `/admin/biometric/enrollments/${userId}`
    );
    return response.data.data;
  }

  /**
   * Admin: Get user's audit logs
   * GET /admin/biometric/audit-log/:userId
   */
  async adminGetAuditLog(
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<{
    userId: string;
    logs: BiometricAuditLog[];
    count: number;
  }> {
    const response = await this.api.get(
      `/admin/biometric/audit-log/${userId}`,
      {
        params: { limit, offset },
      }
    );
    return response.data.data;
  }

  /**
   * Admin: Get biometric statistics
   * GET /admin/biometric/stats
   */
  async adminGetStats(hoursBack = 24): Promise<any> {
    const response = await this.api.get("/admin/biometric/stats", {
      params: { hoursBack },
    });
    return response.data.data;
  }

  // ===================================================================
  // AUTH MANAGEMENT
  // ===================================================================

  setAuthToken(token: string) {
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common["Authorization"];
  }
}

export const biometricApi = new BiometricApiService();
```

---

## Phase 3: State Management

### 3.1 Create Zustand Store

Create `/src/store/biometricStore.ts`:

```typescript
import { create } from "zustand";
import {
  BiometricEnrollment,
  BiometricAuditLog,
} from "../types/biometric.types";

interface BiometricState {
  enrollments: BiometricEnrollment[];
  auditLogs: BiometricAuditLog[];
  loading: boolean;
  error: string | null;
  currentChallenge: any | null;

  // Actions
  fetchEnrollments: () => Promise<void>;
  fetchAuditLogs: (limit?: number, offset?: number) => Promise<void>;
  enrollBiometric: (data: any) => Promise<string>;
  verifyBiometric: (data: any) => Promise<any>;
  revokeEnrollment: (enrollmentId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearState: () => void;
}

export const useBiometricStore = create<BiometricState>((set, get) => ({
  enrollments: [],
  auditLogs: [],
  loading: false,
  error: null,
  currentChallenge: null,

  fetchEnrollments: async () => {
    set({ loading: true });
    try {
      const data = await biometricApi.listEnrollments();
      set({ enrollments: data.enrollments, error: null });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchAuditLogs: async (limit = 50, offset = 0) => {
    set({ loading: true });
    try {
      const data = await biometricApi.getAuditLog(limit, offset);
      set({ auditLogs: data.logs, error: null });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  enrollBiometric: async (enrollmentData) => {
    set({ loading: true });
    try {
      const result = await biometricApi.enrollBiometric(enrollmentData);
      // Refresh enrollments
      await get().fetchEnrollments();
      return result.enrollmentId;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  verifyBiometric: async (verificationData) => {
    set({ loading: true });
    try {
      const result = await biometricApi.verifyBiometric(verificationData);
      // Store JWT and update auth
      localStorage.setItem("accessToken", result.jwt);
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  revokeEnrollment: async (enrollmentId: string) => {
    set({ loading: true });
    try {
      await biometricApi.revokeEnrollment(enrollmentId);
      await get().fetchEnrollments();
      set({ error: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setError: (error) => set({ error }),
  clearState: () =>
    set({
      enrollments: [],
      auditLogs: [],
      error: null,
      currentChallenge: null,
    }),
}));
```

---

## Phase 4: WebAuthn Integration Service

### 4.1 Create WebAuthn Service

Create `/src/services/webauthn.service.ts`:

```typescript
import { biometricApi } from "./biometricApi.service";
import {
  RegistrationOptionsResponse,
  AuthenticationOptionsResponse,
  WebAuthnRegistrationResponse,
  WebAuthnAuthenticationResponse,
} from "../types/biometric.types";

/**
 * WebAuthn Service
 * Handles the Options → Verify flow for both registration and authentication
 * Uses the standard Web Authentication API
 */
export class WebAuthnService {
  /**
   * Check if WebAuthn is supported on this device
   */
  static async isWebAuthnSupported(): Promise<boolean> {
    return (
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
    );
  }

  /**
   * REGISTRATION FLOW
   * Step 1: Get registration options from backend
   * Step 2: Create credential using WebAuthn
   * Step 3: Verify credential on backend
   */

  /**
   * Get registration options from backend
   */
  static async getRegistrationOptions(): Promise<RegistrationOptionsResponse> {
    return await biometricApi.getRegistrationOptions();
  }

  /**
   * Create WebAuthn credential (uses the options from step 1)
   */
  static async createCredential(
    options: RegistrationOptionsResponse
  ): Promise<WebAuthnRegistrationResponse> {
    // Convert challenge from string to ArrayBuffer
    const challengeBuffer = this.bufferFromString(options.challenge);
    const userIdBuffer = this.bufferFromString(options.user.id);

    const credentialOptions: CredentialCreationOptions = {
      publicKey: {
        challenge: challengeBuffer,
        rp: options.rp,
        user: {
          id: userIdBuffer,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams as any,
        timeout: options.timeout || 60000,
        attestation: (options.attestation ||
          "direct") as AttestationConveyancePreference,
        authenticatorSelection:
          options.authenticatorSelection as AuthenticatorSelectionCriteria,
      },
    };

    const credential = (await navigator.credentials.create(
      credentialOptions
    )) as any;

    if (!credential) {
      throw new Error("Failed to create WebAuthn credential");
    }

    return {
      id: credential.id,
      rawId: this.bufferToString(credential.rawId),
      response: {
        clientDataJSON: this.bufferToString(credential.response.clientDataJSON),
        attestationObject: this.bufferToString(
          credential.response.attestationObject
        ),
      },
      type: credential.type,
    };
  }

  /**
   * Verify credential on backend
   */
  static async verifyCredential(
    credential: WebAuthnRegistrationResponse,
    deviceInfo?: {
      deviceName?: string;
      platform?: string;
      authenticatorAttachment?: string;
    }
  ) {
    return await biometricApi.verifyRegistration({
      ...credential,
      ...deviceInfo,
    });
  }

  /**
   * AUTHENTICATION FLOW
   * Step 1: Get authentication options from backend
   * Step 2: Sign assertion using WebAuthn
   * Step 3: Verify assertion on backend
   */

  /**
   * Get authentication options from backend
   */
  static async getAuthenticationOptions(): Promise<AuthenticationOptionsResponse> {
    return await biometricApi.getAuthenticationOptions();
  }

  /**
   * Sign assertion using WebAuthn
   */
  static async signAssertion(
    options: AuthenticationOptionsResponse
  ): Promise<WebAuthnAuthenticationResponse> {
    const challengeBuffer = this.bufferFromString(options.challenge);

    const assertionOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: challengeBuffer,
        timeout: options.timeout || 60000,
        rpId: options.rpId,
        userVerification: (options.userVerification ||
          "preferred") as UserVerificationRequirement,
        allowCredentials: options.allowCredentials?.map((cred) => ({
          id: this.bufferFromString(cred.id),
          type: cred.type as CredentialMediationRequirement,
          transports: cred.transports as AuthenticatorTransport[],
        })) as PublicKeyCredentialDescriptor[],
      },
    };

    const assertion = (await navigator.credentials.get(
      assertionOptions
    )) as any;

    if (!assertion) {
      throw new Error("Failed to sign WebAuthn assertion");
    }

    return {
      id: assertion.id,
      rawId: this.bufferToString(assertion.rawId),
      response: {
        clientDataJSON: this.bufferToString(assertion.response.clientDataJSON),
        authenticatorData: this.bufferToString(
          assertion.response.authenticatorData
        ),
        signature: this.bufferToString(assertion.response.signature),
      },
      type: assertion.type,
    };
  }

  /**
   * Verify assertion on backend
   */
  static async verifyAssertion(assertion: WebAuthnAuthenticationResponse) {
    return await biometricApi.verifyAuthentication(assertion);
  }

  /**
   * HELPER METHODS
   */

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static bufferToString(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static bufferFromString(str: string): ArrayBuffer {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get device/platform information
   */
  static getDeviceInfo() {
    const ua = navigator.userAgent;
    let platform: "ios" | "android" | "macos" | "windows" | "web" = "web";

    if (/iPad|iPhone|iPod/.test(ua)) {
      platform = "ios";
    } else if (/Android/.test(ua)) {
      platform = "android";
    } else if (/Mac/.test(ua)) {
      platform = "macos";
    } else if (/Win/.test(ua)) {
      platform = "windows";
    }

    return {
      platform,
      deviceName: this.getDeviceName(),
      userAgent: ua,
    };
  }

  /**
   * Get device name/model
   */
  private static getDeviceName(): string {
    const ua = navigator.userAgent;

    // iPhone
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/iPod/.test(ua)) return "iPod Touch";

    // Android
    if (/Android/.test(ua)) return "Android Device";

    // Desktop
    if (/Macintosh/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";
    if (/Linux/.test(ua)) return "Linux Device";

    return "Unknown Device";
  }

  /**
   * Get or create persistent device ID
   */
  static getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem("webauthn_device_id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("webauthn_device_id", deviceId);
    }
    return deviceId;
  }
}
```

---

## Phase 5: UI Components

### 5.1 Registration/Enrollment Component

Create `/src/components/BiometricRegistration.tsx`:

```typescript
import React, { useState } from 'react';
import { useBiometricStore } from '../store/biometricStore';
import { WebAuthnService } from '../services/webauthn.service';
import { toast } from 'react-toastify';

export const BiometricRegistration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>('');

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Check WebAuthn support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        throw new Error('WebAuthn is not supported on this device');
      }

      // Step 2: Get registration options from backend
      const options = await WebAuthnService.getRegistrationOptions();

      // Step 3: Create WebAuthn credential
      const credential = await WebAuthnService.createCredential(options);

      // Step 4: Get device info
      const deviceInfo = WebAuthnService.getDeviceInfo();

      // Step 5: Verify credential on backend
      const result = await WebAuthnService.verifyCredential(credential, {
        deviceName: deviceName || deviceInfo.deviceName,
        platform: deviceInfo.platform,
        authenticatorAttachment: (credential as any).authenticatorAttachment,
      });

      toast.success(`Device registered successfully! ID: ${result.enrollmentId}`);
      // Refresh enrollments
      const { fetchEnrollments } = useBiometricStore.getState();
      await fetchEnrollments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <h2>Register Biometric Authentication</h2>

      <div className="form-group">
        <label htmlFor="deviceName">Device Name (optional)</label>
        <input
          id="deviceName"
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="e.g., My iPhone, Work Laptop"
          disabled={loading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleRegister}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Registering...' : 'Register Biometric'}
      </button>

      <p className="info-text">
        You will be prompted to authenticate using your device's biometric sensor.
      </p>
    </div>
  );
};
```

### 5.2 Authentication/Login Component

Create `/src/components/BiometricAuthentication.tsx`:

```typescript
import React, { useState } from 'react';
import { WebAuthnService } from '../services/webauthn.service';
import { biometricApi } from '../services/biometricApi.service';
import { toast } from 'react-toastify';

export const BiometricAuthentication: React.FC<{
  onSuccess?: (enrollmentId: string) => void;
}> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Check WebAuthn support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        throw new Error('WebAuthn is not supported on this device');
      }

      // Step 2: Get authentication options from backend
      const options = await WebAuthnService.getAuthenticationOptions();

      // Step 3: Sign assertion using WebAuthn
      const assertion = await WebAuthnService.signAssertion(options);

      // Step 4: Verify assertion on backend
      const result = await WebAuthnService.verifyAssertion(assertion);

      toast.success('Authentication successful!');
      onSuccess?.(result.enrollmentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authentication-container">
      <h2>Biometric Authentication</h2>

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleAuthenticate}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Authenticating...' : 'Authenticate with Biometric'}
      </button>

      <p className="info-text">
        Place your finger on the sensor or look at the camera.
      </p>
    </div>
  );
};
```

### 5.3 Enrollment Management Component

Create `/src/components/BiometricManagement.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useBiometricStore } from '../store/biometricStore';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export const BiometricManagement: React.FC = () => {
  const {
    enrollments,
    loading,
    error,
    fetchEnrollments,
    revokeEnrollment,
  } = useBiometricStore();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleRevoke = async (enrollmentId: string, deviceName: string) => {
    if (window.confirm(`Revoke "${deviceName}"?`)) {
      try {
        await revokeEnrollment(enrollmentId);
        toast.success('Biometric revoked');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to revoke');
      }
    }
  };

  return (
    <div className="management-container">
      <h2>Your Registered Devices</h2>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : enrollments.length === 0 ? (
        <p className="empty-state">No devices registered yet</p>
      ) : (
        <div className="enrollments-list">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="enrollment-card">
              <div className="device-info">
                <h3>{enrollment.device_name}</h3>
                <p className="platform">{enrollment.platform.toUpperCase()}</p>
              </div>

              <div className="enrollment-details">
                <p>
                  <strong>Registered:</strong>{' '}
                  {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true })}
                </p>
                {enrollment.last_verified_at && (
                  <p>
                    <strong>Last Used:</strong>{' '}
                    {formatDistanceToNow(new Date(enrollment.last_verified_at), { addSuffix: true })}
                  </p>
                )}
                <p>
                  <strong>Uses:</strong> {enrollment.verification_count}
                </p>
              </div>

              <div className="actions">
                <button
                  onClick={() => handleRevoke(enrollment.id, enrollment.device_name)}
                  className="btn-danger"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Phase 6: Route Integration

### 6.1 Add Routes

Update your routing file (e.g., `/src/routes/index.tsx`):

```typescript
import { BiometricRegistration } from '../components/BiometricRegistration';
import { BiometricAuthentication } from '../components/BiometricAuthentication';
import { BiometricManagement } from '../components/BiometricManagement';

export const biometricRoutes = [
  {
    path: '/settings/biometric',
    element: <BiometricManagement />,
    label: 'Biometric Devices',
  },
  {
    path: '/biometric/register',
    element: <BiometricRegistration />,
    label: 'Register Biometric',
  },
  {
    path: '/biometric/auth',
    element: <BiometricAuthentication />,
    label: 'Biometric Login',
  },
];
```

---

## Phase 7: Environment Configuration

### 7.1 Create `.env.local`

```
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_ENV=development
REACT_APP_ENABLE_BIOMETRIC=true
```

### 7.2 Update app config `/src/config/app.config.ts`

```typescript
export const appConfig = {
  api: {
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000,
  },
  biometric: {
    enabled: process.env.REACT_APP_ENABLE_BIOMETRIC === "true",
    supportedTypes: ["fingerprint", "face", "iris"],
    timeoutMs: 30000,
    minConfidenceScore: 0.95,
  },
  auth: {
    tokenKey: "accessToken",
    refreshTokenKey: "refreshToken",
  },
};
```

---

## Phase 8: Testing

### 8.1 Create Unit Tests

Create `/src/__tests__/services/biometricApi.test.ts`:

```typescript
import { biometricApi } from "../../services/biometricApi.service";

describe("BiometricApiService", () => {
  beforeEach(() => {
    // Mock axios
  });

  test("should enroll biometric", async () => {
    // Test enrollment
  });

  test("should verify biometric", async () => {
    // Test verification
  });
});
```

### 8.2 E2E Tests

Create `/src/__tests__/e2e/biometric.e2e.ts`:

```typescript
// Use Cypress or Playwright
describe("Biometric Flow", () => {
  test("User should be able to enroll and verify biometric", () => {
    // E2E test flow
  });
});
```

---

## Phase 9: Documentation & Security

### 9.1 Create User Guide

- How to enroll biometric
- How to use biometric login
- How to manage enrollments
- Troubleshooting

### 9.2 Security Best Practices

- Never send raw biometric data to backend
- Use HTTPS only
- Implement rate limiting on frontend
- Store tokens securely (httpOnly cookies if possible)
- Implement challenge-response verification
- Use device fingerprinting for additional security

---

## Implementation Timeline

| Phase     | Task                 | Estimated Time |
| --------- | -------------------- | -------------- |
| 1         | Dependencies & Types | 2 hours        |
| 2         | API Service Layer    | 3 hours        |
| 3         | State Management     | 2 hours        |
| 4         | Native Integration   | 4 hours        |
| 5         | UI Components        | 6 hours        |
| 6         | Route Integration    | 1 hour         |
| 7         | Configuration        | 1 hour         |
| 8         | Testing              | 4 hours        |
| 9         | Documentation        | 2 hours        |
| **Total** |                      | **25 hours**   |

---

## Success Criteria

- ✅ Backend: All 103 tests passing (38 API tests + 14 model tests + services)
- ✅ Frontend: WebAuthn Options → Verify flow implemented
- ✅ Registration: User can register biometric credential
- ✅ Authentication: User can authenticate using registered biometric
- ✅ Management: User can view and revoke biometric enrollments
- ✅ Audit Log: User can view audit trail of biometric actions
- ✅ Error Handling: Proper error messages for all failure scenarios
- ✅ Device Support: Works on Web, iOS, Android, macOS, Windows
- ✅ Security: No raw biometric data stored locally, challenge-response verification
- ✅ UX: Smooth flow with proper loading/error states

## Key Implementation Notes

### WebAuthn Flow Architecture

The implementation uses the standard WebAuthn protocol with the Options → Verify pattern:

**Registration (Enrollment):**

```
User clicks Register → GetOptions (backend) → CreateCredential (browser) → Verify (backend) → Stored
```

**Authentication (Login):**

```
User clicks Login → GetOptions (backend) → SignAssertion (browser) → Verify (backend) → Authenticated
```

### Security Considerations

1. **Never send raw biometric data**: All biometric validation happens on the authenticator (device)
2. **Challenge-Response**: Backend generates random challenges to prevent replay attacks
3. **Credential Storage**: Public keys stored server-side; private keys never leave the device
4. **Counter Validation**: Authenticator counter validates signatures haven't been replayed
5. **Device Binding**: Enrollments tied to specific devices; can't use credentials across devices
6. **Audit Trail**: All actions logged for security review

### Browser Support

- Chrome 67+
- Firefox 60+
- Safari 13+ (iOS 13+)
- Edge 18+

### Platform-Specific Considerations

**Web:**

- Use WebAuthn API directly
- Supports USB security keys and platform authenticators

**iOS:**

- FaceID and Touch ID via WebAuthn
- Requires HTTPS

**Android:**

- Fingerprint via WebAuthn
- Requires HTTPS

**macOS:**

- Touch ID via WebAuthn
- Requires HTTPS

### Error Handling

Common errors to handle:

- `NotSupportedError`: WebAuthn not available
- `InvalidStateError`: Credential already exists
- `SecurityError`: HTTPS required
- `NotAllowedError`: User cancelled / authentication failed
- `TimeoutError`: Operation timed out
