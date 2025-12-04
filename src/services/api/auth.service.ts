/**
 * Authentication Service
 *
 * Handles all backend API calls for authentication and device management
 */

import { env } from "../../config/env";
import type {
  DeviceRegistrationResponse,
} from "../../types/auth.types";

/**
 * Login/Register user with wallet address
 *
 * Simple flow: After CDP authentication, send wallet address to backend
 * Backend creates user/device if not exists, always returns tokens
 *
 * @param walletPublicKey - The EVM wallet address from CDP
 * @returns Device info, limits, and authentication tokens
 */
export async function loginWithWallet(
  walletPublicKey: string
): Promise<DeviceRegistrationResponse> {
  const response = await fetch(`${env.API_BASE_URL}/login/${walletPublicKey}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Failed to login with wallet");
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
