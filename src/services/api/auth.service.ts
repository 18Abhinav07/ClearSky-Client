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
  const response = await fetch(`${env.API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wallet_address: walletPublicKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Failed to login with wallet");
  }

  const result = await response.json();

  // Backend returns { success: true, data: {...} }
  // Extract the data object which contains our expected structure
  if (result.success && result.data) {
    return result.data;
  }

  // Fallback if structure is different
  return result;
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
 * Refresh access token using refresh token
 * Called automatically when access token expires
 */
export async function refreshAccessToken(): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  const response = await fetch(`${env.API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    // Refresh token is invalid/expired - user needs to login again
    clearTokens();
    throw new Error("REFRESH_TOKEN_EXPIRED");
  }

  const result = await response.json();

  if (result.success && result.data) {
    // Store new tokens
    storeTokens(result.data);
    return result.data;
  }

  throw new Error("Failed to refresh token");
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
