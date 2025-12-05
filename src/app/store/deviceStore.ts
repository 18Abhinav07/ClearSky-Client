/**
 * Device Store
 *
 * State management for device-related data
 * Determines Smart Landing Page UI mode based on device count
 */

import { create } from "zustand";
import { type Device } from "../../services/api/device.service";

/**
 * UI Modes from Sequence Diagram:
 * - Mode 0: New User (Count == 0) - Show "Register First Device" only
 * - Mode 1: Active User (0 < Count < 3) - Show "Register Device" AND "Go to Dashboard"
 * - Mode 3: Maxed User (Count >= 3) - Show "Go to Dashboard" only (Register hidden)
 */
export type SmartLandingMode = "MODE_0" | "MODE_1" | "MODE_3";

interface DeviceState {
  devices: Device[];
  count: number;
  limitReached: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed: Smart Landing Page Mode
  uiMode: SmartLandingMode;

  // Actions
  setDevices: (data: { devices: Device[]; count: number; limit_reached: boolean }) => void;
  clearDevices: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Determine UI mode based on device count
 * This is the core logic from the State Diagram "count_check" decision node
 */
function calculateUIMode(count: number): SmartLandingMode {
  if (count === 0) {
    return "MODE_0"; // New user - show register button only
  } else if (count > 0 && count < 3) {
    return "MODE_1"; // Active user - show both buttons
  } else {
    return "MODE_3"; // Maxed user - show dashboard button only
  }
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  count: 0,
  limitReached: false,
  isLoading: false,
  error: null,
  uiMode: "MODE_0", // Default to new user mode

  setDevices: (data) =>
    set({
      devices: data.devices,
      count: data.count,
      limitReached: data.limit_reached,
      uiMode: calculateUIMode(data.count), // Automatically calculate UI mode
      error: null,
    }),

  clearDevices: () =>
    set({
      devices: [],
      count: 0,
      limitReached: false,
      uiMode: "MODE_0",
      error: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),
}));
