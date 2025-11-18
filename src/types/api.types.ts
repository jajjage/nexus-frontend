// ============= Response Types =============
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============= User Types =============
export interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isSuspended: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  accountNumber: string;
  providerName: string;
  balance: string;
  profilePictureUrl?: string;
  permissions?: string[]; // Optional permissions array
  createdAt: string;
  updatedAt: string;
}

// ============= Token Storage =============
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
