/**
 * Authentication Store (Zustand)
 *
 * Global state management for authentication
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, DeviceRegistrationResponse } from "../../types/auth.types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      walletAddress: null,
      tokens: null,
      devices: [],
      setAuth: (data: DeviceRegistrationResponse & { walletAddress: string }) => {
        set({
          isAuthenticated: true,
          walletAddress: data.walletAddress,
          tokens: data.tokens,
          devices: data.devices,
        });
      },
      clearAuth: () => {
        // Clear state
        set({
          isAuthenticated: false,
          walletAddress: null,
          tokens: null,
          devices: [],
        });

        // IMPORTANT: Explicitly clear from localStorage to prevent rehydration
        // This fixes the "double logout" bug where persist middleware
        // would restore the old state from localStorage
        localStorage.removeItem("auth-storage");
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
