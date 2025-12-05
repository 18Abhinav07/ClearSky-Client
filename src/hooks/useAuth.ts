/**
 * useAuth Hook
 *
 * Simplified authentication flow:
 * 1. CDP Email Authentication → Wallet Creation
 * 2. Send wallet address to backend → Get tokens
 */

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAuthStore } from "../app/store/authStore";
import { useDeviceStore } from "../app/store/deviceStore";
import {
  loginWithWallet,
  storeTokens,
  clearTokens,
} from "../services/api/auth.service";
import { getUserDevices } from "../services/api/device.service";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, tokens, devices, setAuth, clearAuth } =
    useAuthStore();

  const { setDevices, clearDevices, setLoading: setDevicesLoading, setError: setDevicesError } = useDeviceStore();

  /**
   * Complete device registration flow
   * Called AFTER CDP authentication is complete and wallet is available
   *
   * Enhanced Process (Following Sequence Diagram):
   * 1. Send wallet address to backend via POST /auth/login
   * 2. Backend returns tokens
   * 3. Store tokens and update auth state
   * 4. ⚡ SMART LANDING LOGIC: Immediately fetch user devices
   * 5. Determine UI mode based on device count (Mode 0/1/3)
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

      // STEP 1-2: Call backend to login/register with wallet address
      const response = await loginWithWallet(address);

      console.log("[Auth] Login successful!");
      console.log("[Auth] Tokens received");

      // STEP 3: Store tokens and update auth state
      storeTokens(response.tokens);
      setAuth({
        ...response,
        walletAddress: address,
      });

      // ⚡ STEP 4-5: SMART LANDING PAGE LOGIC
      // Immediately fetch devices to determine UI mode
      console.log("[Auth] 🔥 Triggering Smart Landing Page logic...");
      await fetchUserDevicesAndDetermineMode();

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
   * Smart Landing Page Logic
   * Fetches user devices and automatically determines UI mode
   *
   * From Sequence Diagram Step 2-3:
   * - GET /devices (with Bearer token)
   * - Returns { count: N, limit_reached: bool, devices: [...] }
   * - Auto-calculate Mode 0/1/3 based on count
   */
  const fetchUserDevicesAndDetermineMode = async () => {
    try {
      console.log("[SmartLanding] Fetching user devices...");
      setDevicesLoading(true);

      const devicesData = await getUserDevices();

      console.log("[SmartLanding] Devices fetched:");
      console.log(`  • Count: ${devicesData.count}`);
      console.log(`  • Limit Reached: ${devicesData.limit_reached}`);

      // Automatically determine UI mode based on count
      setDevices(devicesData);

      // Log determined mode
      const mode = devicesData.count === 0 ? "MODE_0" :
                   devicesData.count < 3 ? "MODE_1" : "MODE_3";
      console.log(`[SmartLanding] UI Mode: ${mode}`);

      if (mode === "MODE_0") {
        console.log("  → UI: Show 'Register First Device' button only");
      } else if (mode === "MODE_1") {
        console.log("  → UI: Show 'Register Device' AND 'Go to Dashboard'");
      } else {
        console.log("  → UI: Show 'Go to Dashboard' only (Register hidden)");
      }

    } catch (err) {
      console.error("[SmartLanding] Failed to fetch devices:", err);
      setDevicesError(err instanceof Error ? err.message : "Failed to fetch devices");
      // Don't throw - allow user to proceed to dashboard
    } finally {
      setDevicesLoading(false);
    }
  };

  /**
   * Logout user and clear all auth data
   * Also disconnects CDP wallet properly
   */
  const logout = () => {
    console.log("[Auth] Logging out...");

    // Clear backend tokens
    clearTokens();

    // Clear auth store
    clearAuth();

    // Clear device store
    clearDevices();

    // Disconnect CDP wallet using wagmi
    disconnect();

    console.log("[Auth] ✅ Logout complete");
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
