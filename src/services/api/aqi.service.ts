/**
 * AQI Service
 *
 * Handles all AQI data ingestion and retrieval operations
 * Strictly follows the 4 API endpoints specified in the requirements
 */

import { apiGet, apiPost } from "./apiClient";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Sensor data structure - key-value pairs of sensor readings
 * Example: { PM2.5: 45, co2: 410, temperature: 25.5, humidity: 60 }
 */
export interface SensorData {
  [sensorType: string]: number;
}

/**
 * AQI Reading from the backend
 */
export interface AqiReading {
  reading_id: string;
  device_id: string;
  timestamp: number; // Unix seconds
  sensor_data: SensorData;
  status: "Pending" | "Verified" | "Failed";
  created_at: string; // ISO timestamp
  verified_at?: string; // ISO timestamp
  ipfs_cid?: string; // IPFS content identifier if verified
}

/**
 * Payload for ingesting new sensor data
 */
export interface IngestDataPayload {
  device_id: string;
  timestamp: number; // Unix seconds
  sensor_data: SensorData;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

/**
 * Response for getDeviceReadings
 */
export interface DeviceReadingsResponse {
  device_id: string;
  total_count: number;
  readings: AqiReading[];
}

/**
 * Response for getReadingsByStatus
 */
export interface ReadingsByStatusResponse {
  status: string;
  total_count: number;
  readings: AqiReading[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 1. Ingest AQI Data
 *
 * POST /api/v1/ingest
 *
 * Sends sensor data from a device to the backend for processing
 * This is the primary action triggered by "Sign & Ingest" button
 *
 * @param payload - Device ID, timestamp, and sensor data
 * @returns The created reading object
 * @throws Error if device ownership verification fails (401/403)
 *
 * ✨ Auto-refreshes token if expired
 */
export async function ingestData(payload: IngestDataPayload): Promise<AqiReading> {
  const response = await apiPost("/api/v1/ingest", payload);

  if (!response.ok) {
    const error: ApiResponse = await response.json();

    // Specific error handling for device ownership
    if (response.status === 401 || response.status === 403) {
      throw new Error("Device ownership verification failed. You do not own this device.");
    }

    throw new Error(error.error?.message || "Failed to ingest data");
  }

  const result: ApiResponse<AqiReading> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response structure");
}

/**
 * 2. Get Device Readings
 *
 * GET /api/v1/device/:device_id/readings
 *
 * Retrieves recent readings for a specific device
 * Called when:
 * - User selects a device in the UI
 * - After successful ingestion to refresh history
 *
 * @param device_Id - The device ID to fetch readings for
 * @param limit - Maximum number of readings to return (default: 10)
 * @returns Device readings with metadata
 *
 * ✨ Auto-refreshes token if expired
 */
export async function getDeviceReadings(
  device_Id: string,
  limit: number = 10
): Promise<DeviceReadingsResponse> {
  const response = await apiGet(`/api/v1/devices/${device_Id}/readings?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to fetch device readings");
  }

  const result: ApiResponse<DeviceReadingsResponse> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response structure");
}

/**
 * 3. Get Readings By Status
 *
 * GET /api/v1/readings/status/:status
 *
 * Retrieves readings filtered by verification status
 * Used for status filter tabs (e.g., showing only 'Pending' vs 'Verified')
 *
 * @param status - Filter by status: "Pending" | "Verified" | "Failed"
 * @param limit - Maximum number of readings to return (default: 20)
 * @returns Readings matching the status filter
 *
 * ✨ Auto-refreshes token if expired
 */
export async function getReadingsByStatus(
  status: "Pending" | "Verified" | "Failed",
  limit: number = 20
): Promise<ReadingsByStatusResponse> {
  const response = await apiGet(`/api/v1/readings/status/${status}?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to fetch readings by status");
  }

  const result: ApiResponse<ReadingsByStatusResponse> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response structure");
}

/**
 * 4. Get Reading By ID
 *
 * GET /api/v1/readings/:reading_id
 *
 * Retrieves full details for a specific reading
 * Called when user clicks a row in the history table
 * Opens a modal with complete reading information
 *
 * @param readingId - The reading ID to fetch
 * @returns Complete reading details
 *
 * ✨ Auto-refreshes token if expired
 */
export async function getReadingById(readingId: string): Promise<AqiReading> {
  const response = await apiGet(`/api/v1/readings/${readingId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch reading details");
  }

  const result: ApiResponse<AqiReading> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response structure");
}

// ============================================================================
// Mock Data Presets for Location/Scenario Selector
// ============================================================================

/**
 * Pre-configured sensor data for different locations/scenarios
 * Used by the UI to quickly populate realistic test data
 */
export const LOCATION_PRESETS: Record<string, { name: string; sensor_data: SensorData }> = {
  mumbai: {
    name: "Mumbai - Moderate Pollution",
    sensor_data: {
      "PM2.5": 65,      // µg/m³ - Moderate
      "pm10": 120,     // µg/m³ - Moderate
      "co2": 425,      // ppm - Normal outdoor
      "temperature": 32.5, // °C - Hot
      "humidity": 75,  // % - High humidity
      "no2": 45,       // ppb - Moderate
      o3: 55,        // ppb - Moderate
    },
  },
  delhi: {
    name: "Delhi - High Pollution",
    sensor_data: {
      "PM2.5": 145,     // µg/m³ - Unhealthy
      "pm10": 280,     // µg/m³ - Unhealthy
      "co2": 450,      // ppm - Slightly elevated
      "temperature": 28.0, // °C - Warm
      "humidity": 60,  // % - Moderate humidity
      "no2": 85,       // ppb - High
      "o3": 95,        // ppb - High
    },
  },
  london: {
    name: "London - Good Air Quality",
    sensor_data: {
      "PM2.5": 18,      // µg/m³ - Good
      "pm10": 35,      // µg/m³ - Good
      "co2": 410,      // ppm - Normal
      "temperature": 15.5, // °C - Cool
      "humidity": 70,  // % - Moderate humidity
      "no2": 25,       // ppb - Low
      "o3": 45,        // ppb - Moderate
    },
  },
  tokyo: {
    name: "Tokyo - Excellent Air Quality",
    sensor_data: {
      "PM2.5": 12,      // µg/m³ - Excellent
      "pm10": 22,      // µg/m³ - Excellent
      "co2": 405,      // ppm - Normal
      "temperature": 22.0, // °C - Pleasant
      "humidity": 55,  // % - Comfortable
      "no2": 20,       // ppb - Low
      "o3": 40,        // ppb - Good
    },
  },
  beijing: {
    name: "Beijing - Very High Pollution",
    sensor_data: {
      "PM2.5": 195,     // µg/m³ - Very Unhealthy
      "pm10": 350,     // µg/m³ - Very Unhealthy
      "co2": 485,      // ppm - Elevated
      "temperature": 25.0, // °C - Moderate
      "humidity": 50,  // % - Moderate
      "no2": 110,      // ppb - Very High
      "o3": 120,       // ppb - Very High
    },
  },
  seattle: {
    name: "Seattle - Good Air Quality",
    sensor_data: {
      "PM2.5": 22,      // µg/m³ - Good
      "pm10": 40,      // µg/m³ - Good
      "co2": 412,      // ppm - Normal
      "temperature": 18.5, // °C - Cool
      "humidity": 65,  // % - Moderate
      "no2": 28,       // ppb - Low
      "o3": 48,        // ppb - Moderate
    },
  },
};
