/**
 * API Client with Automatic Token Refresh
 *
 * Wraps fetch() to automatically handle:
 * - 401 errors due to expired access tokens
 * - Token refresh using refresh token
 * - Retry of original request with new token
 * - Logout if refresh token is expired
 */

import { env } from "../../config/env";
import { refreshAccessToken, clearTokens } from "./auth.service";

interface FetchWithAuthOptions extends RequestInit {
  skipAuthRefresh?: boolean; // Skip auto-refresh for auth endpoints
}

/**
 * Smart fetch wrapper that handles token expiration automatically
 *
 * How it works:
 * 1. Makes the API request with current access token
 * 2. If receives 401 "jwt expired" error:
 *    - Calls /auth/refresh to get new tokens
 *    - Retries original request with new access token
 * 3. If refresh token is also expired:
 *    - Clears all tokens
 *    - Throws REFRESH_TOKEN_EXPIRED error (app should redirect to login)
 */
export async function fetchWithAuth(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const { skipAuthRefresh, ...fetchOptions } = options;

  // Get current access token
  const accessToken = localStorage.getItem("access_token");

  // Add Authorization header if token exists
  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  // Make initial request
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If not 401, return response as-is
  if (response.status !== 401 || skipAuthRefresh) {
    return response;
  }

  // Check if it's a JWT expired error
  try {
    const errorData = await response.clone().json();

    if (errorData.error?.message === "jwt expired" ||
        errorData.error?.message?.includes("expired")) {

      console.log("[API Client] Access token expired, refreshing...");

      try {
        // Attempt to refresh the token
        const newTokens = await refreshAccessToken();

        console.log("[API Client] ✅ Token refreshed successfully");

        // Retry the original request with new token
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newTokens.access_token}`,
        };

        response = await fetch(url, {
          ...fetchOptions,
          headers: retryHeaders,
        });

        console.log("[API Client] ✅ Original request retried successfully");

        return response;

      } catch (refreshError: any) {
        console.error("[API Client] ❌ Token refresh failed:", refreshError);

        // If refresh token is expired, user needs to login again
        if (refreshError.message === "REFRESH_TOKEN_EXPIRED") {
          console.log("[API Client] Refresh token expired - user needs to login");

          // Clear all auth data
          clearTokens();

          // Redirect to landing page
          window.location.href = "/";
        }

        throw refreshError;
      }
    }
  } catch (error) {
    // If error parsing response, return original 401
    return response;
  }

  return response;
}

/**
 * Helper function for GET requests with auto token refresh
 */
export async function apiGet(endpoint: string): Promise<Response> {
  return fetchWithAuth(`${env.API_BASE_URL}${endpoint}`, {
    method: "GET",
  });
}

/**
 * Helper function for POST requests with auto token refresh
 */
export async function apiPost(endpoint: string, data: any): Promise<Response> {
  return fetchWithAuth(`${env.API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Helper function for DELETE requests with auto token refresh
 */
export async function apiDelete(endpoint: string): Promise<Response> {
  return fetchWithAuth(`${env.API_BASE_URL}${endpoint}`, {
    method: "DELETE",
  });
}
