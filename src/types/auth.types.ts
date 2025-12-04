/**
 * Authentication Types for CDP + Wagmi Integration
 *
 * These types support the two-step authentication flow:
 * 1. CDP Email Authentication (OTP)
 * 2. Message Signing for device registration
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  userAgent: string;
}

export interface AuthChallenge {
  challenge: string;
  nonce: string;
  expiresAt: string;
}

export interface DeviceRegistrationRequest {
  walletAddress: string;
  signature: string;
  message: string;
  deviceInfo: DeviceInfo;
}

export interface Device {
  deviceId: string;
  deviceName: string;
  registeredAt: string;
  lastUsed?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface DeviceRegistrationResponse {
  devices: Device[];
  limited: boolean;
  tokens: AuthTokens;
}

export interface AuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  tokens: AuthTokens | null;
  devices: Device[];
  setAuth: (data: DeviceRegistrationResponse & { walletAddress: string }) => void;
  clearAuth: () => void;
}
