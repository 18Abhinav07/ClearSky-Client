/**
 * Environment Configuration
 *
 * Replace these values with your actual CDP credentials
 */

export const env = {
  // CDP Configuration
  CDP_PROJECT_ID: import.meta.env.VITE_CDP_PROJECT_ID || "938d7f29-6906-41e7-ae27-aef0ed11a63b",
  CDP_API_BASE_PATH: import.meta.env.VITE_CDP_API_BASE_PATH || "https://api.cdp.coinbase.com",

  // Backend API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",

  // App Configuration
  APP_NAME: "ClearSky",
  APP_LOGO_URL: import.meta.env.VITE_APP_LOGO_URL || "https://picsum.photos/64",
} as const;
