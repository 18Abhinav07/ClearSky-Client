# Backend Endpoint Analysis & Frontend Alignment

**Date**: December 7, 2025  
**Purpose**: Complete analysis of backend API vs frontend implementation after Gemini's refactoring

---

## Executive Summary

The Gemini implementation attempted to align the frontend with backend APIs but contains **critical mismatches** between:
1. What the backend actually provides
2. How the backend expects purchases to work (backend-minted NFTs)
3. What the frontend is trying to do (Story SDK license minting)

### Key Finding: **ARCHITECTURAL CONFLICT**

**Backend Design**: Backend mints and transfers NFTs to buyers (full on-chain control)  
**Frontend Design**: Frontend mints license tokens via Story SDK (user-controlled)  
**Result**: These are **incompatible** approaches that need reconciliation.

---

## Backend API Endpoints (Actual Implementation)

### ✅ 1. Browse Derivatives
```
GET /api/v1/marketplace/derivatives
```

**Query Parameters** (backend supports):
- `is_minted`: boolean (filter for unminted/minted derivatives)
- `type`: string (filter by "DAILY" or "MONTHLY")
- `limit`: number (pagination, default 50)
- `offset`: number (pagination, default 0)
- `search`: string (not yet implemented in backend)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "derivative_id": "deriv_xxx",
      "type": "MONTHLY",
      "parent_data_ids": ["reading_1", "reading_2"],
      "content": "AI-generated report content",
      "processing": {
        "content_hash": "0x...",
        "ipfs_uri": "ipfs://...",
        "ipfs_hash": "Qm..."
      },
      "ip_id": null,  // Only set after minting
      "token_id": null,  // Only set after minting
      "is_minted": false,
      "created_at": "2025-01-15T10:00:00Z",
      "primitive_data": [  // Enriched by backend
        {
          "reading_id": "reading_1",
          "owner_id": "0x123...",
          "aqi": 150,
          "timestamp": "2025-01-15T08:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 15
  }
}
```

**Frontend Implementation Status**: ✅ CORRECT  
- `browseMarketplace()` function properly calls this endpoint
- Uses correct query parameters

---

### ✅ 2. Get Derivative Details
```
GET /api/v1/marketplace/derivatives/:derivativeId
```

**Response**:
```json
{
  "success": true,
  "data": {
    "derivative_id": "deriv_xxx",
    "type": "MONTHLY",
    "content": "Full AI report...",
    "processing": { ... },
    "primitive_data": [ ... ]
  }
}
```

**Frontend Implementation Status**: ⚠️ NOT USED YET  
- Frontend doesn't have a "derivative details" page
- Would be useful for "View Details" before purchase

---

### ⚠️ 3. Purchase Derivative (CRITICAL CONFLICT)
```
POST /api/v1/marketplace/purchase/:derivativeId
```

**Expected Body**:
```json
{
  "buyerWallet": "0x123..."
}
```

**What Backend Does**:
1. ✅ Validates derivative exists and not yet minted
2. ✅ Fetches primitive data to identify original owner
3. ✅ Calculates pricing (base $100, 10% platform fee, 5% royalty)
4. ✅ **Registers IP Asset on Story Protocol** (backend calls SDK)
5. ✅ **Mints NFT** (backend transaction)
6. ✅ **Transfers NFT to buyer** (backend transaction)
7. ✅ Creates Asset record in MongoDB
8. ✅ Updates buyer's User record (adds to assets array)
9. ✅ Updates Derivative record (sets `is_minted: true`)

**Response**:
```json
{
  "success": true,
  "message": "Purchase successful! NFT minted and transferred.",
  "data": {
    "asset_id": "asset_xxx",
    "ip_id": "0x...",
    "token_id": "123456",
    "mint_tx_hash": "0x...",
    "transfer_tx_hash": "0x...",
    "pricing": {
      "total_paid": 100,
      "platform_fee": 10,
      "original_owner_royalty": 5,
      "original_owner_wallet": "0x..."
    },
    "explorer_links": {
      "mint_tx": "https://explorer.story.foundation/tx/0x...",
      "transfer_tx": "https://explorer.story.foundation/tx/0x..."
    }
  }
}
```

**Frontend Implementation Status**: ❌ **MAJOR CONFLICT**

**Current Frontend Approach** (RefinedReportCard.tsx):
```typescript
// Frontend calls Story SDK directly
const result = await storyClient.buyLicense({
  ipId: report.ipId,
  licenseTermsId: report.licenseTermsId,
  priceWIP: report.price_wip
});
```

**Problem**:
1. Frontend expects `ipId` and `licenseTermsId` to already exist (from browsing)
2. But backend returns `ipId: null` for unminted derivatives
3. Backend mints the NFT itself - frontend shouldn't be calling Story SDK for purchase
4. **These are two completely different purchase flows!**

**Backend Flow**: Backend-controlled minting  
**Frontend Flow**: User-controlled license minting

---

### ✅ 4. Get User Assets
```
GET /api/v1/marketplace/assets/:walletAddress
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "asset_id": "asset_xxx",
      "owner_wallet": "0x123...",
      "derivative_id": "deriv_xxx",
      "primitive_data_ids": ["reading_1", "reading_2"],
      "ip_id": "0x...",
      "token_id": "123456",
      "purchase_price": 100,
      "purchase_tx_hash": "0x...",
      "royalty_paid_to_original_owner": 5,
      "platform_fee": 10,
      "purchased_at": "2025-01-15T12:00:00Z",
      "metadata": {
        "derivative_type": "MONTHLY",
        "content_hash": "0x...",
        "ipfs_uri": "ipfs://..."
      }
    }
  ]
}
```

**Frontend Implementation Status**: ⚠️ PARTIALLY CORRECT

**Current Frontend** (user-assets.service.ts):
```typescript
export async function getUserAssets(walletAddress: string): Promise<PurchasedLicense[]> {
  const url = `${env.API_BASE_URL}/api/v1/marketplace/assets/${walletAddress}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),  // ⚠️ Adds JWT token
  });
  
  const result = await response.json();
  
  // Maps backend Asset to frontend PurchasedLicense type
  return result.data.map((asset: any) => ({
    licenseTokenId: asset.token_id,
    ipId: asset.ip_id,
    derivativeId: asset.derivative_id,
    title: "Unknown",  // ⚠️ Backend doesn't return title
    description: "Unknown",  // ⚠️ Backend doesn't return description
    purchasedAt: asset.purchased_at,
    txHash: asset.purchase_tx_hash,
    canCreateDerivative: true
  }));
}
```

**Issues**:
1. ⚠️ Backend returns `Asset` objects, not `PurchasedLicense` objects
2. ⚠️ Backend Asset doesn't include derivative title/description
3. ⚠️ Frontend needs to fetch derivative details separately OR backend should include them
4. ⚠️ JWT token requirement (will be removed per your note)

---

### ⚠️ 5. Download Derivative
```
GET /api/v1/marketplace/download/:derivativeId
Headers: Authorization: Bearer <JWT>
```

**What Backend Does**:
1. ✅ Extracts wallet address from JWT token
2. ✅ Fetches derivative by ID
3. ✅ Verifies derivative is minted
4. ✅ **Calls Story Protocol to verify NFT ownership** (on-chain check)
5. ✅ Returns derivative content if owner matches

**Response**:
```json
{
  "success": true,
  "message": "Ownership verified. Download access granted.",
  "data": {
    "content": "Full AI report text...",
    "processing": {
      "content_hash": "0x...",
      "ipfs_uri": "ipfs://..."
    }
  }
}
```

**Frontend Implementation Status**: ⚠️ NEEDS UPDATE

**Current Frontend** (user-assets.service.ts):
```typescript
// WRONG - Tries to use signature verification
export async function verifyAndDownload(request: DownloadRequest): Promise<DownloadResponse> {
  const response = await fetch(ENDPOINTS.VERIFY_DOWNLOAD, {
    method: "POST",  // ❌ Should be GET
    body: JSON.stringify({
      ipId: request.ipId,
      signature: request.signature,  // ❌ Backend doesn't use this
      message: request.message  // ❌ Backend doesn't use this
    })
  });
}
```

**Correct Implementation**:
```typescript
export async function downloadDerivative(derivativeId: string): Promise<DerivativeContent> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${getJWTToken()}`  // Backend extracts wallet from JWT
      }
    }
  );
  
  const result = await response.json();
  return result.data;
}
```

---

## Missing Backend Endpoints

### ❌ 1. POST /api/v1/user/purchases
**Frontend Expectation**: Notify backend after frontend mints license  
**Backend Reality**: Doesn't exist (backend mints everything itself)  
**Status**: **NOT NEEDED** if we use backend purchase flow

### ❌ 2. POST /api/v1/derivatives/register
**Frontend Expectation**: Register user-created derivative  
**Backend Reality**: Doesn't exist  
**Status**: **CRITICAL MISSING** - needed for "Create Derivative" feature

### ❌ 3. GET /api/v1/user/creations
**Frontend Expectation**: List derivatives user created  
**Backend Reality**: Doesn't exist  
**Status**: **CRITICAL MISSING** - needed for "My Creations" tab

Alternative: Could be `GET /api/v1/derivatives?creator=:walletAddress`

### ❌ 4. GET /api/v1/royalty/status/:ipId
**Frontend Expectation**: Get royalty earnings for IP asset  
**Backend Reality**: Doesn't exist  
**Status**: **NICE TO HAVE** - can query blockchain directly

---

## Critical Design Decision Required

### Option A: Use Backend Purchase Flow (RECOMMENDED)

**Approach**: Backend mints and transfers NFTs

**Frontend Changes Needed**:
1. ✅ Remove Story SDK purchase logic from `RefinedReportCard.tsx`
2. ✅ Call backend `POST /purchase/:derivativeId` with `buyerWallet`
3. ✅ Show purchase success with transaction links
4. ✅ Backend handles all blockchain operations

**Pros**:
- ✅ Backend controls gas fees
- ✅ Backend can batch transactions
- ✅ Consistent pricing and royalty distribution
- ✅ Users don't need WIP tokens approved
- ✅ Simpler frontend (just REST API calls)

**Cons**:
- ❌ Backend needs gas wallet with funds
- ❌ Centralized purchase flow

**Data Flow**:
```
User clicks "Buy"
  → POST /purchase/:derivativeId { buyerWallet: "0x..." }
  → Backend mints NFT
  → Backend transfers NFT to user
  → Return { asset_id, ip_id, token_id, tx_hashes }
  → Frontend shows success
```

---

### Option B: Use Frontend License Minting (CURRENT APPROACH)

**Approach**: Frontend calls Story SDK to mint license tokens

**Backend Changes Needed**:
1. ❌ Derivatives must be pre-minted as IP Assets
2. ❌ Need license terms configured for each derivative
3. ❌ Need `POST /user/purchases` endpoint to track frontend mints
4. ❌ Backend can't control royalty distribution

**Pros**:
- ✅ Decentralized (user controls wallet)
- ✅ User pays gas fees directly

**Cons**:
- ❌ Requires derivatives to be pre-minted
- ❌ Backend loses control over pricing/royalties
- ❌ More complex frontend logic
- ❌ Users need WIP tokens

**Data Flow**:
```
User clicks "Buy"
  → Frontend calls storyClient.buyLicense()
  → User signs transaction
  → Frontend gets license token ID
  → POST /user/purchases { ipId, licenseTokenId, txHash }
  → Backend records purchase
```

---

## Recommended Implementation Plan

### Phase 1: Align with Backend Purchase Flow (Priority 1)

**Update** `RefinedReportCard.tsx`:
```typescript
const handlePurchase = async () => {
  if (!address) {
    toast.error("Please connect wallet");
    return;
  }

  setIsPurchasing(true);

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/api/v1/marketplace/purchase/${report.derivative_id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerWallet: address })
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const result = await response.json();

    toast.success(`NFT purchased! Token ID: ${result.data.token_id}`);
    
    // Show transaction links
    console.log("Mint TX:", result.data.explorer_links.mint_tx);
    console.log("Transfer TX:", result.data.explorer_links.transfer_tx);
    
    onPurchaseSuccess?.();
  } catch (error) {
    toast.error(`Purchase failed: ${error.message}`);
  } finally {
    setIsPurchasing(false);
  }
};
```

**Update** `marketplace.service.ts` types:
```typescript
export interface RefinedReport {
  derivative_id: string;  // ✅ Add this (primary key)
  type: "DAILY" | "MONTHLY";
  content: string;
  processing: {
    content_hash: string;
    ipfs_uri: string;
    ipfs_hash: string;
  };
  ip_id: string | null;  // Null until minted
  token_id: string | null;  // Null until minted
  is_minted: boolean;
  created_at: string;
  primitive_data: Array<{
    reading_id: string;
    owner_id: string;
    aqi: number;
    timestamp: string;
  }>;
  
  // Frontend display fields (derive from content/processing)
  title?: string;  // Parse from content
  description?: string;  // Parse from content
  thumbnailUrl?: string;  // Generate from IPFS
  price_wip?: string;  // Fixed price or from pricing logic
}
```

---

### Phase 2: Fix User Assets Display (Priority 1)

**Update** `user-assets.service.ts`:
```typescript
// Backend Asset type
interface BackendAsset {
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
}

export async function getUserAssets(walletAddress: string): Promise<BackendAsset[]> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/v1/marketplace/assets/${walletAddress}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" }
      // Remove JWT auth per your note
    }
  );

  if (!response.ok) throw new Error("Failed to fetch assets");

  const result = await response.json();
  return result.data;  // Return as-is, don't transform
}

// Fetch derivative details separately
export async function getDerivativeDetails(derivativeId: string): Promise<Derivative> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/v1/marketplace/derivatives/${derivativeId}`
  );
  
  const result = await response.json();
  return result.data;
}
```

**Update** `MyCollectionTab.tsx`:
```typescript
const { data: assets } = useQuery({
  queryKey: ["user-assets", address],
  queryFn: () => getUserAssets(address)
});

// For each asset, fetch derivative details to get title/description
const { data: derivative } = useQuery({
  queryKey: ["derivative", asset.derivative_id],
  queryFn: () => getDerivativeDetails(asset.derivative_id)
});
```

---

### Phase 3: Fix Download Flow (Priority 2)

**Update** `user-assets.service.ts`:
```typescript
export async function downloadDerivative(derivativeId: string): Promise<DerivativeContent> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getJWTToken()}`
        // Backend will extract wallet address from JWT
      }
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("You don't own this asset");
    }
    throw new Error("Download failed");
  }

  const result = await response.json();
  return {
    content: result.data.content,
    contentHash: result.data.processing.content_hash,
    ipfsUri: result.data.processing.ipfs_uri
  };
}
```

---

### Phase 4: Request Missing Backend Endpoints (Priority 3)

**1. Derivative Creation**:
```
POST /api/v1/derivatives/register
Body: {
  parentIpId: string;
  creatorWallet: string;
  metadata: { title, description, type };
  ipfsHash: string;
}
```

**2. User Creations Query**:
```
GET /api/v1/derivatives?creator=:walletAddress
Response: { success, data: Derivative[] }
```

**3. Royalty Status** (optional, can query blockchain):
```
GET /api/v1/royalty/:ipId
Response: {
  totalEarned: string;
  claimable: string;
  claimed: string;
}
```

---

## Summary of Required Changes

### Frontend Files to Update:

1. ✅ `marketplace.service.ts` - Already correct, just need type updates
2. ❌ `RefinedReportCard.tsx` - Replace Story SDK with backend purchase
3. ❌ `user-assets.service.ts` - Fix asset fetching and download
4. ❌ `MyCollectionTab.tsx` - Fetch derivative details for display
5. ❌ `LicenseCard.tsx` - Update download flow

### Backend Endpoints Status:

| Endpoint | Status | Frontend Needs |
|----------|--------|----------------|
| GET /derivatives | ✅ Working | Use for browsing |
| GET /derivatives/:id | ✅ Working | Use for details |
| POST /purchase/:id | ✅ Working | **Switch to this** |
| GET /assets/:wallet | ✅ Working | Already using |
| GET /download/:id | ✅ Working | Fix auth method |
| POST /derivatives/register | ❌ Missing | Request backend |
| GET /derivatives?creator=X | ❌ Missing | Request backend |

---

## Questions for Backend Team

1. **Purchase Flow**: Confirm we should use backend purchase endpoint (not frontend Story SDK)
2. **JWT Auth**: You mentioned removing JWT - what will replace it for download authentication?
3. **Derivative Title/Description**: Can backend include these in Asset responses?
4. **Derivative Creation**: When will `/derivatives/register` endpoint be available?
5. **Pricing**: Is derivative price fixed at $100, or should frontend display pricing?
