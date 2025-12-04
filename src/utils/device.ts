/**
 * Device Utilities
 *
 * Functions for generating and managing device information
 */

/**
 * Device Utilities
 *
 * Functions for generating and managing device information
 */
import type { DeviceInfo } from "../types/auth.types";

/**
 * Generate a unique device ID
 * In production, you might want to use a more sophisticated approach
 * that persists across sessions using localStorage
 */
export function generateDeviceId(): string {
  const stored = localStorage.getItem("deviceId");
  if (stored) return stored;

  const deviceId = crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
  return deviceId;
}

/**
 * Get device name based on user agent
 */
export function getDeviceName(): string {
  const ua = navigator.userAgent;

  // Browser detection
  let browser = "Unknown Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";

  // OS detection
  let os = "Unknown OS";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    os = "iOS";

  return `${browser} on ${os}`;
}

/**
 * Get complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: generateDeviceId(),
    deviceName: getDeviceName(),
    userAgent: navigator.userAgent,
  };
}
