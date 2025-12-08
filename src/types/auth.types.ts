
import type { Device } from "../services/api/device.service";

export interface AuthChallenge {
  challenge: string;
  nonce: string;
  expiresAt: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  userAgent: string;
}

export interface DeviceRegistrationRequest {
  walletAddress: string;
  signature: string;
  message: string;
  deviceInfo: DeviceInfo;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface DevicesResponse {
  devices: Device[];
  count: number;
  limit_reached: boolean;
}

export interface DeviceRegistrationResponse extends DevicesResponse {
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
