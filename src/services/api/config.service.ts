/**
 * Configuration Service
 *
 * Handles API calls for fetching cities, stations, and sensors
 * Used in the device registration flow
 */

import { env } from "../../config/env";

export interface Sensor {
  sensor_type: string;
  unit: string;
  description: string;
}

export interface Station {
  station_id: string;
  station_name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  owner: string;
  provider: string;
  available_sensors: Sensor[];
}

export interface City {
  city_id: string;
  city_name: string;
  country: string;
  stations: Station[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

/**
 * Fetch all available cities
 * No authentication required
 */
export async function getCities(): Promise<City[]> {
  const response = await fetch(`${env.API_BASE_URL}/api/v1/config/cities`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch cities" }));
    throw new Error(error.message || "Failed to fetch cities");
  }

  const result: ApiResponse<City[]> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Failed to fetch cities");
}

/**
 * Fetch stations for a specific city
 * No authentication required
 */
export async function getStations(cityId: string): Promise<Station[]> {
  const response = await fetch(`${env.API_BASE_URL}/api/v1/config/stations/${cityId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch stations" }));
    throw new Error(error.message || "Failed to fetch stations");
  }

  const result: ApiResponse<Station[]> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Failed to fetch stations");
}

/**
 * Fetch available sensors for a specific station
 * No authentication required
 */
export async function getSensors(stationId: string): Promise<Sensor[]> {
  const response = await fetch(`${env.API_BASE_URL}/api/v1/config/sensors/${stationId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch sensors" }));
    throw new Error(error.message || "Failed to fetch sensors");
  }

  const result: ApiResponse<Sensor[]> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Failed to fetch sensors");
}
