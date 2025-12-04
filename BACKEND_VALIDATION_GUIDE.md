# Backend Validation Guide: CDP + Wagmi Authentication

## Overview

This document explains how the backend should validate CDP + Wagmi authentication requests and implement secure device registration.

---

## Authentication Flow Architecture

```
┌─────────────┐
│   Frontend  │
│   (CDP +    │
│    Wagmi)   │
└──────┬──────┘
       │
       │ 1. Request Challenge
       ├──────────────────────────────────────┐
       │                                      │
       │  GET /auth/challenge                 │
       │                                      │
       │                                      ▼
       │                            ┌─────────────────┐
       │                            │    Backend      │
       │                            │                 │
       │                            │  1. Generate    │
       │                            │     nonce       │
       │                            │  2. Create      │
       │                            │     challenge   │
       │  ◄─────────────────────────│     message     │
       │                            │  3. Store       │
       │  { challenge, nonce }      │     temporarily │
       │                            └─────────────────┘
       │
       │ 2. User Signs Challenge
       │    (via Wagmi signMessage)
       │
       │ 3. Send Registration Request
       ├──────────────────────────────────────┐
       │                                      │
       │  POST /auth/device-register          │
       │  {                                   │
       │    walletAddress,                    │
       │    signature,                        │
       │    message,                          │
       │    deviceInfo                        │
       │  }                                   │
       │                                      ▼
       │                            ┌─────────────────┐
       │                            │    Backend      │
       │                            │                 │
       │                            │  4. Verify      │
       │                            │     signature   │
       │                            │  5. Check user  │
       │                            │     exists      │
       │  ◄─────────────────────────│  6. Register or │
       │                            │     login       │
       │  { tokens, devices }       │  7. Return      │
       │                            │     tokens      │
       │                            └─────────────────┘
       │
       ▼
   Dashboard
```

---

## API Endpoints

### 1. GET /auth/challenge

**Purpose:** Generate a challenge message for the user to sign with their wallet.

#### Request
```http
GET /auth/challenge
```

#### Response
```json
{
  "challenge": "Sign this message to authenticate: 1733356800-abc123def456",
  "nonce": "abc123def456",
  "expiresAt": "2025-12-04T12:00:00Z"
}
```

#### Backend Implementation

```typescript
import { randomBytes } from 'crypto';

interface Challenge {
  challenge: string;
  nonce: string;
  expiresAt: Date;
}

// Store challenges temporarily (use Redis in production)
const challenges = new Map<string, { expiresAt: Date }>();

export async function generateChallenge(): Promise<Challenge> {
  // Generate unique nonce
  const nonce = randomBytes(32).toString('hex');

  // Create challenge message
  const timestamp = Date.now();
  const challenge = `Sign this message to authenticate: ${timestamp}-${nonce}`;

  // Set expiration (5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Store challenge temporarily
  challenges.set(nonce, { expiresAt });

  // Clean up expired challenges
  cleanupExpiredChallenges();

  return {
    challenge,
    nonce,
    expiresAt: expiresAt.toISOString(),
  };
}

function cleanupExpiredChallenges() {
  const now = Date.now();
  for (const [nonce, data] of challenges.entries()) {
    if (data.expiresAt.getTime() < now) {
      challenges.delete(nonce);
    }
  }
}
```

---

### 2. POST /auth/device-register

**Purpose:** Register a new device or login existing user with signature verification.

This endpoint **replaces** the old `GET /login/:walletPublicKey` endpoint.

#### Request
```http
POST /auth/device-register
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x1234567890abcdef...",
  "message": "Sign this message to authenticate: 1733356800-abc123def456",
  "deviceInfo": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceName": "Chrome on MacOS",
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### Response (New Device)
```json
{
  "devices": [
    {
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "deviceName": "Chrome on MacOS",
      "registeredAt": "2025-12-04T12:00:00Z",
      "lastUsed": "2025-12-04T12:00:00Z"
    }
  ],
  "limited": false,
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Response (Existing User)
```json
{
  "devices": [
    {
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "deviceName": "Chrome on MacOS",
      "registeredAt": "2025-12-01T10:00:00Z",
      "lastUsed": "2025-12-04T12:00:00Z"
    },
    {
      "deviceId": "660e8400-e29b-41d4-a716-446655440001",
      "deviceName": "Safari on iOS",
      "registeredAt": "2025-12-02T14:00:00Z",
      "lastUsed": "2025-12-03T08:00:00Z"
    }
  ],
  "limited": false,
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Backend Validation Logic

### Step-by-Step Implementation

```typescript
import { verifyMessage } from 'ethers';
import jwt from 'jsonwebtoken';

interface DeviceRegistrationRequest {
  walletAddress: string;
  signature: string;
  message: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    userAgent: string;
  };
}

interface DeviceRegistrationResponse {
  devices: Device[];
  limited: boolean;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

export async function registerDevice(
  request: DeviceRegistrationRequest
): Promise<DeviceRegistrationResponse> {

  // ========================================
  // STEP 1: Validate Request Format
  // ========================================

  if (!request.walletAddress || !request.signature || !request.message) {
    throw new Error('Missing required fields');
  }

  // Normalize wallet address to lowercase
  const walletAddress = request.walletAddress.toLowerCase();

  // ========================================
  // STEP 2: Extract and Validate Nonce
  // ========================================

  // Extract nonce from message
  // Message format: "Sign this message to authenticate: {timestamp}-{nonce}"
  const noncePart = request.message.split(': ')[1];
  if (!noncePart) {
    throw new Error('Invalid message format');
  }

  const nonce = noncePart.split('-')[1];
  if (!nonce) {
    throw new Error('Invalid nonce format');
  }

  // Check if challenge exists and is not expired
  const challengeData = challenges.get(nonce);
  if (!challengeData) {
    throw new Error('Challenge not found or expired');
  }

  if (challengeData.expiresAt.getTime() < Date.now()) {
    challenges.delete(nonce);
    throw new Error('Challenge expired');
  }

  // Delete challenge after use (prevent replay attacks)
  challenges.delete(nonce);

  // ========================================
  // STEP 3: Verify Signature
  // ========================================

  let recoveredAddress: string;
  try {
    // Recover the address that signed the message
    recoveredAddress = verifyMessage(request.message, request.signature);
    recoveredAddress = recoveredAddress.toLowerCase();
  } catch (error) {
    throw new Error('Invalid signature');
  }

  // Verify that recovered address matches claimed wallet address
  if (recoveredAddress !== walletAddress) {
    throw new Error('Signature verification failed: address mismatch');
  }

  console.log('✅ Signature verified for wallet:', walletAddress);

  // ========================================
  // STEP 4: Check User Existence
  // ========================================

  let user = await database.users.findOne({ walletAddress });
  let isNewUser = false;

  if (!user) {
    // New user - create user record
    isNewUser = true;
    user = await database.users.create({
      walletAddress,
      createdAt: new Date(),
    });
    console.log('📝 New user created:', walletAddress);
  } else {
    console.log('✅ Existing user found:', walletAddress);
  }

  // ========================================
  // STEP 5: Register or Update Device
  // ========================================

  const { deviceId, deviceName, userAgent } = request.deviceInfo;

  let device = await database.devices.findOne({
    userId: user.id,
    deviceId,
  });

  if (!device) {
    // New device - register it
    device = await database.devices.create({
      userId: user.id,
      deviceId,
      deviceName,
      userAgent,
      registeredAt: new Date(),
      lastUsed: new Date(),
    });
    console.log('📱 New device registered:', deviceName);
  } else {
    // Existing device - update last used
    device.lastUsed = new Date();
    await database.devices.update(device);
    console.log('📱 Device updated:', deviceName);
  }

  // ========================================
  // STEP 6: Get All User Devices
  // ========================================

  const allDevices = await database.devices.findMany({
    userId: user.id,
  });

  // ========================================
  // STEP 7: Generate JWT Tokens
  // ========================================

  const JWT_SECRET = process.env.JWT_SECRET!;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

  const tokenPayload = {
    userId: user.id,
    walletAddress: user.walletAddress,
    deviceId,
  };

  const access_token = jwt.sign(
    tokenPayload,
    JWT_SECRET,
    { expiresIn: '1h' } // Access token expires in 1 hour
  );

  const refresh_token = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' } // Refresh token expires in 30 days
  );

  // ========================================
  // STEP 8: Return Response
  // ========================================

  return {
    devices: allDevices.map(d => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      registeredAt: d.registeredAt.toISOString(),
      lastUsed: d.lastUsed.toISOString(),
    })),
    limited: false, // Set to true if you implement device limits
    tokens: {
      access_token,
      refresh_token,
    },
  };
}
```

---

## Security Considerations

### 1. Signature Verification

**Critical:** The signature verification step is **mandatory** and provides:

- **Proof of wallet ownership**: Only the wallet owner can produce valid signatures
- **Prevention of spoofing**: Attackers cannot register devices for other wallets
- **Replay attack protection**: Each nonce is single-use

```typescript
// ✅ CORRECT: Verify signature before any operations
const recoveredAddress = verifyMessage(message, signature);
if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
  throw new Error('Invalid signature');
}

// ❌ WRONG: Never trust wallet address without verification
// This allows anyone to register devices for any wallet!
const user = await database.users.findOne({ walletAddress });
```

### 2. Nonce Management

**Requirements:**

- Nonces must be single-use (delete after verification)
- Nonces must expire (recommend 5 minutes)
- Nonces must be cryptographically random
- Use Redis or similar for production (not in-memory Map)

```typescript
// ✅ CORRECT: Check and delete nonce
const challengeData = challenges.get(nonce);
if (!challengeData || challengeData.expiresAt < Date.now()) {
  throw new Error('Invalid or expired challenge');
}
challenges.delete(nonce); // Prevent replay attacks

// ❌ WRONG: Reusable nonces allow replay attacks
if (challengeData.expiresAt < Date.now()) {
  throw new Error('Expired challenge');
}
// Missing: challenges.delete(nonce)
```

### 3. Challenge Message Format

**Recommended format:**

```
Sign this message to authenticate: {timestamp}-{nonce}
```

**Why this format?**

- Human-readable for wallet UIs
- Includes timestamp for additional context
- Includes nonce for uniqueness
- Cannot be reused across sessions

### 4. Token Security

```typescript
// JWT Payload should include:
const tokenPayload = {
  userId: user.id,
  walletAddress: user.walletAddress,
  deviceId: device.deviceId,
  // iat and exp are added automatically by jwt.sign
};

// Access token: Short-lived (1 hour)
const access_token = jwt.sign(tokenPayload, JWT_SECRET, {
  expiresIn: '1h',
});

// Refresh token: Longer-lived (30 days), fewer claims
const refresh_token = jwt.sign(
  { userId: user.id },
  JWT_REFRESH_SECRET,
  { expiresIn: '30d' }
);
```

---

## Differences from Old Wallet Flow

| Aspect | Old Flow (Direct Wallet) | New Flow (CDP + Wagmi) |
|--------|--------------------------|------------------------|
| **Authentication** | Browser extension wallet | CDP Email OTP → Wallet creation |
| **Endpoint** | `GET /login/:walletPublicKey` | `POST /auth/device-register` |
| **Signature Source** | Frontend directly signs | Frontend uses Wagmi `signMessage` |
| **Wallet Address Source** | User's external wallet | CDP-created embedded wallet |
| **Challenge Generation** | None or client-side | Backend-generated via `/auth/challenge` |
| **Verification** | Backend verifies signature | Backend verifies signature (same) |
| **Device Registration** | After signature verification | After signature verification (same) |

---

## Testing the Implementation

### Test Case 1: New User Registration

```bash
# 1. Request challenge
curl -X GET http://localhost:3000/auth/challenge

# Response:
# {
#   "challenge": "Sign this message to authenticate: 1733356800-abc123",
#   "nonce": "abc123",
#   "expiresAt": "2025-12-04T12:05:00Z"
# }

# 2. Sign message with wallet (done in frontend)
# signature = await signMessage({ message: challenge })

# 3. Register device
curl -X POST http://localhost:3000/auth/device-register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "signature": "0x1234...",
    "message": "Sign this message to authenticate: 1733356800-abc123",
    "deviceInfo": {
      "deviceId": "uuid-here",
      "deviceName": "Chrome on MacOS",
      "userAgent": "Mozilla/5.0..."
    }
  }'

# Expected: New user + device created, tokens returned
```

### Test Case 2: Invalid Signature

```bash
curl -X POST http://localhost:3000/auth/device-register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "signature": "0xINVALID",
    "message": "Sign this message to authenticate: 1733356800-abc123",
    "deviceInfo": {...}
  }'

# Expected: 401 Unauthorized - "Invalid signature"
```

### Test Case 3: Expired Challenge

```bash
# Wait 6 minutes after getting challenge, then try to register
# Expected: 401 Unauthorized - "Challenge expired"
```

### Test Case 4: Replay Attack

```bash
# Try to use the same signature + message twice
# Expected: First request succeeds, second fails with "Challenge not found"
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
```

### Devices Table

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  user_agent TEXT,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
```

---

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clearsky

# Redis (for challenge storage in production)
REDIS_URL=redis://localhost:6379

# CORS (allow frontend domain)
CORS_ORIGIN=http://localhost:5173
```

---

## Common Errors and Solutions

### Error: "Signature verification failed"

**Cause:** The signature doesn't match the wallet address.

**Solution:**
- Ensure message is exactly the same on frontend and backend
- Check that wallet address is normalized to lowercase
- Verify the signature format is correct (0x prefix)

### Error: "Challenge not found or expired"

**Cause:** Challenge was already used or expired.

**Solution:**
- Ensure challenge expiration is reasonable (5 minutes)
- Check that nonce is extracted correctly from message
- Verify challenge cleanup logic doesn't remove active challenges

### Error: Address mismatch

**Cause:** Recovered address doesn't match claimed address.

**Solution:**
- Always normalize addresses to lowercase before comparison
- Ensure frontend sends the correct wallet address from `useAccount()`

---

## Production Checklist

- [ ] Use Redis for challenge storage (not in-memory Map)
- [ ] Implement rate limiting on `/auth/challenge` endpoint
- [ ] Add device limit per user (e.g., max 5 devices)
- [ ] Implement token refresh endpoint
- [ ] Add logging for security events
- [ ] Set up monitoring for failed authentication attempts
- [ ] Use HTTPS in production
- [ ] Rotate JWT secrets regularly
- [ ] Implement CSRF protection
- [ ] Add IP-based rate limiting
- [ ] Set up alerts for suspicious activity

---

## Additional Security Features

### Device Limit

```typescript
const MAX_DEVICES_PER_USER = 5;

const deviceCount = await database.devices.count({ userId: user.id });

if (deviceCount >= MAX_DEVICES_PER_USER && !device) {
  return {
    devices: allDevices,
    limited: true, // Signal to frontend
    tokens: null, // No tokens returned
  };
}
```

### Token Refresh

```typescript
export async function refreshAccessToken(refresh_token: string) {
  try {
    const payload = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
    const user = await database.users.findOne({ id: payload.userId });

    const new_access_token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { access_token: new_access_token };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
```

---

## Conclusion

This backend validation logic maintains the same security properties as your old wallet-based authentication while integrating with CDP + Wagmi:

✅ **Signature verification** prevents unauthorized device registration
✅ **Nonce system** prevents replay attacks
✅ **Challenge expiration** limits attack window
✅ **Device tracking** enables multi-device support
✅ **JWT tokens** provide secure session management

The key difference is that CDP handles the wallet creation and OTP verification, while your backend still verifies wallet ownership through signature validation.
