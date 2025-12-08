# ClearSky Marketplace - Correction & Implementation Plan

## 📋 Executive Summary

After analyzing the E2E testing documentation, backend test scripts, and current frontend implementation, I've identified critical misalignments between:
1. **The Intended Flow** (documented in flow notes)
2. **Backend Reality** (what endpoints actually exist)
3. **Frontend Current State** (what was implemented by Gemini)

This document provides a **human-readable plan** for correcting the marketplace implementation.

---

## 🔍 Current State Analysis

### What's Working ✅
1. **RefinedReportCard** - Correctly calls backend purchase endpoint
2. **Backend Purchase Flow** - Backend mints & transfers NFT properly
3. **User Assets Fetching** - `getUserAssets()` calls correct endpoint
4. **Basic UI Structure** - Cards, grids, and layouts are in place

### Critical Issues ❌

#### Issue 1: Conflicting Architectures
**Problem**: Documentation says "frontend mints licenses via Story SDK" but backend actually mints everything.

**Current Flow** (Backend E2E):
```
User clicks purchase → Backend mints NFT → Backend transfers to buyer → Backend creates asset record
```

**Documented Flow** (MISSING_BACKEND_ENDPOINTS.md):
```
User clicks buy license → Frontend mints via Story SDK → Frontend notifies backend → Backend syncs state
```

**Decision Required**: Stick with **Backend Purchase Flow** (already implemented)

---

#### Issue 2: Wrong Marketplace Browse Implementation
**Problem**: `RefinedReportsGrid` calls `browseMarketplace()` but the service still has old mock code.

**What Backend Actually Provides**:
```bash
GET /api/v1/marketplace/derivatives?type=MONTHLY&is_minted=false&limit=10&offset=0
```

**What Frontend Currently Does**:
- ✅ Calls correct endpoint
- ❌ Doesn't handle pagination properly
- ❌ Doesn't parse derivative content for display
- ❌ Missing title/description extraction

---

#### Issue 3: Derivatives Gallery is Mock-Only
**Problem**: `DerivativesGallery` calls `getDerivatives()` which returns hardcoded mock data.

**Backend Reality**: No separate "community derivatives" endpoint exists yet.

**Workaround**: Filter derivatives by checking if they have `parent_id` field.

---

#### Issue 4: Missing JWT Authentication
**Problem**: Download endpoint requires JWT but no auth flow exists.

**Backend Expects**:
```bash
GET /api/v1/marketplace/download/:id
Authorization: Bearer <JWT>
```

**Frontend Has**: No JWT - uses wallet signatures only.

**Solution**: Either:
1. Backend adds wallet-signature-based auth endpoint
2. Frontend implements JWT exchange (POST /api/v1/auth/wallet-login)

---

#### Issue 5: Search Functionality Broken
**Problem**: Marketplace search UI tries to use city/date filters but backend doesn't support them.

**Backend Supports**:
- ✅ `type` filter (DAILY/MONTHLY)
- ✅ `is_minted` filter
- ✅ Pagination (limit/offset)
- ❌ City search
- ❌ Date range search

**Solution**: Simplify search to only use `type` filter.

---

## 🎯 Correction Plan (Step-by-Step)

### Phase 1: Fix Core Marketplace Browse
**What to Change**: Make browse actually work with real backend data

**Files to Modify**:
1. `marketplace.service.ts`
2. `RefinedReportsGrid.tsx`
3. `RefinedReportCard.tsx`

**Changes**:

#### 1.1 Fix `browseMarketplace()` - ALREADY CORRECT ✅
Current implementation correctly calls backend. No changes needed.

#### 1.2 Add Response Parsing to `RefinedReportsGrid`
**Problem**: Backend returns derivatives with `content` field (full AI report text), but UI needs `title` and `description`.

**Solution**:
```typescript
// In RefinedReportsGrid.tsx
const { data: rawReports, isLoading } = useQuery({
  queryKey: ["marketplace-browse", queryParams],
  queryFn: () => browseMarketplace(queryParams),
});

// Transform derivatives to add display fields
const reports = rawReports?.map(deriv => ({
  ...deriv,
  title: extractTitle(deriv.content) || `${deriv.type} Report`,
  description: extractDescription(deriv.content) || "AI-generated analysis",
  price_wip: "100" // TODO: Get from backend pricing config
}));
```

#### 1.3 Fix `RefinedReportCard` Display
**Current State**: Uses backend purchase flow ✅
**Issue**: Displays `report.ip_id` before minting (will be null)

**Solution**:
```typescript
// Show derivative_id if not yet minted
{report.ip_id ? (
  <span>IP: {report.ip_id.slice(0, 6)}...{report.ip_id.slice(-4)}</span>
) : (
  <span>Derivative: {report.derivative_id.slice(0, 12)}...</span>
)}
```

---

### Phase 2: Fix Authentication Flow
**What to Change**: Enable secure downloads with JWT

**Option A: Frontend Adds JWT Exchange** (Recommended)
Create new service function:
```typescript
// auth.service.ts
export async function loginWithWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<{ accessToken: string }> {
  const response = await fetch(`${env.API_BASE_URL}/api/v1/auth/wallet-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature, message })
  });

  const data = await response.json();
  storeTokens({ accessToken: data.token });
  return data;
}
```

**When to Call**:
- After user connects wallet
- Before first authenticated request
- Store JWT in localStorage

**Option B: Backend Adds Signature-Based Download** (Requires Backend Change)
Backend engineer creates new endpoint:
```
POST /api/v1/marketplace/download/:id/verify
Body: { walletAddress, signature, message }
```

---

### Phase 3: Simplify Search UI
**What to Change**: Remove unsupported filters

**File**: `Marketplace/index.tsx` - SearchBar component

**Changes**:
```typescript
// REMOVE:
- City input
- Date range pickers
- Advanced filters

// KEEP:
- Type selector (PM25, PM10, CO2, NO2, DAILY, MONTHLY)
- Search button

// CHANGE:
- Make type required (no empty search)
- Pre-trigger search with default type on mount
```

---

### Phase 4: Handle Derivatives Gallery
**What to Change**: Either use backend endpoint or filter client-side

**Option A: Backend Creates Endpoint** (Recommended)
```bash
GET /api/v1/marketplace/derivatives?type=creative_derivative&is_minted=true
```

**Option B: Client-Side Filtering** (Temporary)
```typescript
// DerivativesGallery.tsx
const { data: allDerivatives } = useQuery({
  queryKey: ["all-derivatives"],
  queryFn: () => browseMarketplace({ is_minted: true })
});

// Filter for derivatives that are children (have parent_data_ids referencing other derivatives)
const communityDerivatives = allDerivatives?.filter(d =>
  d.metadata?.type === "creative_derivative"
);
```

---

### Phase 5: Fix User Profile Tabs
**What to Change**: My Collection and My Creations need real data

**Files**:
- `MyCollectionTab.tsx`
- `MyCreationsTab.tsx`

#### 5.1 My Collection - FIX DATA TRANSFORMATION
**Current State**: Calls `getUserAssets()` correctly ✅
**Issue**: Returns `BackendAsset[]` but UI expects `PurchasedLicense[]`

**Solution**:
```typescript
// In MyCollectionTab.tsx
const { data: backendAssets } = useQuery({
  queryKey: ["user-assets", address],
  queryFn: () => getUserAssets(address!)
});

// Transform to UI format
const purchases: PurchasedLicense[] = backendAssets?.map(asset => ({
  licenseTokenId: asset.token_id,
  ipId: asset.ip_id,
  derivativeId: asset.derivative_id,
  title: "AI Report", // TODO: Fetch from derivative
  description: "...",
  purchasedAt: asset.purchased_at,
  txHash: asset.purchase_tx_hash,
  canCreateDerivative: true
}));
```

#### 5.2 My Creations - NEEDS BACKEND ENDPOINT
**Missing**: `GET /api/v1/user/creations`

**Temporary Solution**: Show message "Coming Soon"
**Final Solution**: Backend creates endpoint

---

### Phase 6: Add Missing Backend Endpoints
**What Backend Engineer Needs to Create**:

#### 6.1 User Creations Endpoint
```bash
GET /api/v1/marketplace/derivatives?creator=0x...
Response: Array<Derivative> (user's created assets)
```

#### 6.2 Wallet Login Endpoint (for JWT)
```bash
POST /api/v1/auth/wallet-login
Body: { walletAddress, signature, message }
Response: { token: string, expiresIn: number }
```

#### 6.3 Community Derivatives Filter
```bash
GET /api/v1/marketplace/derivatives?type=creative_derivative
Response: Array<Derivative> (community creations)
```

---

## 🔧 Implementation Checklist

### Immediate Fixes (Can Do Now)
- [ ] Fix `RefinedReportsGrid` to parse derivative content for title/description
- [ ] Fix `RefinedReportCard` to show derivative_id when ip_id is null
- [ ] Simplify search UI to remove unsupported filters
- [ ] Add proper error handling for failed backend calls
- [ ] Add loading states for all API calls
- [ ] Fix pagination in browse endpoint

### Requires Backend Changes
- [ ] Create wallet login endpoint for JWT exchange
- [ ] Create user creations endpoint
- [ ] Add creator filter to derivatives endpoint
- [ ] Add derivative type filter

### Story SDK Usage (Keep for Future)
- [ ] `buyLicense()` - NOT USED (backend mints instead)
- [ ] `registerDerivative()` - FUTURE FEATURE (user-created derivatives)
- [ ] `claimRevenue()` - FUTURE FEATURE (royalty claiming)

---

## 📊 API Call Mapping

### Current Frontend → Backend Mapping

| Frontend Function | Backend Endpoint | Status | Notes |
|------------------|------------------|--------|-------|
| `browseMarketplace()` | `GET /derivatives` | ✅ Working | Needs content parsing |
| `purchaseDerivative()` | `POST /purchase/:id` | ✅ Working | Backend mints NFT |
| `getUserAssets()` | `GET /assets/:wallet` | ✅ Working | Returns BackendAsset[] |
| `downloadDerivative()` | `GET /download/:id` | ⚠️ Blocked | Needs JWT auth |
| `getUserCreations()` | ❌ Missing | ❌ Not Exist | Backend TODO |
| `getDerivatives()` | ❌ Mock Only | ❌ Mock | Needs real endpoint |

### Story SDK Usage

| StoryService Method | When Used | Called By |
|---------------------|-----------|-----------|
| `buyLicense()` | ❌ NOT USED | Backend mints instead |
| `registerDerivative()` | ✅ Future | CreateDerivativeModal |
| `claimRevenue()` | ✅ Future | MyCreationsTab |
| `checkClaimableRevenue()` | ✅ Future | MyCreationsTab |

---

## 🎨 UI/UX Improvements Needed

### 1. Better Empty States
- Show when no derivatives match search
- Show when user has no purchases
- Show when user has no creations

### 2. Loading States
- Skeleton loaders while fetching
- Progress bars for purchases
- Animated loaders for AI generation

### 3. Error Handling
- Toast notifications for errors
- Retry buttons for failed requests
- Clear error messages

### 4. Purchase Confirmation
- Show transaction in progress
- Display explorer links
- Redirect to profile after purchase

---

## 🚀 Recommended Implementation Order

1. **Fix Browse & Display** (1-2 hours)
   - Parse derivative content
   - Add proper error handling
   - Fix empty states

2. **Simplify Search** (30 min)
   - Remove unsupported filters
   - Make type selector work

3. **Fix My Collection** (1 hour)
   - Transform BackendAsset to PurchasedLicense
   - Fetch derivative details for titles
   - Add download buttons

4. **Add JWT Auth** (2-3 hours)
   - Create wallet login flow
   - Store JWT tokens
   - Enable downloads

5. **Wait for Backend Endpoints** (Parallel)
   - User creations
   - Community derivatives
   - Pricing configuration

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- [ ] User can search by type and see real derivatives
- [ ] Derivative cards show meaningful titles/descriptions
- [ ] Purchase flow works end-to-end
- [ ] User sees purchased assets in profile

### Phase 2 Complete When:
- [ ] User can log in with wallet signature
- [ ] JWT stored and refreshed automatically
- [ ] Downloads work with ownership verification

### Phase 3 Complete When:
- [ ] User can see their created derivatives
- [ ] User can claim royalties from creations
- [ ] Community gallery shows real derivatives

---

## 📝 Notes for Backend Engineer

### Critical Missing Endpoints:
1. `POST /api/v1/auth/wallet-login` - For JWT exchange
2. `GET /api/v1/marketplace/derivatives?creator=0x...` - User creations
3. Add `creator_wallet` field to Derivative schema

### Enhancement Requests:
1. Add `display_title` and `display_description` to Derivative schema
2. Add pricing configuration (currently hardcoded to 100 WIP)
3. Add `is_community_derivative` boolean flag

### Current Working Endpoints:
- ✅ `GET /marketplace/derivatives` (with filters)
- ✅ `POST /marketplace/purchase/:id`
- ✅ `GET /marketplace/assets/:wallet`
- ✅ `GET /marketplace/download/:id` (needs JWT)

---

## End of Plan
