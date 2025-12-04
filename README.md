# ClearSky - CDP + Wagmi Authentication System

A secure, decentralized authentication system built with **Coinbase Developer Platform (CDP)** and **Wagmi**, featuring signature-based device registration and multi-device support.

---

## 🎯 Overview

This project implements a **two-step authentication flow** that maintains the security properties of traditional wallet-based authentication while leveraging CDP's email-based wallet creation:

1. **CDP Email Authentication** → User verifies email and CDP creates an embedded wallet
2. **Signature Verification** → User signs a challenge to prove wallet ownership

This approach ensures:
- ✅ **Cryptographic proof of ownership** (prevents spoofing)
- ✅ **Replay attack protection** (single-use nonces)
- ✅ **Multi-device support** (register multiple devices per wallet)
- ✅ **No browser extensions required** (embedded wallet via CDP)

---

## 🚀 Features

- **CDP Email Authentication**: Passwordless authentication using email OTP
- **Embedded Wallets**: Non-custodial wallets created and managed by CDP
- **Wagmi Integration**: Full compatibility with wagmi hooks for transactions
- **Signature-Based Auth**: Cryptographic proof of wallet ownership
- **Device Management**: Register and manage multiple devices
- **JWT Tokens**: Secure session management with access + refresh tokens
- **Multi-Chain Support**: Base and Base Sepolia networks
- **Type-Safe**: Full TypeScript implementation

---

## 📋 Prerequisites

- Node.js 22+
- A [CDP Portal](https://portal.cdp.coinbase.com) account
- Backend API (see [BACKEND_VALIDATION_GUIDE.md](./BACKEND_VALIDATION_GUIDE.md))

---

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Client

# Install dependencies
npm install --legacy-peer-deps
```

> **Note:** `--legacy-peer-deps` is required due to React 19 compatibility with CDP packages.

### 2. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your CDP credentials:

```env
# Get these from https://portal.cdp.coinbase.com
VITE_CDP_PROJECT_ID=your-project-id-here
VITE_CDP_API_BASE_PATH=https://api.cdp.coinbase.com

# Your backend API URL
VITE_API_BASE_URL=http://localhost:3000

# Optional
VITE_APP_LOGO_URL=https://your-logo-url.com/logo.png
```

### 3. Get Your CDP Project ID

1. Sign in to [CDP Portal](https://portal.cdp.coinbase.com)
2. Create or select a project
3. Go to project settings (gear icon)
4. Copy your **Project ID**
5. Configure your allowed domain: `http://localhost:5173` (for development)

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 🏗️ Architecture

### Folder Structure

```
src/
├── app/
│   ├── providers/          # CDP + Wagmi provider configuration
│   ├── router/             # React Router setup
│   └── store/              # Zustand state management
│
├── pages/                  # Route components
│   ├── Landing/            # Authentication entry point
│   └── Dashboard/          # Main application interface
│
├── components/             # Reusable UI components
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── services/               # API and SDK integrations
│   └── api/
│       └── auth.service.ts # Authentication API calls
│
├── hooks/                  # Custom React hooks
│   └── useAuth.ts          # Main authentication hook
│
├── utils/                  # Utility functions
│   └── device.ts           # Device ID and info generation
│
├── config/                 # Configuration files
│   ├── env.ts              # Environment variables
│   └── routes.ts           # Route constants
│
└── types/                  # TypeScript type definitions
    └── auth.types.ts       # Authentication types
```

---

## 🔄 Authentication Flow

### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Landing Page                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         "Get Started" Button Clicked               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              CDP Email Authentication (OTP)                 │
│                                                             │
│  1. User enters email                                       │
│  2. CDP sends OTP                                           │
│  3. User enters OTP                                         │
│  4. CDP creates embedded wallet                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Wallet Created & Available                    │
│                                                             │
│  - Wallet address available via useAccount()                │
│  - isConnected = true                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Request Challenge from Backend                   │
│                                                             │
│  GET /auth/challenge                                        │
│  Response: { challenge, nonce, expiresAt }                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Sign Challenge with Wallet                       │
│                                                             │
│  - Use wagmi's signMessage hook                             │
│  - User confirms signature in UI                            │
│  - Get signature: 0x1234...                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Send Device Registration to Backend                 │
│                                                             │
│  POST /auth/device-register                                 │
│  {                                                          │
│    walletAddress: "0x742d35...",                            │
│    signature: "0x1234...",                                  │
│    message: "Sign this message...",                         │
│    deviceInfo: { deviceId, deviceName, userAgent }          │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Backend Verifies Signature                         │
│                                                             │
│  1. Extract nonce from message                              │
│  2. Verify challenge not expired                            │
│  3. Recover signer address from signature                   │
│  4. Verify signer matches walletAddress                     │
│  5. Delete nonce (prevent replay)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        Register Device & Generate Tokens                    │
│                                                             │
│  - Check if user exists (by walletAddress)                  │
│  - Create user if new                                       │
│  - Register or update device                                │
│  - Generate JWT access + refresh tokens                     │
│  - Return tokens + device list                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Store Tokens & Navigate to Dashboard              │
│                                                             │
│  - Store tokens in localStorage                             │
│  - Update Zustand auth state                                │
│  - Redirect to /dashboard                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard                               │
│                                                             │
│  - Display wallet info                                      │
│  - Show registered devices                                  │
│  - Access to authenticated features                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Components

### 1. WagmiProvider

Configures CDP and Wagmi integration:

```typescript
// src/app/providers/WagmiProvider.tsx
const cdpConfig: Config = {
  projectId: env.CDP_PROJECT_ID,
  ethereum: {
    createOnLogin: "eoa", // Create EVM account on login
  },
  // ...other config
};

const connector = createCDPEmbeddedWalletConnector({
  cdpConfig,
  providerConfig: {
    chains: [base, baseSepolia],
    transports: { /* ... */ },
  },
});
```

### 2. useAuth Hook

Main authentication logic:

```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const { address, isConnected } = useAccount(); // Wagmi
  const { signMessageAsync } = useSignMessage(); // Wagmi

  const completeDeviceRegistration = async () => {
    // 1. Request challenge
    const challenge = await requestChallenge();

    // 2. Sign challenge
    const signature = await signMessageAsync({
      message: challenge.challenge,
    });

    // 3. Register device
    const response = await registerDevice({
      walletAddress: address,
      signature,
      message: challenge.challenge,
      deviceInfo: getDeviceInfo(),
    });

    // 4. Store tokens
    storeTokens(response.tokens);
    setAuth(response);
  };

  return { completeDeviceRegistration, /* ... */ };
}
```

### 3. Landing Page

Handles the authentication flow:

```typescript
// src/pages/Landing/index.tsx
export default function Landing() {
  const { isConnected, completeDeviceRegistration } = useAuth();

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      // After CDP auth, trigger device registration
      completeDeviceRegistration();
    }
  }, [isConnected]);

  return (
    <div>
      <AuthButton /> {/* CDP component */}
      {/* Loading states, error handling */}
    </div>
  );
}
```

---

## 🔐 Security Features

### Signature Verification

The signature verification step ensures:

1. **Proof of Ownership**: Only the wallet owner can produce valid signatures
2. **No Spoofing**: Attackers cannot register devices for other wallets
3. **Cryptographic Security**: Uses EIP-191 standard message signing

### Replay Attack Prevention

- **Single-use nonces**: Each challenge can only be used once
- **Time-based expiration**: Challenges expire after 5 minutes
- **Server-side validation**: Backend deletes nonce after use

### Device Management

- **Unique device IDs**: Each device has a persistent identifier
- **Device tracking**: Track registration and last usage times
- **Multi-device support**: Users can access from multiple devices

---

## 🌐 Backend Integration

### Required Endpoints

Your backend must implement these endpoints:

#### 1. GET /auth/challenge

Generates a challenge for the user to sign.

**Response:**
```json
{
  "challenge": "Sign this message to authenticate: 1733356800-abc123",
  "nonce": "abc123",
  "expiresAt": "2025-12-04T12:00:00Z"
}
```

#### 2. POST /auth/device-register

Registers a device after verifying signature.

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x1234...",
  "message": "Sign this message to authenticate: 1733356800-abc123",
  "deviceInfo": {
    "deviceId": "uuid-here",
    "deviceName": "Chrome on MacOS",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "devices": [...],
  "limited": false,
  "tokens": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

**See [BACKEND_VALIDATION_GUIDE.md](./BACKEND_VALIDATION_GUIDE.md) for complete implementation details.**

---

## 📚 API Documentation

### Authentication Service

Located at `src/services/api/auth.service.ts`

#### requestChallenge()

```typescript
async function requestChallenge(): Promise<AuthChallenge>
```

Requests a challenge from the backend for signing.

#### registerDevice()

```typescript
async function registerDevice(
  request: DeviceRegistrationRequest
): Promise<DeviceRegistrationResponse>
```

Registers a device with signature verification.

#### storeTokens() / getStoredTokens() / clearTokens()

Token management utilities for localStorage.

---

## 🎨 Customization

### Theme Customization

Edit `src/app/providers/WagmiProvider.tsx`:

```typescript
const themeOverrides = {
  "colors-bg-default": "#ffffff",
  "colors-bg-primary": "#0052ff",
  "colors-fg-default": "#000000",
  // ... more theme variables
};

<CDPReactProvider config={cdpConfig} theme={themeOverrides}>
```

See [CDP Theming Documentation](https://docs.cdp.coinbase.com/embedded-wallets/theming) for all available theme tokens.

### Adding Custom Hooks

Create hooks in `src/hooks/`:

```typescript
// src/hooks/useWalletBalance.ts
export function useWalletBalance() {
  const { address } = useAccount();
  // Your custom logic
}
```

---

## 🧪 Testing

### Manual Testing Flow

1. **Start the dev server**: `npm run dev`
2. **Navigate to landing page**: [http://localhost:5173](http://localhost:5173)
3. **Click "Get Started"**: Triggers CDP authentication
4. **Enter email**: Receive OTP from CDP
5. **Enter OTP**: Wallet is created
6. **Sign challenge**: Approve signature request
7. **View dashboard**: See wallet info and devices

### Testing Backend Integration

```bash
# 1. Request challenge
curl http://localhost:3000/auth/challenge

# 2. Register device (use actual signature from frontend)
curl -X POST http://localhost:3000/auth/device-register \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Wallet not connected"

**Cause:** CDP authentication didn't complete.

**Solution:**
- Check CDP Project ID in `.env`
- Verify domain is configured in CDP Portal
- Check browser console for CDP errors

#### 2. "Challenge not found or expired"

**Cause:** Challenge expired or was already used.

**Solution:**
- Ensure backend challenge TTL is reasonable (5 minutes)
- Check that challenge is deleted after use

#### 3. "Signature verification failed"

**Cause:** Message doesn't match or signature is invalid.

**Solution:**
- Ensure message is exactly the same on frontend and backend
- Check that wallet address is normalized to lowercase
- Verify signature format (0x prefix)

#### 4. Peer dependency warnings

**Cause:** React 19 compatibility with CDP packages.

**Solution:**
- Use `--legacy-peer-deps` flag when installing
- This is expected and doesn't affect functionality

---

## 📖 Additional Resources

- [CDP Documentation](https://docs.cdp.coinbase.com)
- [Wagmi Documentation](https://wagmi.sh)
- [Backend Validation Guide](./BACKEND_VALIDATION_GUIDE.md)
- [CDP Portal](https://portal.cdp.coinbase.com)

---

## 📝 License

[Your License Here]

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Contact: your-email@example.com

---

**Built with ❤️ using CDP + Wagmi**
