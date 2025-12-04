/**
 * Authentication Service
 *
 * Handles all backend API calls for authentication and device management
 */

import { env } from "../../config/env";
import type {
  AuthChallenge,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
} from "../../types/auth.types";

/**
 * Request a challenge message from the backend
 * This challenge will be signed by the user's wallet to prove ownership
 */
export async function requestChallenge(): Promise<AuthChallenge> {
  const response = await fetch(`${env.API_BASE_URL}/auth/challenge`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to request authentication challenge");
  }

  return response.json();
}

/**
 * Register a new device or login existing user
 * This replaces the old GET /login/:walletPublicKey endpoint
 *
 * The backend will:
 * 1. Verify the signature matches the walletAddress
 * 2. Check if this is a new device or existing user
 * 3. Return tokens and device information
 */
export async function registerDevice(
  request: DeviceRegistrationRequest
): Promise<DeviceRegistrationResponse> {
  const response = await fetch(`${env.API_BASE_URL}/auth/device-register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Device registration failed");
  }

  return response.json();
}

/**
 * Store authentication tokens in localStorage
 */
export function storeTokens(tokens: {
  access_token: string;
  refresh_token: string;
}): void {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

/**
 * Retrieve stored tokens
 */
export function getStoredTokens(): {
  access_token: string;
  refresh_token: string;
} | null {
  const access_token = localStorage.getItem("access_token");
  const refresh_token = localStorage.getItem("refresh_token");

  if (!access_token || !refresh_token) return null;

  return { access_token, refresh_token };
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
