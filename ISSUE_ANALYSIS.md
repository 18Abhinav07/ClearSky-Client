# ClearSky Marketplace - Issue Analysis & Root Causes

## 🐛 Issues Identified

### Issue #1: 401 Unauthorized Error
**Error**:
```
GET http://localhost:3000/api/v1/marketplace/derivatives?type=PM25&is_minted=false
Status: 401 Unauthorized
Response: {success: false, error: {message: "No token provided"}}
```

**Root Cause #1a**: Missing Authentication Headers
- `browseMarketplace()` doesn't send JWT token
- Backend expects `Authorization: Bearer <token>` header
- Current code:
  ```typescript
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
      // ❌ Missing: "Authorization": "Bearer <token>"
    }
  });
  ```

**Root Cause #1b**: Auth Token Not Available
- User needs to be authenticated before browsing
- No check if user is logged in before calling API
- Should use `getStoredTokens()` from auth.service

---

### Issue #2: React setState in Render Warning
**Error**:
```
Cannot update a component (`Marketplace`) while rendering a different component (`SearchBar`).
To locate the bad setState() call inside `SearchBar`, follow the stack trace
```

**Root Cause #2**: Wrong Hook Usage
```typescript
// ❌ WRONG: useState called as function
useState(() => {
  handleSearch();
});
```

**Should Be**: `useEffect`
```typescript
// ✅ CORRECT
useEffect(() => {
  handleSearch();
}, []);
```

**Location**: `Marketplace/index.tsx:233`

---

### Issue #3: Confused Search Parameters
**Problem**: Single dropdown mixes sensor types and time ranges

**Current Dropdown**:
```tsx
<select>
  <option value="PM25">PM2.5</option>      // ← Sensor type
  <option value="PM10">PM10</option>       // ← Sensor type
  <option value="CO2">CO2</option>         // ← Sensor type
  <option value="NO2">NO2</option>         // ← Sensor type
  <option value="MONTHLY">Monthly</option> // ← Time range
  <option value="DAILY">Daily</option>     // ← Time range
</select>
```

**Root Cause #3**: Backend API Confusion
- Backend uses `type` field for derivative type (DAILY/MONTHLY)
- Sensor types (PM25, PM10) are NOT query parameters
- Mixing these in one dropdown sends wrong data

**What Backend Actually Expects**:
```bash
GET /marketplace/derivatives?type=MONTHLY&is_minted=false
# OR
GET /marketplace/derivatives?type=DAILY&is_minted=false
```

**What Frontend Sends**:
```bash
GET /marketplace/derivatives?type=PM25&is_minted=false  # ❌ Wrong!
```

---

## 📊 Backend API Analysis

### From E2E Test Script:
```bash
# Phase 2: Browse derivatives
GET /api/v1/marketplace/derivatives?is_minted=false

# Phase 3: Filter by type
GET /api/v1/marketplace/derivatives?type=MONTHLY&is_minted=false
GET /api/v1/marketplace/derivatives?type=DAILY&is_minted=false

# Phase 3: Pagination
GET /api/v1/marketplace/derivatives?limit=5&offset=0
```

### Supported Query Parameters:
| Parameter | Type | Values | Purpose |
|-----------|------|--------|---------|
| `type` | string | DAILY, MONTHLY | Filter by derivative type |
| `is_minted` | boolean | true, false | Filter by mint status |
| `limit` | number | 1-100 | Pagination limit |
| `offset` | number | 0+ | Pagination offset |

### NOT Supported:
- ❌ Sensor type filtering (PM25, PM10, CO2, NO2)
- ❌ City filtering
- ❌ Date range filtering

---

## 🔧 Required Fixes

### Fix #1: Add Authentication to browseMarketplace()

**File**: `marketplace.service.ts`

```typescript
import { getStoredTokens } from "./auth.service";

export async function browseMarketplace(params: BrowseDerivativesRequest): Promise<RefinedReport[]> {
  const url = new URL(ENDPOINTS.DERIVATIVES);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  // ✅ ADD: Get auth token
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

  // ... rest of code
}
```

---

### Fix #2: Replace useState with useEffect

**File**: `Marketplace/index.tsx`

```typescript
function SearchBar({ onSearch }: { onSearch: (params: { type: string }) => void }) {
  const [type, setType] = useState("MONTHLY"); // ✅ Default to MONTHLY

  const handleSearch = () => {
    onSearch({ type });
  };

  // ✅ CORRECT: Use useEffect
  useEffect(() => {
    handleSearch();
  }, []); // Empty dependency array = run once on mount

  return (
    // ... rest of component
  );
}
```

---

### Fix #3: Separate Search Inputs Properly

**Option A: Two Separate Dropdowns** (Recommended)

```typescript
function SearchBar({ onSearch }) {
  const [derivativeType, setDerivativeType] = useState("MONTHLY");
  const [sensorType, setSensorType] = useState("PM25");

  const handleSearch = () => {
    // Backend only uses derivativeType
    onSearch({ type: derivativeType });
  };

  return (
    <div className="flex gap-4">
      {/* Derivative Type (sent to backend) */}
      <div className="w-1/2">
        <label>Report Type</label>
        <select value={derivativeType} onChange={(e) => setDerivativeType(e.target.value)}>
          <option value="DAILY">Daily Reports</option>
          <option value="MONTHLY">Monthly Reports</option>
        </select>
      </div>

      {/* Sensor Type (for display only - NOT sent to backend) */}
      <div className="w-1/2">
        <label>Sensor Type (Filter Results)</label>
        <select value={sensorType} onChange={(e) => setSensorType(e.target.value)}>
          <option value="PM25">PM2.5</option>
          <option value="PM10">PM10</option>
          <option value="CO2">CO2</option>
          <option value="NO2">NO2</option>
        </select>
        <p className="text-xs text-slate-500">
          Note: Filters results after fetching (backend doesn't support this yet)
        </p>
      </div>
    </div>
  );
}
```

**Option B: Single Dropdown (Simpler)**

```typescript
function SearchBar({ onSearch }) {
  const [type, setType] = useState("MONTHLY");

  return (
    <div>
      <label>Report Type</label>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="DAILY">Daily Air Quality Reports</option>
        <option value="MONTHLY">Monthly Air Quality Reports</option>
      </select>

      <Button onClick={() => onSearch({ type })}>
        Search
      </Button>

      <p className="text-xs text-slate-500 mt-2">
        Note: Sensor type (PM2.5, PM10, etc.) filtering is under development.
      </p>
    </div>
  );
}
```

---

## 🎯 Recommended Solution

### Implementation Plan:

**Step 1**: Fix Authentication
- Add `Authorization` header to `browseMarketplace()`
- Use `getStoredTokens()` from auth.service
- Handle 401 errors gracefully (redirect to login)

**Step 2**: Fix React Warning
- Change `useState(() => {})` to `useEffect(() => {}, [])`

**Step 3**: Fix Search UI (Option B - Simpler)
- Change dropdown to only show DAILY/MONTHLY
- Remove PM25, PM10, CO2, NO2 options
- Add note that sensor filtering is coming soon
- Default to "MONTHLY"

**Step 4**: Add Proper Error Handling
- Check if user is authenticated before calling API
- Show login prompt if 401 error
- Show "No results" if empty array returned

---

## 📝 Updated SearchBar Component

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";

function SearchBar({ onSearch }: { onSearch: (params: { type: string }) => void }) {
  const { isAuthenticated } = useAuth();
  const [type, setType] = useState<"DAILY" | "MONTHLY">("MONTHLY");

  const handleSearch = () => {
    if (!isAuthenticated) {
      toast.error("Please connect your wallet to browse derivatives");
      return;
    }
    onSearch({ type });
  };

  // Auto-search on mount
  useEffect(() => {
    if (isAuthenticated) {
      handleSearch();
    }
  }, [isAuthenticated]);

  return (
    <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-gray-200/80 shadow-sm">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
        {/* Report Type Select */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Report Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "DAILY" | "MONTHLY")}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
          >
            <option value="DAILY">📅 Daily Air Quality Reports</option>
            <option value="MONTHLY">📊 Monthly Air Quality Reports</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="w-full md:w-auto">
          <Button
            onClick={handleSearch}
            disabled={!isAuthenticated}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all h-full flex items-center justify-center shadow-md"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isAuthenticated ? "Search" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        💡 Filtering by sensor type (PM2.5, PM10, CO2, NO2) and city is under development.
      </p>
    </div>
  );
}
```

---

## 🔍 Testing Checklist

After fixes:
- [ ] User can browse derivatives without 401 error
- [ ] No React setState warning in console
- [ ] Only DAILY/MONTHLY options shown
- [ ] Default search triggered on page load
- [ ] Auth token sent with every request
- [ ] Graceful handling if user not authenticated
- [ ] Results display correctly

---

## End of Analysis
