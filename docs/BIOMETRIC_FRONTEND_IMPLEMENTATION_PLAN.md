# Biometric Authentication Frontend Implementation Plan

## Overview

Complete plan to implement biometric authentication on the frontend, integrating with the fully-tested backend API (38/38 tests passing).

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
// Mirror backend types from API_DOCUMENTATION.md
export interface BiometricEnrollment {
  id: string;
  userId: string;
  biometricType: "fingerprint" | "face" | "iris";
  deviceId: string;
  deviceName?: string;
  platform: "ios" | "android" | "web";
  isActive: boolean;
  enrolledAt: string;
  lastVerifiedAt?: string;
  verificationCount: number;
  confidenceThreshold: number;
}

export interface BiometricChallenge {
  challengeId: string;
  challenge: string;
  nonce: string;
  expiresIn: number;
}

export interface BiometricVerificationResult {
  jwt: string;
  sessionId: string;
  expiresIn: number;
  refreshToken: string;
}

export interface BiometricAuditLog {
  id: string;
  userId: string;
  actionType: "enroll" | "verify" | "revoke";
  actionStatus: "success" | "failure";
  biometricType?: string;
  deviceId?: string;
  timestamp: string;
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
  BiometricChallenge,
  BiometricVerificationResult,
  BiometricAuditLog,
} from "../types/biometric.types";

export class BiometricApiService {
  private api: AxiosInstance;
  private baseURL =
    process.env.REACT_APP_API_URL || "http://localhost:3000/api/v1";

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true, // For cookie-based auth
    });
  }

  // USER ENDPOINTS

  /**
   * Enroll a new biometric
   * POST /biometric/enroll
   */
  async enrollBiometric(data: {
    biometricType: "fingerprint" | "face" | "iris";
    deviceId: string;
    deviceName?: string;
    platform: "ios" | "android" | "web";
    template: string;
    enrollmentName?: string;
    deviceFingerprint?: string;
  }): Promise<{ enrollmentId: string }> {
    const response = await this.api.post("/biometric/enroll", data);
    return response.data.data;
  }

  /**
   * Request a biometric challenge
   * POST /biometric/challenge
   */
  async requestChallenge(data: {
    enrollmentId: string;
    deviceId: string;
    platform: "ios" | "android" | "web";
    deviceFingerprint?: string;
  }): Promise<BiometricChallenge> {
    const response = await this.api.post("/biometric/challenge", data);
    return response.data.data;
  }

  /**
   * Verify biometric and get JWT
   * POST /biometric/verify
   */
  async verifyBiometric(data: {
    challengeId: string;
    confidenceScore: number;
    verificationMethod?: string;
    deviceFingerprint?: string;
  }): Promise<BiometricVerificationResult> {
    const response = await this.api.post("/biometric/verify", data);
    return response.data.data;
  }

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
   * Get enrollment details
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

  /**
   * Get audit logs
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

  // ADMIN ENDPOINTS

  /**
   * Admin: Revoke all enrollments for user
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
    activeCount: number;
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

  // Error handling
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

## Phase 4: Native Biometric Integration

### 4.1 Create Biometric Capture Service

Create `/src/services/biometricCapture.service.ts`:

```typescript
import * as React from "react";

export class BiometricCaptureService {
  /**
   * Check if device supports biometrics
   */
  static async isBiometricAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false;
    }
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Get device fingerprint for additional security
   */
  static async getDeviceFingerprint(): Promise<string> {
    const navigator = window.navigator;
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return JSON.stringify(fingerprint);
  }

  /**
   * Capture biometric template
   * MOCK: In production, use native biometric APIs or WebAuthn
   */
  static async captureBiometric(
    type: "fingerprint" | "face" | "iris",
    options?: { timeout?: number }
  ): Promise<string> {
    // For web: Use WebAuthn API
    // For mobile: Use react-native-biometrics

    // Mock template for demo
    return `${type}-template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Request biometric verification
   * Returns confidence score
   */
  static async verifyBiometric(
    challenge: string,
    type: "fingerprint" | "face" | "iris",
    options?: { timeout?: number }
  ): Promise<{ template: string; confidenceScore: number }> {
    // In production, integrate with:
    // - WebAuthn for web
    // - react-native-biometrics for React Native
    // - Platform-specific biometric APIs

    // Mock response
    return {
      template: `${type}-template-${Date.now()}`,
      confidenceScore: 0.98 + Math.random() * 0.02, // 0.98-1.0
    };
  }

  /**
   * Get platform and device info
   */
  static getPlatformInfo() {
    const ua = navigator.userAgent;
    let platform: "ios" | "android" | "web" = "web";

    if (/iPad|iPhone|iPod/.test(ua)) {
      platform = "ios";
    } else if (/Android/.test(ua)) {
      platform = "android";
    }

    return {
      platform,
      deviceId: this.getOrCreateDeviceId(),
      deviceName: navigator.userAgent.split(" ")[0],
    };
  }

  /**
   * Get or create unique device ID
   */
  static getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem("biometric_device_id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("biometric_device_id", deviceId);
    }
    return deviceId;
  }
}
```

---

## Phase 5: UI Components

### 5.1 Enrollment Flow Component

Create `/src/components/BiometricEnrollment.tsx`:

```typescript
import React, { useState } from 'react';
import { useBiometricStore } from '../store/biometricStore';
import { BiometricCaptureService } from '../services/biometricCapture.service';
import { toast } from 'react-toastify';

export const BiometricEnrollment: React.FC = () => {
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'iris'>('fingerprint');
  const [loading, setLoading] = useState(false);
  const enrollBiometric = useBiometricStore((state) => state.enrollBiometric);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      // Check device support
      const available = await BiometricCaptureService.isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric not available on this device');
      }

      // Capture biometric
      const template = await BiometricCaptureService.captureBiometric(biometricType);
      const platformInfo = BiometricCaptureService.getPlatformInfo();
      const fingerprint = await BiometricCaptureService.getDeviceFingerprint();

      // Call API
      const enrollmentId = await enrollBiometric({
        biometricType,
        template,
        ...platformInfo,
        enrollmentName: `${biometricType} - ${new Date().toLocaleDateString()}`,
        deviceFingerprint: fingerprint,
      });

      toast.success('Biometric enrolled successfully!');
    } catch (error) {
      toast.error(error.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enrollment-container">
      <h2>Enroll Biometric</h2>
      <select
        value={biometricType}
        onChange={(e) => setBiometricType(e.target.value as any)}
        disabled={loading}
      >
        <option value="fingerprint">Fingerprint</option>
        <option value="face">Face</option>
        <option value="iris">Iris</option>
      </select>
      <button onClick={handleEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll Biometric'}
      </button>
    </div>
  );
};
```

### 5.2 Verification/Login Component

Create `/src/components/BiometricVerification.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useBiometricStore } from '../store/biometricStore';
import { BiometricCaptureService } from '../services/biometricCapture.service';
import { biometricApi } from '../services/biometricApi.service';
import { toast } from 'react-toastify';

export const BiometricVerification: React.FC<{
  enrollmentId: string;
  onSuccess?: (jwt: string) => void;
}> = ({ enrollmentId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);

  useEffect(() => {
    requestChallenge();
  }, [enrollmentId]);

  const requestChallenge = async () => {
    try {
      const platformInfo = BiometricCaptureService.getPlatformInfo();
      const challengeData = await biometricApi.requestChallenge({
        enrollmentId,
        ...platformInfo,
      });
      setChallenge(challengeData);
    } catch (error) {
      toast.error('Failed to request challenge');
    }
  };

  const handleVerify = async () => {
    if (!challenge) return;

    setLoading(true);
    try {
      // Capture and verify biometric
      const { template, confidenceScore } = await BiometricCaptureService.verifyBiometric(
        challenge.challenge,
        'fingerprint' // Or dynamic based on enrollment
      );

      // Send verification
      const result = await biometricApi.verifyBiometric({
        challengeId: challenge.challengeId,
        confidenceScore,
      });

      // Store JWT
      localStorage.setItem('accessToken', result.jwt);
      biometricApi.setAuthToken(result.jwt);

      toast.success('Verification successful!');
      onSuccess?.(result.jwt);
    } catch (error) {
      toast.error(error.message || 'Verification failed');
      // Request new challenge
      await requestChallenge();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <h2>Biometric Login</h2>
      <p>Place your finger on the sensor</p>
      <button onClick={handleVerify} disabled={loading || !challenge}>
        {loading ? 'Verifying...' : 'Verify Biometric'}
      </button>
    </div>
  );
};
```

### 5.3 Management/Settings Component

Create `/src/components/BiometricManagement.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useBiometricStore } from '../store/biometricStore';
import { toast } from 'react-toastify';

export const BiometricManagement: React.FC = () => {
  const { enrollments, loading, fetchEnrollments, revokeEnrollment } = useBiometricStore();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleRevoke = async (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to revoke this biometric?')) {
      try {
        await revokeEnrollment(enrollmentId);
        toast.success('Biometric revoked');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="biometric-management">
      <h2>Your Biometric Enrollments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : enrollments.length === 0 ? (
        <p>No biometric enrollments yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Device</th>
              <th>Enrolled</th>
              <th>Last Used</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>{enrollment.biometric_type}</td>
                <td>{enrollment.device_name}</td>
                <td>{new Date(enrollment.enrolled_at).toLocaleDateString()}</td>
                <td>
                  {enrollment.last_verified_at
                    ? new Date(enrollment.last_verified_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td>
                  <button
                    onClick={() => handleRevoke(enrollment.id)}
                    className="btn-danger"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
import { BiometricEnrollment } from '../components/BiometricEnrollment';
import { BiometricVerification } from '../components/BiometricVerification';
import { BiometricManagement } from '../components/BiometricManagement';

export const biometricRoutes = [
  {
    path: '/settings/biometric',
    element: <BiometricManagement />,
    label: 'Biometric Settings',
  },
  {
    path: '/biometric/enroll',
    element: <BiometricEnrollment />,
    label: 'Enroll Biometric',
  },
  {
    path: '/biometric/login',
    element: <BiometricVerification enrollmentId="..." />,
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

- ✅ All 38 backend tests passing
- ✅ Frontend components render without errors
- ✅ Enrollment flow works end-to-end
- ✅ Verification/login flow works end-to-end
- ✅ Management UI displays enrollments
- ✅ Revocation removes enrollments
- ✅ Audit logs display correctly
- ✅ Error handling displays proper messages
- ✅ Security measures implemented
- ✅ Mobile responsiveness tested

---

## Next Steps

1. **Start Phase 1**: Install dependencies
2. **Follow the implementation order**: Each phase builds on the previous
3. **Test incrementally**: Don't wait until the end
4. **Reference API docs**: `/workspace/API_DOCUMENTATION.md` for endpoint details
5. **Review backend code**: Check controller implementations for expected data structures
