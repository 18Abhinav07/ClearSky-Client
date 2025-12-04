/**
 * useAuth Hook
 *
 * Simplified authentication flow:
 * 1. CDP Email Authentication → Wallet Creation
 * 2. Send wallet address to backend → Get tokens
 */

import { useState } from "react";
import { useAccount } from "wagmi";
import { useAuthStore } from "../app/store/authStore";
import {
  loginWithWallet,
  storeTokens,
  clearTokens,
} from "../services/api/auth.service";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, tokens, devices, setAuth, clearAuth } =
    useAuthStore();

  /**
   * Complete device registration flow
   * Called AFTER CDP authentication is complete and wallet is available
   *
   * Simplified Process:
   * 1. Send wallet address to backend via GET /login/:walletPublicKey
   * 2. Backend creates user/device if not exists
   * 3. Backend returns tokens, devices, and limits
   * 4. Store tokens and update auth state
   */
  const completeDeviceRegistration = async () => {
    if (!address || !isConnected) {
      setError("Wallet not connected. Please complete CDP authentication first.");
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      console.log("[Auth] Logging in with wallet:", address);

      // Call backend to login/register with wallet address
      const response = await loginWithWallet(address);

      console.log("[Auth] Login successful!");
      console.log("[Auth] Devices:", response.devices);
      console.log("[Auth] Limited:", response.limited);

      // Store tokens and update auth state
      storeTokens(response.tokens);
      setAuth({
        ...response,
        walletAddress: address,
      });

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      console.error("[Auth] Login error:", err);
      throw err;
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Logout user and clear all auth data
   */
  const logout = () => {
    clearTokens();
    clearAuth();
  };

  return {
    // CDP Wallet State
    address,
    isConnected,

    // Auth State
    isAuthenticated,
    tokens,
    devices,

    // Device Registration
    completeDeviceRegistration,
    isRegistering,

    // Error Handling
    error,

    // Actions
    logout,
  };
}
