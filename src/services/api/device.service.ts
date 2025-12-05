/**
 * Device Service
 *
 * Handles all device-related API calls following the E2E script pattern
 * Now uses API client with automatic token refresh
 */

import { apiGet, apiPost, apiDelete } from "./apiClient";

export interface Device {
  device_id: string;
  sensor_meta: {
    city: string;
    station: string;
    sensor_types: string[];
  };
  status: string;
  registered_at: string;
}

export interface DevicesResponse {
  count: number;
  limit_reached: boolean;
  devices: Device[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

/**
 * Get user's registered devices
 * This is the KEY API call for Smart Landing Page logic
 *
 * From E2E Step 8:
 * GET /devices
 * Returns: { count: N, limit_reached: bool, devices: [...] }
 *
 * ✨ Auto-refreshes token if expired
 */
export async function getUserDevices(): Promise<DevicesResponse> {
  const response = await apiGet("/api/v1/devices");

  if (!response.ok) {
    throw new Error("Failed to fetch devices");
  }

  const result: ApiResponse<DevicesResponse> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response structure");
}

/**
 * Register a new device
 *
 * From E2E Steps 5-7:
 * POST /devices/register
 * Body: { city_id, station_id, sensor_types: [] }
 *
 * ✨ Auto-refreshes token if expired
 */
export async function registerDevice(deviceData: {
  city_id: string;
  station_id: string;
  sensor_types: string[];
}): Promise<Device> {
  const response = await apiPost("/api/v1/devices/register", deviceData);

  if (!response.ok) {
    const error: ApiResponse = await response.json();
    throw new Error(error.error?.message || "Failed to register device");
  }

  const result: ApiResponse<Device> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response structure");
}

/**
 * Delete a device
 *
 * From E2E Step 11:
 * DELETE /devices/:deviceId
 *
 * ✨ Auto-refreshes token if expired
 */
export async function deleteDevice(deviceId: string): Promise<void> {
  const response = await apiDelete(`/api/v1/devices/${deviceId}`);

  if (!response.ok) {
    throw new Error("Failed to delete device");
  }
}
