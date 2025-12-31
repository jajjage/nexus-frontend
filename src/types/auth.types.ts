// ============= Request Types =============
export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber: string;
  fullName?: string;
  referralCode?: string;
}

export type LoginRequest = {
  password: string;
} & ({ email: string; phone?: never } | { email?: never; phone: string });

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
