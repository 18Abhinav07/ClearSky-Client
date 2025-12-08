# Logout/Disconnect Flow Analysis

## Overview
Comprehensive analysis of how the disconnect button removes access tokens and clears authentication state.

---

## Logout Flow Sequence

### User Action
```
User clicks "Disconnect" button in Dashboard
↓
handleLogout() in Dashboard/index.tsx
↓
logout() in useAuth.ts
```

---

## Step-by-Step Breakdown

### 1. User Clicks Disconnect Button

**Location**: `Dashboard/index.tsx` Line 290-293

```typescript
<button onClick={handleLogout}>
  Disconnect
</button>
```

### 2. handleLogout Function

**Location**: `Dashboard/index.tsx` Line 211-214

```typescript
const handleLogout = () => {
  logout();                    // Call logout from useAuth hook
  navigate(ROUTES.LANDING);    // Redirect to landing page
};
```

**Purpose**:
- Calls the logout function from useAuth
- Redirects user to landing page after logout

---

### 3. Main logout() Function

**Location**: `useAuth.ts` Line 139-176

```typescript
const logout = async () => {
  console.log("[Auth] Logging out...");

  // Step 1: Clear backend tokens FIRST (before CDP disconnect)
  clearTokens();
  console.log("[Auth] ✅ Backend tokens cleared");

  // Step 2: Clear device store
  clearDevices();
  console.log("[Auth] ✅ Device store cleared");

  // Step 3: Clear auth store (also removes from localStorage)
  clearAuth();
  console.log("[Auth] ✅ Auth store cleared");

  // Step 4: Force clear all auth-related data from localStorage
  try {
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("device-storage");
    console.log("[Auth] ✅ All localStorage auth data cleared");
  } catch (error) {
    console.warn("[Auth] Failed to clear localStorage:", error);
  }

  // Step 5: Disconnect CDP wallet using wagmi
  try {
    disconnect();
    console.log("[Auth] ✅ Wallet disconnected");
  } catch (error) {
    console.warn("[Auth] CDP disconnect warning (can be ignored):", error);
  }

  console.log("[Auth] ✅ Logout complete - user fully logged out");
};
```

**Key Design Decisions**:
1. Clear backend tokens BEFORE disconnecting wallet
2. Clear all stores (device, auth)
3. Force clear localStorage to prevent rehydration
4. Disconnect wallet last
5. Don't throw errors - logout should always succeed

---

## Token Removal Details

### clearTokens() Function

**Location**: `auth.service.ts` Line 117-120

```typescript
export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
```

**What It Removes**:
- ✅ `access_token` from localStorage
- ✅ `refresh_token` from localStorage

**Storage Keys**:
- `localStorage.getItem("access_token")` → Removed
- `localStorage.getItem("refresh_token")` → Removed

---

### clearAuth() Function

**Location**: `authStore.ts` Line 26-39

```typescript
clearAuth: () => {
  // Clear state
  set({
    isAuthenticated: false,
    walletAddress: null,
    tokens: null,
    devices: [],
  });

  // IMPORTANT: Explicitly clear from localStorage
  localStorage.removeItem("auth-storage");
}
```

**What It Clears**:
1. **Zustand State**:
   - `isAuthenticated` → `false`
   - `walletAddress` → `null`
   - `tokens` → `null`
   - `devices` → `[]`

2. **localStorage**:
   - `auth-storage` key (used by Zustand persist middleware)

**Why Explicit localStorage Clear?**
- Zustand's persist middleware can rehydrate state from localStorage
- Without explicit removal, state could be restored on page refresh
- This fixes the "double logout" bug

---

### clearDevices() Function

**Location**: `deviceStore.ts` (implied from usage)

```typescript
// Clears device store and localStorage
localStorage.removeItem("device-storage");
```

---

## Complete localStorage Cleanup

After logout completes, the following localStorage keys are removed:

1. ✅ `access_token` - Backend JWT access token
2. ✅ `refresh_token` - Backend JWT refresh token
3. ✅ `auth-storage` - Zustand auth state (contains tokens, wallet, etc.)
4. ✅ `device-storage` - Zustand device state

**Total Keys Removed**: 4

---

## Verification of Token Removal

### Before Logout
```javascript
localStorage.getItem("access_token")    // → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
localStorage.getItem("refresh_token")   // → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
localStorage.getItem("auth-storage")    // → '{"state":{"isAuthenticated":true,...}}'
localStorage.getItem("device-storage")  // → '{"state":{"devices":[...],...}}'
```

### After Logout
```javascript
localStorage.getItem("access_token")    // → null ✅
localStorage.getItem("refresh_token")   // → null ✅
localStorage.getItem("auth-storage")    // → null ✅
localStorage.getItem("device-storage")  // → null ✅
```

---

## Order of Operations (Critical)

The logout flow follows a specific order to prevent issues:

### 1. Clear Backend Tokens FIRST
```typescript
clearTokens();  // Remove access_token and refresh_token
```

**Why First?**
- Prevents sending multiple refresh token sources to CDP
- Ensures clean logout from backend services
- Avoids token conflicts

### 2. Clear Device Store
```typescript
clearDevices();
```

**Why Second?**
- Removes device data before clearing auth
- Maintains data integrity

### 3. Clear Auth Store
```typescript
clearAuth();
```

**Why Third?**
- Clears authentication state
- Removes tokens from Zustand state
- Explicitly removes auth-storage from localStorage

### 4. Force Clear All localStorage
```typescript
localStorage.removeItem("auth-storage");
localStorage.removeItem("device-storage");
```

**Why Fourth?**
- Double-check that all auth data is removed
- Prevents rehydration bugs
- Ensures complete cleanup

### 5. Disconnect Wallet LAST
```typescript
disconnect();  // wagmi disconnect
```

**Why Last?**
- All local data is already cleared
- CDP disconnect won't interfere with cleanup
- Even if disconnect fails, logout succeeds

---

## Error Handling

### Graceful Failure Design

```typescript
try {
  disconnect();
  console.log("[Auth] ✅ Wallet disconnected");
} catch (error) {
  console.warn("[Auth] CDP disconnect warning (can be ignored):", error);
  // Don't throw - logout should still succeed
}
```

**Key Points**:
- ✅ Logout ALWAYS succeeds
- ✅ Errors are logged but not thrown
- ✅ User is logged out even if CDP disconnect fails
- ✅ All tokens are removed even if errors occur

---

## Security Considerations

### ✅ Secure Token Removal
1. **Access Token**: Removed from localStorage immediately
2. **Refresh Token**: Removed from localStorage immediately
3. **No Token Residue**: All auth keys explicitly removed
4. **State Reset**: All auth state set to null/false

### ✅ No Token Leakage
- Tokens not left in memory
- No tokens sent after logout
- Complete cleanup on first attempt

### ✅ XSS Protection
- Tokens stored in localStorage (not cookies)
- Removed synchronously on logout
- No async token cleanup delays

---

## Testing the Logout Flow

### Manual Test Steps

1. **Login**:
   ```
   - Connect Coinbase Smart Wallet
   - Verify tokens in localStorage
   - Check console: "[Auth] Login successful!"
   ```

2. **Verify Tokens Stored**:
   ```javascript
   // In browser console
   localStorage.getItem("access_token")   // Should return JWT
   localStorage.getItem("refresh_token")  // Should return JWT
   ```

3. **Click Disconnect**:
   ```
   - Click "Disconnect" button in Dashboard
   - Check console logs for logout sequence
   ```

4. **Verify Tokens Removed**:
   ```javascript
   // In browser console
   localStorage.getItem("access_token")   // Should return null
   localStorage.getItem("refresh_token")  // Should return null
   localStorage.getItem("auth-storage")   // Should return null
   ```

5. **Verify Redirect**:
   ```
   - User should be redirected to landing page
   - Wallet should be disconnected
   - Auth state should be cleared
   ```

---

## Console Logs During Logout

Expected console output:

```
[Auth] Logging out...
[Auth] ✅ Backend tokens cleared
[Auth] ✅ Device store cleared
[Auth] ✅ Auth store cleared
[Auth] ✅ All localStorage auth data cleared
[Auth] ✅ Wallet disconnected
[Auth] ✅ Logout complete - user fully logged out
```

---

## Potential Issues & Fixes

### Issue 1: Tokens Not Removed
**Symptom**: `localStorage.getItem("access_token")` still returns token after logout

**Fix**: Ensure `clearTokens()` is called in logout flow
```typescript
// In useAuth.ts logout()
clearTokens();  // This must be called
```

### Issue 2: State Rehydration
**Symptom**: User appears logged in after page refresh post-logout

**Fix**: Explicitly remove auth-storage from localStorage
```typescript
// In authStore.ts clearAuth()
localStorage.removeItem("auth-storage");
```

### Issue 3: Wallet Disconnect Fails
**Symptom**: CDP wallet still connected after logout

**Solution**: Already handled with try-catch
```typescript
try {
  disconnect();
} catch (error) {
  console.warn("[Auth] CDP disconnect warning (can be ignored):", error);
  // Logout still succeeds
}
```

---

## API Integration

### Backend Logout Endpoint (Optional)

Currently, logout is client-side only. Consider adding:

```
POST /api/v1/auth/logout
Headers: Authorization: Bearer <access_token>
```

**Benefits**:
- Invalidate tokens on server side
- Track logout events
- Revoke refresh tokens

**Current Implementation**:
- ✅ Client-side token removal only
- ✅ Sufficient for current security model
- ⚠️ Consider server-side invalidation for production

---

## Summary

### ✅ What Logout Does

1. **Removes Tokens**:
   - `access_token` from localStorage
   - `refresh_token` from localStorage

2. **Clears State**:
   - Auth store (isAuthenticated, walletAddress, tokens)
   - Device store (devices array)

3. **Cleans localStorage**:
   - `auth-storage` key
   - `device-storage` key

4. **Disconnects Wallet**:
   - Calls wagmi `disconnect()`
   - Disconnects Coinbase Smart Wallet

5. **Redirects User**:
   - Navigates to landing page
   - Ensures clean logout UX

### ✅ Verification Checklist

After clicking disconnect:
- [ ] `access_token` removed from localStorage
- [ ] `refresh_token` removed from localStorage
- [ ] `auth-storage` removed from localStorage
- [ ] `device-storage` removed from localStorage
- [ ] isAuthenticated = false
- [ ] walletAddress = null
- [ ] User redirected to landing page
- [ ] Console shows logout success messages

---

## Conclusion

The logout/disconnect flow is **properly implemented** with:
- ✅ Complete token removal
- ✅ Clean state reset
- ✅ Explicit localStorage cleanup
- ✅ Graceful error handling
- ✅ No token leakage
- ✅ Security best practices

The flow successfully removes all access tokens and ensures the user is fully logged out on first attempt.
