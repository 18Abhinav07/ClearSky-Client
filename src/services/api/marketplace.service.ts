/**
 * Marketplace API Service
 *
 * MOCK IMPLEMENTATION - Replace with real API calls
 * All endpoints and payloads are documented for easy replacement
 */

import { env } from "../../config/env";
import { getStoredTokens } from "./auth.service";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SearchRequest {
  city: string;           // "Mumbai", "Delhi", "Bangalore"
  type: string;           // "PM25", "PM10", "CO2", "NO2"
  start_date: string;     // ISO date: "2025-01-01"
  end_date: string;       // ISO date: "2025-01-07"
}

export interface RawBatch {
  batchId: string;
  url: string;
  size: string;
  recordCount: number;
  timeRange: {
    start: string;
    end: string;
  };
}

// Backend Derivative type (aligned with backend schema)
export interface RefinedReport {
  derivative_id: string;  // Primary key
  type: "DAILY" | "MONTHLY";
  parent_data_ids: string[];
  content: string;  // Full AI-generated report
  processing: {
    content_hash?: string;
    ipfs_uri?: string;
    ipfs_hash?: string;
    picked_at?: string;
    processed_at?: string;
  };
  ip_id: string | null;  // Null until minted by backend
  token_id: string | null;  // Null until minted by backend
  licenseTermsId?: string;  // License terms ID from Story Protocol
  is_minted: boolean;
  created_at: string;
  updated_at?: string;

  // Enriched by backend
  primitive_data?: Array<{
    reading_id: string;
    owner_id: string;
    aqi?: number;
    timestamp?: string;
  }>;

  // Frontend display fields (parse from content or generate)
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  price_wip?: string;  // For display, actual pricing handled by backend
}

export interface SearchResponse {
  raw_batches: RawBatch[];
  refined_report: RefinedReport | null;
}

export interface DerivativeAsset {
  _id: string;
  creator_wallet: string;
  parent_asset_id: string;
  parent_ip_id: string;
  child_ip_id: string;
  child_token_id: string;
  title: string;
  description: string;
  derivative_type: string;
  content_uri: string;
  ipfs_hash: string;
  price: number;
  creator_rev_share: number;
  is_listed: boolean;
  total_sales: number;
  total_revenue: number;
  license_terms_id: string;
  user_derivative_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// ============================================================================
// API ENDPOINTS (PRODUCTION)
// ============================================================================



// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_RAW_BATCHES: RawBatch[] = [
  {
    batchId: "batch_001",
    url: "https://clearsky-data.s3.amazonaws.com/raw/mumbai-pm25-jan-2025.csv",
    size: "2.5 MB",
    recordCount: 10080,
    timeRange: {
      start: "2025-01-01T00:00:00Z",
      end: "2025-01-07T23:59:59Z"
    }
  },
  {
    batchId: "batch_002",
    url: "https://clearsky-data.s3.amazonaws.com/raw/mumbai-pm25-dec-2024.csv",
    size: "3.1 MB",
    recordCount: 14880,
    timeRange: {
      start: "2024-12-01T00:00:00Z",
      end: "2024-12-31T23:59:59Z"
    }
  }
];

const MOCK_REFINED_REPORT: RefinedReport = {
  status: "MINTED",
  ipId: "0x1234567890abcdef1234567890abcdef12345678",
  licenseTermsId: "5",
  price_wip: "50",
  title: "Mumbai PM2.5 Air Quality Analysis - January 2025",
  description: "AI-generated comprehensive analysis of PM2.5 levels across Mumbai metropolitan area. Includes trend analysis, peak pollution hours, and health impact assessment.",
  thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/thumbnails/mumbai-jan-2025.png"
};

const MOCK_DERIVATIVES: DerivativeAsset[] = [
  {
    childIpId: "0xabcdef1234567890abcdef1234567890abcdef12",
    parentIpId: "0x1234567890abcdef1234567890abcdef12345678",
    creatorAddress: "0x9876543210fedcba9876543210fedcba98765432",
    metadata: {
      title: "Mumbai Air Quality Visualization - 3D Art",
      description: "Interactive 3D visualization of PM2.5 data transformed into artistic representation",
      type: "creative_derivative",
      thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/derivatives/3d-viz-001.png"
    },
    licenseTermsId: "5",
    price_wip: "25",
    createdAt: "2025-01-15T10:30:00Z"
  },
  {
    childIpId: "0xdef1234567890abcdef1234567890abcdef12345",
    parentIpId: "0x1234567890abcdef1234567890abcdef12345678",
    creatorAddress: "0x5432109876fedcba5432109876fedcba54321098",
    metadata: {
      title: "Remix: Mumbai AQI Musical Composition",
      description: "Audio composition where PM2.5 levels control musical notes and rhythm",
      type: "remix",
      thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/derivatives/audio-viz-001.png"
    },
    licenseTermsId: "5",
    price_wip: "30",
    createdAt: "2025-01-16T14:20:00Z"
  },
  {
    childIpId: "0xdef1234567890abcdef1234567890abcdef12345",
    parentIpId: "0x1234567890abcdef1234567890abcdef12345678",
    creatorAddress: "0x5432109876fedcba5432109876fedcba54321098",
    metadata: {
      title: "Remix: Mumbai AQI Musical Composition",
      description: "Audio composition where PM2.5 levels control musical notes and rhythm",
      type: "remix",
      thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/derivatives/audio-viz-001.png"
    },
    licenseTermsId: "5",
    price_wip: "30",
    createdAt: "2025-01-16T14:20:00Z"
  },
  {
    childIpId: "0xdef1234567890abcdef1234567890abcdef12345",
    parentIpId: "0x1234567890abcdef1234567890abcdef12345678",
    creatorAddress: "0x5432109876fedcba5432109876fedcba54321098",
    metadata: {
      title: "Remix: Mumbai AQI Musical Composition",
      description: "Audio composition where PM2.5 levels control musical notes and rhythm",
      type: "remix",
      thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/derivatives/audio-viz-001.png"
    },
    licenseTermsId: "5",
    price_wip: "30",
    createdAt: "2025-01-16T14:20:00Z"
  },
  {
    childIpId: "0xdef1234567890abcdef1234567890abcdef12345",
    parentIpId: "0x1234567890abcdef1234567890abcdef12345678",
    creatorAddress: "0x5432109876fedcba5432109876fedcba54321098",
    metadata: {
      title: "Remix: Mumbai AQI Musical Composition",
      description: "Audio composition where PM2.5 levels control musical notes and rhythm",
      type: "remix",
      thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/derivatives/audio-viz-001.png"
    },
    licenseTermsId: "5",
    price_wip: "30",
    createdAt: "2025-01-16T14:20:00Z"
  }
];

export interface BrowseDerivativesRequest {
  type?: string;
  is_minted?: boolean;
  limit?: number;
  offset?: number;
  creator?: string;
}

// ... (keep existing type definitions for now)

// ============================================================================
// API ENDPOINTS (PRODUCTION)
// ============================================================================

const ENDPOINTS = {
  // Keep SEARCH for now, but it's deprecated
  SEARCH: `${env.API_BASE_URL}/api/v1/marketplace/search`,
  DERIVATIVES: `${env.API_BASE_URL}/api/v1/marketplace/derivatives`,
  CREATE_DERIVATIVE: `${env.API_BASE_URL}/api/v1/marketplace/derivatives/create`,
  COMMUNITY_DERIVATIVES: `${env.API_BASE_URL}/api/v1/marketplace/derivatives/community`,
  PURCHASE_COMMUNITY_DERIVATIVE: (userDerivativeId: string) => `${env.API_BASE_URL}/api/v1/marketplace/derivatives/purchase/${userDerivativeId}`,
} as const;

export interface CreateDerivativeRequest {
  parentAssetId: string;
  title: string;
  description: string;
  derivativeType: string;
  contentUri: string;
  price: number;
  creatorRevShare: number;
}

// ... (keep mock data for now)

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function purchaseCommunityDerivative(userDerivativeId: string, buyerWallet: string) {
  const tokens = getStoredTokens();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const response = await fetch(ENDPOINTS.PURCHASE_COMMUNITY_DERIVATIVE(userDerivativeId), {
    method: "POST",
    headers,
    body: JSON.stringify({ buyerWallet }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || "Failed to purchase community derivative");
  }

  return response.json();
}

export async function createUserDerivative(data: CreateDerivativeRequest) {
  const tokens = getStoredTokens();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const response = await fetch(ENDPOINTS.CREATE_DERIVATIVE, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || "Failed to create derivative");
  }

  return response.json();
}

/**
 * Browse available derivatives in the marketplace.
 * Aligns with the backend's GET /api/v1/marketplace/derivatives endpoint.
 *
 * @param params - Filtering and pagination parameters
 * @returns An array of derivative assets (aliased as RefinedReport for compatibility)
 */
export async function browseMarketplace(params: BrowseDerivativesRequest): Promise<RefinedReport[]> {
  const url = new URL(ENDPOINTS.DERIVATIVES);

  // Add query parameters if they exist
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  // Get authentication token
  const tokens = getStoredTokens();
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers
  });

  if (!response.ok) {
    // Handle specific error codes
    if (response.status === 401) {
      throw new Error("Authentication required. Please connect your wallet.");
    }
    const errorBody = await response.text();
    console.error("Failed to browse marketplace:", errorBody);
    throw new Error(`Failed to browse marketplace. Status: ${response.status}`);
  }

  const result = await response.json();

  // The backend wraps the array in a "data" property
  // The backend's "derivative" objects match the frontend's "RefinedReport" type
  return result.data as RefinedReport[];
}

/**
 * Fetch community-created derivatives from the marketplace.
 * Aligns with the backend's GET /api/v1/marketplace/derivatives/community endpoint.
 *
 * @returns A promise that resolves to a list of DerivativeAsset objects
 */
export async function getCommunityDerivatives(): Promise<DerivativeAsset[]> {
  const url = ENDPOINTS.COMMUNITY_DERIVATIVES;
  const tokens = getStoredTokens();
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to fetch community derivatives:", errorBody);
    throw new Error(`Failed to fetch community derivatives. Status: ${response.status}`);
  }

  const result = await response.json();
  return result.data as DerivativeAsset[];
}


/**
 * @deprecated Use `browseMarketplace` instead. This function is based on a deprecated API design.
 * Search for air quality data and generate refined reports
 *
 * PRODUCTION ENDPOINT: POST /api/v1/marketplace/search
 *
 * BACKEND PROCESS:
 * 1. Fetch raw sensor data matching search criteria
 * 2. Run AI analysis on aggregated data
 * 3. Upload metadata to IPFS
 * 4. Mint IP Asset on Story Protocol
 * 5. Attach PIL license terms with commercialRevShare
 * 6. Return both raw batches and refined report
 *
 * @param params - Search parameters
 * @returns Search results with raw data and refined report
 */
export async function searchMarketplace(params: SearchRequest): Promise<SearchResponse> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const response = await fetch(ENDPOINTS.SEARCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error("Failed to search marketplace");
  }

  return await response.json();
  */

  // MOCK: Return static data
  return {
    raw_batches: MOCK_RAW_BATCHES,
    refined_report: MOCK_REFINED_REPORT
  };
}

/**
 * Fetch derivative assets (community creations)
 *
 * PRODUCTION ENDPOINT: GET /api/v1/marketplace/derivatives?parentIpId={ipId}
 *
 * @param parentIpId - Optional filter by parent IP
 * @returns List of derivative assets
 */
export async function getDerivatives(parentIpId?: string): Promise<DerivativeAsset[]> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const url = parentIpId
    ? `${ENDPOINTS.DERIVATIVES}?parentIpId=${parentIpId}`
    : ENDPOINTS.DERIVATIVES;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch derivatives");
  }

  return await response.json();
  */

  // MOCK: Filter by parent if specified
  if (parentIpId) {
    return MOCK_DERIVATIVES.filter(d => d.parentIpId === parentIpId);
  }

  return MOCK_DERIVATIVES;
}

/**
 * Get refined report details by IP ID
 *
 * PRODUCTION ENDPOINT: GET /api/v1/marketplace/reports/{ipId}
 *
 * @param ipId - IP Asset ID
 * @returns Report details
 */
export async function getReportDetails(ipId: string): Promise<RefinedReport> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const response = await fetch(`${env.API_BASE_URL}/api/v1/marketplace/reports/${ipId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch report details");
  }

  return await response.json();
  */

  // MOCK: Return static data
  return MOCK_REFINED_REPORT;
}
