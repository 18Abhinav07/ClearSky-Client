# Frontend Implementation Summary - Backend Alignment

**Date**: December 7, 2025  
**Status**: ✅ Critical Updates Complete

---

## Changes Implemented

### 1. ✅ Backend Purchase Flow Integration

**File**: `Client/src/components/Marketplace/RefinedReportCard.tsx`

**Changes**:
- ❌ Removed Story SDK `buyLicense()` call
- ✅ Added backend `POST /api/v1/marketplace/purchase/:derivativeId` call
- ✅ Pass `buyerWallet` in request body
- ✅ Handle backend response with `asset_id`, `token_id`, `tx_hashes`
- ✅ Display success message with transaction links

**Before**:
```typescript
// Frontend minted license tokens
const result = await storyClient.buyLicense({
  ipId: report.ipId,
  licenseTermsId: report.licenseTermsId,
  priceWIP: report.price_wip
});
```

**After**:
```typescript
// Backend mints and transfers NFT
const response = await fetch(
  `${env.API_BASE_URL}/api/v1/marketplace/purchase/${report.derivative_id}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyerWallet: address })
  }
);
```

---

### 2. ✅ Updated Type Definitions

**File**: `Client/src/services/api/marketplace.service.ts`

**Changes**:
- ✅ Aligned `RefinedReport` type with backend `Derivative` schema
- ✅ Added `derivative_id` as primary key
- ✅ Changed `type` to `"DAILY" | "MONTHLY"`
- ✅ Made `ip_id` and `token_id` nullable (null until minted)
- ✅ Added `is_minted` boolean flag
- ✅ Added `primitive_data` array from backend enrichment
- ✅ Added `processing` object with IPFS/content hashes

**New Type**:
```typescript
export interface RefinedReport {
  derivative_id: string;  // Primary key
  type: "DAILY" | "MONTHLY";
  parent_data_ids: string[];
  content: string;
  processing: {
    content_hash?: string;
    ipfs_uri?: string;
    ipfs_hash?: string;
  };
  ip_id: string | null;  // Null until minted
  token_id: string | null;
  is_minted: boolean;
  created_at: string;
  primitive_data?: Array<{...}>;
  
  // Display fields
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  price_wip?: string;
}
```

---

### 3. ✅ User Assets Service Update

**File**: `Client/src/services/api/user-assets.service.ts`

**Changes**:
- ✅ Added `BackendAsset` type matching backend Asset schema
- ✅ Updated `getUserAssets()` to return `BackendAsset[]` directly
- ✅ Removed transformation logic (return backend response as-is)
- ✅ Removed JWT auth headers (per backend engineer's plan)
- ✅ Added `getDerivativeDetails()` helper function
- ✅ Added `downloadDerivative()` function with JWT auth
- ✅ Deprecated `recordPurchase()` (not needed with backend flow)

**Key Changes**:
```typescript
// Before: Transformed Asset to PurchasedLicense
return assets.map(asset => ({
  licenseTokenId: asset.token_id,
  title: "Unknown",  // ⚠️ Backend doesn't provide
  ...
}));

// After: Return backend Asset directly
return result.data as BackendAsset[];

// Fetch derivative details separately for title/description
const derivative = await getDerivativeDetails(asset.derivative_id);
```

---

### 4. ✅ Download Flow Update

**Added Function**:
```typescript
export async function downloadDerivative(derivativeId: string) {
  const response = await fetch(
    `${env.API_BASE_URL}/api/v1/marketplace/download/${derivativeId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${tokens.accessToken}`
      }
    }
  );
  
  return {
    content: result.data.content,
    processing: result.data.processing
  };
}
```

**Notes**:
- ⚠️ Still requires JWT token (backend will update)
- ✅ Proper error handling for 403 (not owner) and 404 (not found)

---

## Backend API Status

### ✅ Working Endpoints (Frontend Aligned)

| Endpoint | Method | Purpose | Frontend Status |
|----------|--------|---------|-----------------|
| `/api/v1/marketplace/derivatives` | GET | Browse derivatives | ✅ Using correctly |
| `/api/v1/marketplace/derivatives/:id` | GET | Get derivative details | ✅ Helper added |
| `/api/v1/marketplace/purchase/:id` | POST | Purchase & mint NFT | ✅ Integrated |
| `/api/v1/marketplace/assets/:wallet` | GET | Get user assets | ✅ Using correctly |
| `/api/v1/marketplace/download/:id` | GET | Download content | ✅ Function added |

---

### ❌ Missing Endpoints (Documented)

| Endpoint | Purpose | Workaround |
|----------|---------|------------|
| `POST /api/v1/derivatives/register` | Register user-created derivative | Block "Create Derivative" feature |
| `GET /api/v1/derivatives?creator=X` | List user creations | Show message in "My Creations" tab |
| `GET /api/v1/royalty/:ipId` | Get royalty status | Query blockchain directly |

---

## Query Parameter Updates

### Browse Derivatives

**Endpoint**: `GET /api/v1/marketplace/derivatives`

**Supported Parameters**:
```typescript
{
  is_minted: boolean,  // Filter minted/unminted
  type: "DAILY" | "MONTHLY",  // Filter by derivative type
  limit: number,  // Pagination (default 50)
  offset: number,  // Pagination (default 0)
  search: string  // Not yet implemented in backend
}
```

**Frontend Implementation**:
```typescript
const queryParams = {
  type: searchParams.type,
  is_minted: false,  // Only show available (unminted) derivatives
};

const reports = await browseMarketplace(queryParams);
```

---

## Request/Response Payloads

### Purchase Derivative

**Request**:
```json
POST /api/v1/marketplace/purchase/deriv_xxx
{
  "buyerWallet": "0x123..."
}
```

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

---

### Get User Assets

**Request**:
```
GET /api/v1/marketplace/assets/0x123...
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

**Frontend Notes**:
- ⚠️ Asset doesn't include derivative title/description
- ✅ Use `getDerivativeDetails(asset.derivative_id)` to fetch metadata

---

## Remaining Issues

### 1. ⚠️ Missing Derivative Metadata in Assets

**Problem**: Backend Asset doesn't include derivative title/description

**Current Workaround**:
```typescript
const assets = await getUserAssets(walletAddress);

// For each asset, fetch derivative details
for (const asset of assets) {
  const derivative = await getDerivativeDetails(asset.derivative_id);
  // Now have: derivative.content (parse for title/desc)
}
```

**Better Solution**: Request backend to include derivative metadata in Asset response

---

### 2. ⚠️ JWT Authentication for Download

**Problem**: Backend requires JWT, but frontend uses CDP wallet (signature-based)

**Status**: Backend engineer will update authentication method

**Current Implementation**: Uses JWT token from `getStoredTokens()`

---

### 3. ❌ "Create Derivative" Feature Blocked

**Problem**: No backend endpoint to register derivatives

**Options**:
1. **Frontend-only**: Use Story SDK to register derivatives, don't notify backend
2. **Request endpoint**: `POST /api/v1/derivatives/register`

**Recommendation**: Disable "Create Derivative" button until backend supports it

---

### 4. ❌ "My Creations" Tab Empty

**Problem**: No way to query derivatives created by user

**Options**:
1. **Request endpoint**: `GET /api/v1/derivatives?creator=:walletAddress`
2. **Query all derivatives**: Filter client-side by primitive_data owner_id

**Recommendation**: Show placeholder message until backend supports it

---

## Files Modified

1. ✅ `Client/src/components/Marketplace/RefinedReportCard.tsx`
2. ✅ `Client/src/services/api/marketplace.service.ts`
3. ✅ `Client/src/services/api/user-assets.service.ts`
4. ✅ `Client/BACKEND_ENDPOINT_ANALYSIS.md` (new)
5. ✅ `Client/FRONTEND_IMPLEMENTATION_SUMMARY.md` (this file)

---

## Testing Checklist

### Browse Derivatives
- [ ] Frontend displays unminted derivatives (`is_minted: false`)
- [ ] Can filter by type (DAILY/MONTHLY)
- [ ] Shows derivative_id, content preview, type
- [ ] "Purchase" button enabled for unminted derivatives

### Purchase Flow
- [ ] Click "Purchase" sends POST to `/purchase/:derivativeId`
- [ ] Passes `buyerWallet` in body
- [ ] Shows loading state during purchase
- [ ] Success: displays asset_id, token_id, transaction links
- [ ] Error: shows error message from backend

### User Assets
- [ ] Fetches assets from `/assets/:walletAddress`
- [ ] Displays asset_id, token_id, ip_id
- [ ] Shows purchase_price, royalties, platform_fee
- [ ] Can fetch derivative details separately

### Download
- [ ] Only available for owned assets
- [ ] Requires JWT token
- [ ] Returns derivative content and IPFS metadata
- [ ] Shows error if not owner (403) or not found (404)

---

## Next Steps

1. **Frontend Team**:
   - [ ] Update MyCollectionTab to use `BackendAsset` type
   - [ ] Fetch derivative details for each asset display
   - [ ] Disable "Create Derivative" feature until backend ready
   - [ ] Add placeholder for "My Creations" tab

2. **Backend Team**:
   - [ ] Include derivative metadata in Asset responses
   - [ ] Implement `POST /derivatives/register` endpoint
   - [ ] Implement `GET /derivatives?creator=X` query
   - [ ] Update JWT auth to signature-based (or provide JWT exchange)

3. **Testing**:
   - [ ] E2E test: Browse → Purchase → View in Profile → Download
   - [ ] Verify transaction links work on Story Explorer
   - [ ] Test error cases (already minted, invalid wallet, etc.)

---

## Questions for Backend Team

1. Can you include derivative `content` (or parsed title/description) in Asset responses?
2. When will `/derivatives/register` endpoint be available?
3. Will JWT auth be replaced with signature-based auth?
4. Should frontend parse `content` field to extract title/description?
5. Is derivative pricing fixed at $100 or dynamic?
