/**
 * Device Service
 *
 * Handles all device-related API calls following the actual backend API spec
 * Now uses API client with automatic token refresh
 */

import { apiGet, apiPost, apiDelete } from "./apiClient";

/**
 * Device object as returned by the backend API
 * Based on actual API spec from /api/v1/device endpoints
 */
export interface Device {
  device_id: string;
  status: string;
  registered_at: string;
  sensor_meta: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    city?: string;
    city_id: string;
    station?: string;
    station_id: string;
    sensor_types: string[]; // e.g., ["PM2.5", "PM10", "CO2"]
  };
}

/**
 * Response from GET /api/v1/device
 */
export interface DevicesResponse {
  devices: Device[];
  device_count: number;
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
 *
 * GET /api/v1/device
 * Returns: { devices: [...], device_count: N }
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
 * POST /api/device/register
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
 * DELETE /api/v1/device/:device_id
 *
 * ✨ Auto-refreshes token if expired
 */
export async function deleteDevice(device_Id: string): Promise<void> {
  const response = await apiDelete(`/api/v1/devices/${device_Id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Device not found or you are not authorized to delete it");
    }
    throw new Error("Failed to delete device");
  }

  const result: ApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to delete device");
  }
}
