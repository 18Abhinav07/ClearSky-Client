/**
 * useAuth Hook
 *
 * Combines CDP authentication with signature-based device registration
 * This hook handles the two-step authentication process:
 * 1. CDP Email Authentication → Wallet Creation
 * 2. Message Signing → Device Registration
 */

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useAuthStore } from "../app/store/authStore";
import {
  requestChallenge,
  registerDevice,
  storeTokens,
  clearTokens,
} from "../services/api/auth.service";
import { getDeviceInfo } from "../utils/device";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, tokens, devices, setAuth, clearAuth } =
    useAuthStore();

  /**
   * Complete device registration flow
   * Called AFTER CDP authentication is complete and wallet is available
   *
   * Process:
   * 1. Request challenge from backend
   * 2. Sign challenge with user's CDP wallet
   * 3. Send signature + wallet address to backend
   * 4. Backend verifies signature and registers device
   * 5. Store tokens and update auth state
   */
  const completeDeviceRegistration = async () => {
    if (!address || !isConnected) {
      setError("Wallet not connected. Please complete CDP authentication first.");
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // Step 1: Request challenge from backend
      console.log("Requesting authentication challenge...");
      const challenge = await requestChallenge();

      // Step 2: Sign the challenge message with user's wallet
      console.log("Signing challenge message...");
      const signature = await signMessageAsync({
        message: challenge.challenge,
      });

      // Step 3: Send registration request to backend
      console.log("Registering device...");
      const deviceInfo = getDeviceInfo();
      const response = await registerDevice({
        walletAddress: address,
        signature,
        message: challenge.challenge,
        deviceInfo,
      });

      // Step 4: Store tokens and update auth state
      storeTokens(response.tokens);
      setAuth({
        ...response,
        walletAddress: address,
      });

      console.log("Device registration successful!");
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Device registration failed";
      setError(errorMessage);
      console.error("Device registration error:", err);
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
