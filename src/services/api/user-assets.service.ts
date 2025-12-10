import { env } from "../../config/env";
import { getStoredTokens } from "./auth.service";
import { type RefinedReport } from "./marketplace.service";

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
  can_create_derivatives: boolean;
  license_token_id: string;
}

// For compatibility with existing UI components
export interface PurchasedLicense {
  assetId: string;
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
  USER_ASSETS: (wallet: string) => `${env.API_BASE_URL}/api/v1/marketplace/assets/${wallet}`,
  DERIVATIVE_DETAILS: (derivativeId: string) => `${env.API_BASE_URL}/api/v1/marketplace/derivatives/${derivativeId}`,
  DOWNLOAD_DERIVATIVE: (derivativeId: string) => `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`,
  MY_CREATED_DERIVATIVES: (wallet: string) => `${env.API_BASE_URL}/api/v1/marketplace/derivatives/my-creations/${wallet}`,
  USER_CREATIONS: `${env.API_BASE_URL}/api/v1/user/creations`,
  REGISTER_DERIVATIVE: `${env.API_BASE_URL}/api/v1/assets/register-derivative`,
  ROYALTY_STATUS: `${env.API_BASE_URL}/api/v1/royalty/status`,
  TOKEN_BALANCE: `${env.API_BASE_URL}/api/v1/user/token-balance`,
} as const;

// ============================================================================
// API FUNCTIONS
// ============================================================================

function getAuthHeaders(): HeadersInit {
  const tokens = getStoredTokens();
  return {
    "Content-Type": "application/json",
    "Authorization": tokens ? `Bearer ${tokens.access_token}` : ""
  };
}

export async function getDerivativeDetails(derivativeId: string) {
  const url = ENDPOINTS.DERIVATIVE_DETAILS(derivativeId);
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch derivative details`);
  }
  const result = await response.json();
  return result.data;
}

export async function getUserAssets(walletAddress: string): Promise<BackendAsset[]> {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error("Invalid wallet address format");
  }

  const url = ENDPOINTS.USER_ASSETS(walletAddress);
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders()
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

  return result.data as BackendAsset[];
}

export async function getUserCreations(walletAddress: string): Promise<RefinedReport[]> {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error("Invalid wallet address format");
  }

  const url = ENDPOINTS.MY_CREATED_DERIVATIVES(walletAddress);
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to fetch user creations:", errorBody);
    throw new Error(`Failed to fetch user creations. Status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch creations");
  }

  return result.data as RefinedReport[];
}

export async function downloadDerivative(derivativeId: string) {
  const tokens = getStoredTokens();
  
  if (!tokens?.access_token) {
    throw new Error("Authentication required. Please log in.");
  }

  const url = ENDPOINTS.DOWNLOAD_DERIVATIVE(derivativeId);
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

export async function getDownloadUrl(derivativeId: string): Promise<DownloadResponse> {
  const url = ENDPOINTS.DOWNLOAD_DERIVATIVE(derivativeId);

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

  return await response.json();
}

export async function getTokenBalance(): Promise<TokenBalance> {
  const url = ENDPOINTS.TOKEN_BALANCE;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch token balance");
  }

  return await response.json();
}
