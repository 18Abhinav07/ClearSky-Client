# ClearSky Marketplace - Implementation Progress

## ✅ Completed Changes

### 1. RefinedReportCard.tsx - Fixed Purchase Flow
**What Changed**: Completely rewrote purchase logic

**Before** (Incorrect):
- Frontend called backend `/purchase/:id`
- Backend minted NFT and transferred to buyer
- Confused with E2E docs

**After** (Correct):
```typescript
// Frontend mints LICENSE via Story SDK
const result = await storyClient.buyLicense({
  ipId: report.ip_id as Address,
  licenseTermsId: report.licenseTermsId!,
  priceWIP: report.price_wip || "100"
});
```

**Flow Now**:
1. Backend mints NFT → registers as IP Asset → attaches license terms
2. User clicks "Mint License" button
3. Frontend calls Story SDK `mintLicenseTokens()`
4. User pays WIP tokens
5. License NFT minted to user's wallet

**File**: [RefinedReportCard.tsx](src/components/Marketplace/RefinedReportCard.tsx:1-225)

---

### 2. marketplace.service.ts - Added licenseTermsId
**What Changed**: Added missing field to RefinedReport type

```typescript
export interface RefinedReport {
  // ... other fields
  ip_id: string | null;
  token_id: string | null;
  licenseTermsId?: string;  // ← NEW: Required for minting licenses
  // ...
}
```

**Why**: Frontend needs `licenseTermsId` to call `mintLicenseTokens()`

**File**: [marketplace.service.ts](src/services/api/marketplace.service.ts:32-65)

---

## 🔧 Next Required Changes

### 3. CreateDerivativeModal.tsx - Fix Registration Flow
**Current Issue**: Tries to upload to IPFS directly from frontend

**Required Change**:
```typescript
// STEP 1: Send file to backend
const formData = new FormData();
formData.append("file", file);
formData.append("title", title);
formData.append("description", description);
formData.append("parentIpId", parentIpId);

const backendResponse = await fetch('/api/v1/assets/prepare-derivative', {
  method: "POST",
  body: formData
});

const { ipfsHash, licenseTermsId } = await backendResponse.json();

// STEP 2: Register on blockchain with IPFS hash from backend
const result = await storyClient.registerDerivative({
  parentIpId,
  licenseTermsId,
  ipfsHash,  // ← From backend
  metadata: { title, description }
});

// STEP 3: Notify backend of success
await registerDerivative({
  childIpId: result.childIpId,
  parentIpId,
  licenseTokenId,
  txHash: result.txHash
});
```

**Backend Endpoint Needed**:
```bash
POST /api/v1/assets/prepare-derivative
FormData: { file, title, description, parentIpId }
Response: { ipfsHash: string, licenseTermsId: string }
```

---

### 4. MyCollectionTab.tsx - Show Purchased Licenses
**Current Issue**: Uses deprecated `getUserPurchases()` which returns mock data

**Required Change**:
```typescript
// Get user's assets from backend
const { data: backendAssets } = useQuery({
  queryKey: ["user-assets", address],
  queryFn: () => getUserAssets(address!)
});

// Transform BackendAsset[] to PurchasedLicense[] for display
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

**Also Need**: Fetch derivative details to get title/description

---

### 5. Marketplace Search - Already Correct ✅
**Status**: Search bar only uses `type` selector (PM25, PM10, CO2, NO2, MONTHLY, DAILY)

**No Changes Needed** - Already matches backend capabilities

---

## 📋 Backend Endpoints Status

### ✅ Working Endpoints
- `GET /marketplace/derivatives?type=X&is_minted=false` - Browse derivatives
- `GET /marketplace/assets/:wallet` - Get user's purchased assets
- `POST /marketplace/purchase/:id` - **NOT USED** (frontend mints licenses instead)

### ❌ Missing Endpoints Needed
1. `POST /api/v1/assets/prepare-derivative` - Upload file to IPFS, return hash
2. `GET /api/v1/derivatives/:id` - Get derivative details (title, description)
3. `GET /api/v1/user/creations?wallet=0x...` - Get user's created derivatives

---

## 🎯 Implementation Priority

### High Priority (Do Now)
1. ✅ **RefinedReportCard** - DONE (uses Story SDK for license minting)
2. ⏳ **CreateDerivativeModal** - Send file to backend first, then register
3. ⏳ **MyCollectionTab** - Transform BackendAsset to PurchasedLicense

### Medium Priority (After Backend Endpoints)
4. **My Creations Tab** - Show user-created derivatives
5. **Download Function** - Implement secure download with ownership verification

### Low Priority (Future)
6. **Royalty Claiming** - UI for claiming revenue from child IPs
7. **Derivative Gallery** - Show community creations

---

## 🔑 Key Architectural Points

### Confirmed Flow:
1. **IP Asset Creation**: Backend mints NFT → Registers IP → Attaches license terms
2. **License Minting**: **Frontend** mints license tokens via Story SDK
3. **Derivative Creation**:
   - Frontend sends file → Backend uploads to IPFS
   - Frontend registers derivative on blockchain with IPFS hash
   - Frontend notifies backend of success

### Story SDK Usage:
```typescript
// ✅ USED: Mint licenses
await storyClient.buyLicense({ ipId, licenseTermsId, priceWIP });

// ✅ USED: Register derivatives
await storyClient.registerDerivative({ parentIpId, licenseTermsId, ipfsHash, metadata });

// 🔮 FUTURE: Claim royalties
await storyClient.claimRevenue({ ipId, childIpIds });
```

### Backend Usage:
```typescript
// ✅ Backend creates IP Assets (not frontend)
// ✅ Backend uploads to IPFS (not frontend)
// ✅ Backend tracks purchases and assets
```

---

## 📝 Next Steps

1. Create `POST /api/v1/assets/prepare-derivative` endpoint (Backend)
2. Update `CreateDerivativeModal.tsx` to use new flow (Frontend)
3. Fix `MyCollectionTab.tsx` data transformation (Frontend)
4. Test end-to-end flow:
   - Browse derivatives
   - Mint license
   - Create derivative from license
   - View in profile

---

## 🐛 Known Issues

1. **Missing Title/Description**: Derivatives don't have display titles
   - **Solution**: Backend should extract from `content` field or add separate fields

2. **License Terms ID**: Hardcoded to "5"
   - **Solution**: Backend should return `licenseTermsId` when creating IP Asset

3. **Download Authentication**: No JWT flow implemented
   - **Solution**: Use existing wallet address auth (no new endpoint needed per your instruction)

---

## End of Progress Report
