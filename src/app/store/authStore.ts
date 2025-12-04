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
        set({
          isAuthenticated: false,
          walletAddress: null,
          tokens: null,
          devices: [],
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
