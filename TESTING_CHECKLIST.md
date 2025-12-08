# Marketplace Browse Flow - Testing Checklist

## Overview
All three critical bugs identified by the user have been fixed. This document provides a testing checklist to verify the complete browse flow works correctly.

---

## Bugs Fixed

### ✅ Bug 1: 401 Unauthorized Error
**Issue**: `GET /marketplace/derivatives?type=PM25&is_minted=false` returned 401 "No token provided"

**Root Cause**: Missing Authorization header in API calls

**Fix Applied**:
- File: `marketplace.service.ts`
- Added `import { getStoredTokens } from "./auth.service"`
- Added Bearer token to `browseMarketplace()` function
- Added 401 error handling with user-friendly message

**Code Changed**:
```typescript
// Lines 204-217
const tokens = getStoredTokens();
const headers: HeadersInit = {
  "Content-Type": "application/json"
};

if (tokens?.access_token) {
  headers["Authorization"] = `Bearer ${tokens.access_token}`;
}

// Lines 219-223
if (response.status === 401) {
  throw new Error("Authentication required. Please connect your wallet.");
}
```

---

### ✅ Bug 2: React setState Warning
**Issue**: `Cannot update a component (Marketplace) while rendering a different component (SearchBar)`

**Root Cause**: Using `useState(() => { handleSearch() })` as a side effect instead of `useEffect`

**Fix Applied**:
- File: `Marketplace/index.tsx`
- Changed from `useState` callback to proper `useEffect` hook
- Added dependency array `[isAuthenticated]`

**Code Changed**:
```typescript
// Lines 12, 237-242
import { useState, useEffect } from "react";

// In SearchBar component:
useEffect(() => {
  if (isAuthenticated) {
    handleSearch();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAuthenticated]);
```

---

### ✅ Bug 3: Wrong API Parameters
**Issue**: Dropdown mixed sensor types (PM25, PM10, CO2, NO2) with time ranges (MONTHLY, DAILY). Backend only accepts `type=DAILY|MONTHLY`

**Root Cause**: Single dropdown with incorrect options

**Fix Applied**:
- File: `Marketplace/index.tsx`
- Changed dropdown to only show DAILY and MONTHLY options
- Updated type to `"DAILY" | "MONTHLY"`
- Changed default from "PM25" to "MONTHLY"
- Added proper authentication checks

**Code Changed**:
```typescript
// Lines 227, 252-259
const [type, setType] = useState<"DAILY" | "MONTHLY">("MONTHLY");

<select
  value={type}
  onChange={(e) => setType(e.target.value as "DAILY" | "MONTHLY")}
  className="..."
>
  <option value="DAILY">📅 Daily Air Quality Reports</option>
  <option value="MONTHLY">📊 Monthly Air Quality Reports</option>
</select>
```

---

## Additional Improvements

### ✅ Fixed RefinedReportsGrid Key Issue
**Issue**: Used `report.ipId` (camelCase) instead of `report.ip_id` (snake_case)

**Fix Applied**:
- File: `RefinedReportsGrid.tsx`
- Changed key from `report.ipId || report.title` to `report.derivative_id`

---

### ✅ Added Fallback Values for Missing Display Fields
**Issue**: Backend might not provide `title` and `description` fields

**Fix Applied**:
- File: `RefinedReportCard.tsx`
- Added fallback values for title and description

**Code Changed**:
```typescript
{report.title || `${report.type} Air Quality Report`}
{report.description || "AI-generated comprehensive analysis of air quality data from our DePIN network sensors."}
```

---

## Testing Checklist

### Prerequisites
- [ ] Backend server running on `localhost:3000`
- [ ] Frontend development server running
- [ ] User wallet connected and authenticated
- [ ] JWT token stored in localStorage

---

### Test 1: Authentication Flow
**Steps**:
1. Open browser DevTools Network tab
2. Navigate to Marketplace page
3. Check if user is authenticated

**Expected Results**:
- [ ] No 401 errors in Network tab
- [ ] Authorization header present in API requests: `Authorization: Bearer <token>`
- [ ] User wallet address displayed in navbar

---

### Test 2: Auto-Search on Page Load
**Steps**:
1. Navigate to Marketplace page while authenticated
2. Wait for auto-search to trigger

**Expected Results**:
- [ ] No React warning in console about setState
- [ ] API call made automatically: `GET /marketplace/derivatives?type=MONTHLY&is_minted=false`
- [ ] Loading state appears (GeneratingLoader component)
- [ ] Results display after loading completes

---

### Test 3: Manual Search - DAILY Reports
**Steps**:
1. Select "📅 Daily Air Quality Reports" from dropdown
2. Click "Search" button

**Expected Results**:
- [ ] API call made: `GET /marketplace/derivatives?type=DAILY&is_minted=false`
- [ ] Authorization header included
- [ ] Results display correctly (or empty state if no derivatives)

---

### Test 4: Manual Search - MONTHLY Reports
**Steps**:
1. Select "📊 Monthly Air Quality Reports" from dropdown
2. Click "Search" button

**Expected Results**:
- [ ] API call made: `GET /marketplace/derivatives?type=MONTHLY&is_minted=false`
- [ ] Authorization header included
- [ ] Results display correctly (or empty state if no derivatives)

---

### Test 5: Unauthenticated User
**Steps**:
1. Clear localStorage (or disconnect wallet)
2. Reload Marketplace page

**Expected Results**:
- [ ] Search button shows "Connect Wallet" instead of "Search"
- [ ] Search button is disabled
- [ ] No API calls made
- [ ] No error messages in console

---

### Test 6: Derivative Card Display
**Steps**:
1. Ensure at least one derivative exists in backend
2. Search for derivatives

**Expected Results**:
- [ ] Cards render with proper layout
- [ ] Title displays (fallback if missing: `${type} Air Quality Report`)
- [ ] Description displays (fallback if missing: default text)
- [ ] Type badge shows "DAILY Report" or "MONTHLY Report"
- [ ] Derivative ID shows truncated: `deriv_xxx...`
- [ ] Price displays with "WIP" suffix
- [ ] "Mint License" button appears (or "Not Available Yet" if no ip_id)

---

### Test 7: Empty State
**Steps**:
1. Search for type with no derivatives
2. OR ensure backend has no derivatives

**Expected Results**:
- [ ] Empty state UI displays
- [ ] Message: "No Derivatives Found"
- [ ] Subtext: "Try adjusting your search filters to find available assets."

---

### Test 8: Error Handling - 401
**Steps**:
1. Manually remove Authorization header (or expire token)
2. Try searching

**Expected Results**:
- [ ] Error message displays: "Authentication required. Please connect your wallet."
- [ ] No crash or unhandled errors
- [ ] User redirected to login (if auth flow exists)

---

### Test 9: Error Handling - Network Error
**Steps**:
1. Stop backend server
2. Try searching

**Expected Results**:
- [ ] Error toast appears with clear message
- [ ] UI doesn't crash
- [ ] Retry option available (via refetch)

---

### Test 10: Purchase Flow (Integration Test)
**Steps**:
1. Search for derivatives with `is_minted=true` (minted NFTs)
2. Click "Mint License" button on a card
3. Confirm wallet transaction

**Expected Results**:
- [ ] Story SDK `buyLicense()` called correctly
- [ ] Transaction submitted to blockchain
- [ ] Success toast appears with license token ID
- [ ] User redirected to profile (or grid refetched)
- [ ] New license visible in "My Collection" tab

---

## Verified API Endpoints

### ✅ GET /api/v1/marketplace/derivatives
**Parameters**:
- `type`: "DAILY" | "MONTHLY" (required)
- `is_minted`: boolean (optional, default: false)
- `limit`: number (optional, for pagination)
- `offset`: number (optional, for pagination)

**Headers**:
- `Authorization: Bearer <JWT_TOKEN>`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "derivative_id": "deriv_xxx",
      "type": "MONTHLY",
      "parent_data_ids": [...],
      "content": "Full AI report text...",
      "processing": {...},
      "ip_id": "0x..." | null,
      "token_id": "123" | null,
      "licenseTermsId": "5",
      "is_minted": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## Files Modified

1. **marketplace.service.ts**
   - Added auth token import
   - Added Authorization header to `browseMarketplace()`
   - Added 401 error handling

2. **Marketplace/index.tsx**
   - Added `useEffect` import
   - Fixed SearchBar auto-search to use `useEffect` instead of `useState`
   - Changed dropdown to only DAILY/MONTHLY
   - Added authentication checks

3. **RefinedReportsGrid.tsx**
   - Fixed key from `report.ipId` to `report.derivative_id`

4. **RefinedReportCard.tsx**
   - Added fallback values for title and description

---

## Next Steps

After testing confirms everything works:

1. **Fix CreateDerivativeModal** - Implement proper flow:
   - Frontend collects data
   - Backend uploads to IPFS
   - Frontend registers on blockchain via Story SDK

2. **Fix MyCollectionTab** - Transform `BackendAsset[]` to display format

3. **Add Pagination** - Implement proper pagination for browse results

4. **Add Filters** - Add more search filters as backend supports them

---

## Known Limitations

1. **No City/Date Filters**: Backend doesn't support city or date range filtering yet
2. **No Title/Description Parsing**: Using fallback values, backend should provide display fields
3. **Hardcoded Pricing**: Price is hardcoded to "100 WIP", backend should provide pricing
4. **No Thumbnail Support**: Backend doesn't provide thumbnail URLs yet

---

## Status

✅ All critical bugs fixed
✅ Ready for testing
⏳ Awaiting user testing confirmation
