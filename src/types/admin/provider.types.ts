/**
 * Admin Provider Types
 * Types for payment provider management (PalmPay, Monnify, etc.)
 */

export interface Provider {
  id: string;
  name: string;
  apiBase?: string;
  isActive: boolean;
  config?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface ProviderListResponse {
  providers: Provider[];
}

export interface CreateProviderRequest {
  name: string;
  apiBase?: string;
  webhookSecret?: string;
  isActive?: boolean;
  config?: Record<string, any>;
}

export interface UpdateProviderRequest {
  name?: string;
  apiBase?: string;
  webhookSecret?: string;
  isActive?: boolean;
  config?: Record<string, any>;
}
