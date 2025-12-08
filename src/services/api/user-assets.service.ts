import { data } from "react-router-dom";
import { env } from "../../config/env";
import { getStoredTokens } from "./auth.service";

// ============================================================================
// TYPE DEFINITIONS MATCHING BACKEND
// ============================================================================

// Backend Asset schema (from Server/models/Asset.ts)
export interface BackendAsset {
  asset_id: string;
  owner_wallet: string;
  derivative_id: string;
  primitive_data_ids: string[];
  ip_id: string;
  token_id: string;
  purchase_price: number;
  purchase_tx_hash: string;
  royalty_paid_to_original_owner: number;
  platform_fee: number;
  purchased_at: string;
  metadata: {
    derivative_type: "DAILY" | "MONTHLY";
    content_hash: string;
    ipfs_uri: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// For compatibility with existing UI components
export interface PurchasedLicense {
  licenseTokenId: string;  // Maps to token_id
  ipId: string;
  derivativeId: string;
  title: string;
  description: string;
  purchasedAt: string;
  txHash: string;
  canCreateDerivative: boolean;
  parentIpId?: string;
}

export interface OwnedIPAsset {
  ipId: string;
  metadata: {
    title: string;
    description: string;
    thumbnailUrl?: string;
  };
  childrenCount: number;
  totalRevenue: string; // In WIP
  claimableRevenue: string; // In WIP
  childIpIds: string[];
  licenseTermsId: string;
}

export interface PurchaseRecordRequest {
  ipId: string;
  licenseTokenId: string;
  txHash: string;
}

export interface RegisterDerivativeRequest {
  childIpId: string;
  parentIpId: string;
  licenseTokenId: string;
  metadata: {
    title: string;
    description: string;
    type: string;
  };
  txHash: string;
  customPrice?: string; // Optional custom pricing in WIP
}

export interface DownloadRequest {
  ipId: string;
  licenseTokenId: string;
  walletAddress: string;
  signature: string;
  message: string;
}

export interface DownloadResponse {
  downloadUrl: string; // Presigned S3 URL (60s expiry)
}

export interface RoyaltyStatus {
  totalEarned: string;
  claimable: string;
  claimed: string;
  childPayments: Array<{
    childIpId: string;
    amount: string;
    timestamp: string;
  }>;
}

export interface TokenBalance {
  wip: string;
  ip: string;
}

// ============================================================================
// API ENDPOINTS (PRODUCTION)
// ============================================================================

const ENDPOINTS = {
  // ✅ EXISTS: Get user's purchased assets
  USER_ASSETS: (wallet: string) => `${env.API_BASE_URL}/api/v1/marketplace/assets/${wallet}`,
  
  // ✅ EXISTS: Get derivative details (to fetch title/description)
  DERIVATIVE_DETAILS: (derivativeId: string) => `${env.API_BASE_URL}/api/v1/marketplace/derivatives/${derivativeId}`,
  
  // ✅ EXISTS: Download derivative content (requires JWT auth)
  DOWNLOAD_DERIVATIVE: (derivativeId: string) => `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`,
  
  // ❌ MISSING: User creations endpoint
  USER_CREATIONS: `${env.API_BASE_URL}/api/v1/user/creations`,
  
  // ❌ MISSING: Record purchase notification (not needed with backend purchase flow)
  REGISTER_DERIVATIVE: `${env.API_BASE_URL}/api/v1/assets/register-derivative`,
  
  // ❌ MISSING: Royalty status
  ROYALTY_STATUS: `${env.API_BASE_URL}/api/v1/royalty/status`,
  
  TOKEN_BALANCE: `${env.API_BASE_URL}/api/v1/user/token-balance`,
} as const;

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PURCHASES: PurchasedLicense[] = [
  {
    licenseTokenId: "0x1111111111111111111111111111111111111111",
    ipId: "0x1234567890abcdef1234567890abcdef12345678",
    derivativeId: "deriv_xxx",
    title: "Mumbai PM2.5 Air Quality Analysis - January 2025",
    description: "AI-generated comprehensive analysis of PM2.5 levels",
    purchasedAt: "2025-01-10T08:30:00Z",
    txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    canCreateDerivative: true
  },
  {
    licenseTokenId: "0x2222222222222222222222222222222222222222",
    ipId: "0x5678901234abcdef5678901234abcdef56789012",
    derivativeId: "deriv_yyy",
    title: "Delhi Air Quality Report - December 2024",
    description: "Comprehensive air quality analysis for Delhi NCR region",
    purchasedAt: "2025-01-12T14:20:00Z",
    txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    canCreateDerivative: true
  }
];

const MOCK_CREATIONS: OwnedIPAsset[] = [
  {
    ipId: "0xabcdef1234567890abcdef1234567890abcdef12",
    metadata: {
      title: "My Mumbai Air Quality Visualization",
      description: "Custom 3D visualization of PM2.5 data",
      thumbnailUrl: "https://clearsky-data.s3.amazonaws.com/my-creations/viz-001.png"
    },
    childrenCount: 2,
    totalRevenue: "15.5",
    claimableRevenue: "8.2",
    childIpIds: [
      "0xchild1111111111111111111111111111111111",
      "0xchild2222222222222222222222222222222222"
    ],
    licenseTermsId: "5"
  }
];

/**
 * Get detailed information about a specific derivative.
 * Used to enrich asset display with title/description.
 *
 * @param derivativeId - The derivative ID
 * @returns Derivative details
 */
export async function getDerivativeDetails(derivativeId: string) {
  const url = ENDPOINTS.DERIVATIVE_DETAILS(derivativeId);

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch derivative details`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// DEPRECATED FUNCTIONS
// ============================================================================

/**
 * Get authenticated headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  const tokens = getStoredTokens();
  return {
    "Content-Type": "application/json",
    "Authorization": tokens ? `Bearer ${tokens.access_token}` : ""
  };
}

/**
 * Fetch user's assets from the backend.
 * Aligns with the backend's GET /api/v1/marketplace/assets/:walletAddress endpoint.
 *
 * @param walletAddress The user's wallet address
 * @returns A promise that resolves to a list of backend assets
 */
export async function getUserAssets(walletAddress: string): Promise<BackendAsset[]> {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error("Invalid wallet address format");
  }

  const url = `${env.API_BASE_URL}/api/v1/marketplace/assets/${walletAddress}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Note: JWT auth will be removed by backend engineer
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to fetch user assets:", errorBody);
    throw new Error(`Failed to fetch user assets. Status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch assets");
  }

  // Backend returns { success: true, data: Asset[] }
  return result.data as BackendAsset[];
}


/**
 * @deprecated Use `getUserAssets(walletAddress)` instead.
 * Fetch user's purchased licenses
 *
 * PRODUCTION ENDPOINT: GET /api/v1/user/purchases
 *
 * @returns List of purchased licenses
 */
export async function getUserPurchases(): Promise<PurchasedLicense[]> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // This function is deprecated. The new function is getUserAssets.
  // Returning mock data to avoid breaking components that haven't been updated yet.
  return MOCK_PURCHASES;
}

/**
 * Fetch user's owned IP assets (creations)
 *
 * PRODUCTION ENDPOINT: GET /api/v1/user/creations
 *
 * @returns List of owned IP assets
 */
export async function getUserCreations(): Promise<OwnedIPAsset[]> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const response = await fetch(ENDPOINTS.USER_CREATIONS, {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch creations");
  }

  return await response.json();
  */

  return MOCK_CREATIONS;
}

/**
 * Record a purchase in the backend
 *
 * @deprecated Not needed with backend purchase flow.
 * Backend creates asset records automatically during purchase.
 *
 * MISSING ENDPOINT: POST /api/v1/user/purchases
 */
export async function recordPurchase(data: PurchaseRecordRequest): Promise<void> {
  console.warn("recordPurchase is deprecated. Backend handles asset creation during purchase.");
  // Mock implementation for backward compatibility
  return Promise.resolve();
}

/**
 * Download derivative content.
 * Requires JWT authentication - backend verifies NFT ownership.
 *
 * @param derivativeId - The derivative ID to download
 * @returns Derivative content and metadata
 */
export async function downloadDerivative(derivativeId: string) {
  const tokens = getStoredTokens();
  
  if (!tokens?.access_token) {
    throw new Error("Authentication required. Please log in.");
  }

  const url = `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokens.access_token}`
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("You don't own this asset. Purchase it first.");
    }
    if (response.status === 404) {
      throw new Error("Derivative not found or not yet minted.");
    }
    throw new Error("Download failed");
  }

  const result = await response.json();
  
  return {
    content: result.data.content,
    processing: result.data.processing
  };
}

  console.log("[MOCK] Purchase recorded:", data);


/**
 * Get a secure download URL for a purchased derivative.
 * Aligns with backend's GET /api/v1/marketplace/download/:derivativeId endpoint.
 *
 * @param derivativeId The ID of the derivative to download
 * @returns The presigned download URL
 */
export async function getDownloadUrl(derivativeId: string): Promise<DownloadResponse> {
  const url = `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Access denied - You do not own this asset');
    }
    const errorBody = await response.text();
    console.error('Failed to get download URL:', errorBody);
    throw new Error(`Failed to get download URL. Status: ${response.status}`);
  }

  // Assuming the backend returns a JSON object with a `downloadUrl` property
  return await response.json();
}

/**
 * @deprecated Use `getDownloadUrl` instead. This function uses signature-based auth, which is not what the backend expects for this endpoint.
 * Verify license ownership and get download URL
 *
 * PRODUCTION ENDPOINT: POST /api/v1/access/verify-download
 *
 * @param data - Download request with signature
 * @returns Presigned download URL
 */
export async function verifyAndGetDownloadUrl(data: DownloadRequest): Promise<DownloadResponse> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.warn("[verifyAndGetDownloadUrl] This function is deprecated. Use getDownloadUrl instead.");

  // MOCK: Return fake S3 URL
  return {
    downloadUrl: `https://clearsky-protected-assets.s3.amazonaws.com/refined-reports/${data.ipId}.pdf?signature=mock-signature-123&expires=60`
  };
}

/**
 * Register derivative creation in backend
 *
 * PRODUCTION ENDPOINT: POST /api/v1/assets/register-derivative
 *
 * @param data - Derivative registration data
 */
export async function registerDerivative(data: RegisterDerivativeRequest): Promise<void> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const response = await fetch(ENDPOINTS.REGISTER_DERIVATIVE, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("Failed to register derivative");
  }
  */

  console.log("[MOCK] Derivative registered:", data);
}

/**
 * Get royalty status for an IP asset
 *
 * PRODUCTION ENDPOINT: GET /api/v1/royalty/status/:ipId
 *
 * @param ipId - IP Asset ID
 * @returns Royalty status
 */
export async function getRoyaltyStatus(ipId: string): Promise<RoyaltyStatus> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const response = await fetch(`${ENDPOINTS.ROYALTY_STATUS}/${ipId}`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch royalty status");
  }

  return await response.json();
  */

  // MOCK: Return static data
  return {
    totalEarned: "15.5",
    claimable: "8.2",
    claimed: "7.3",
    childPayments: [
      {
        childIpId: "0xchild1111111111111111111111111111111111",
        amount: "5.0",
        timestamp: "2025-01-15T10:00:00Z"
      },
      {
        childIpId: "0xchild2222222222222222222222222222222222",
        amount: "3.2",
        timestamp: "2025-01-16T14:30:00Z"
      }
    ]
  };
}

/**
 * Get user's token balances (WIP & IP)
 *
 * PRODUCTION ENDPOINT: GET /api/v1/user/token-balance
 *
 * @returns Token balances
 */
export async function getTokenBalance(): Promise<TokenBalance> {
  // MOCK: Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // PRODUCTION CODE (uncomment when backend ready):
  /*
  const response = await fetch(ENDPOINTS.TOKEN_BALANCE, {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch token balance");
  }

  return await response.json();
  */

  // MOCK: Return static data
  return {
    wip: "125.50",
    ip: "0.00" // IP tokens not implemented yet
  };
}
