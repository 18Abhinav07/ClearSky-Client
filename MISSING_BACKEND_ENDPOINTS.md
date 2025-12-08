# Missing Backend Endpoints for Frontend Integration

This document lists the API endpoints that are required by the frontend's implementation plan (`MARKETPLACE_IMPLEMENTATION_PLAN.md`) but are not present in the backend's E2E test documentation (`E2E_tesitngmarketpalce.md` and `test-marketpalce.sh`).

The frontend will proceed with its planned implementation, which includes client-side minting via the Story SDK. The backend will need to provide these endpoints to allow the frontend to sync state and complete its workflows.

---

### 1. Purchase Notification (Critical)

- **Endpoint**: `POST /api/v1/user/purchases`
- **Frontend Plan**: After a user successfully mints a license token on the frontend using the Story SDK, the frontend needs to notify the backend about this purchase.
- **Why it's needed**: To keep the user's asset list on the backend synchronized with their on-chain assets. Without this, the backend database will not know that the user has acquired a new license, and it won't appear in their collection (`/api/v1/marketplace/assets/:walletAddress`).
- **Proposed Body**:
  ```json
  {
    "ipId": "0x...",
    "licenseTokenId": "12345",
    "txHash": "0x..."
  }
  ```

---

### 2. Derivative Registration (Critical)

- **Endpoint**: `POST /api/v1/assets/register-derivative`
- **Frontend Plan**: When a user creates a new derivative work and registers it on-chain via the Story SDK, the frontend needs to inform the backend.
- **Why it's needed**: To allow the backend to track the lineage of IP assets and display user-created derivatives in the marketplace. This is essential for the "My Creations" tab and for allowing others to purchase licenses for these new derivatives.
- **Proposed Body**:
  ```json
  {
    "childIpId": "0x...",
    "parentIpId": "0x...",
    "licenseTokenId": "12345", // The license token that was consumed
    "metadata": {
      "title": "My Derivative Work",
      "description": "A new take on the original data.",
      "type": "creative_derivative"
    },
    "txHash": "0x..."
  }
  ```

---

### 3. User's Creations Query

- **Endpoint**: `GET /api/v1/user/creations`
- **Frontend Plan**: The "My Creations" tab needs to display all the IP assets that a user has created and owns.
- **Why it's needed**: The generic `/api/v1/marketplace/assets/:walletAddress` endpoint returns assets a user *owns* (i.e., purchased), but it doesn't provide a way to see assets a user has *created*. A dedicated endpoint is required to populate the "My Creations" section of the user profile. This could potentially be a filter on an existing endpoint, e.g., `GET /api/v1/derivatives?creator=:walletAddress`.

---

### 4. Royalty Status Query

- **Endpoint**: `GET /api/v1/royalty/status/:ipId`
- **Frontend Plan**: The "My Creations" tab will show users the revenue their IP assets have generated.
- **Why it's needed**: While this can be done client-side by querying the blockchain directly, it's more efficient and provides a better user experience if the backend can aggregate and provide this data. This would include total earnings, claimable revenue, and a history of payments.

---

### 5. Authentication Mismatch for Secure Download

- **Endpoint**: `GET /api/v1/marketplace/download/:derivativeId`
- **Backend Implementation**: Requires a `Bearer <JWT>` token for authentication.
- **Frontend Plan**: Uses an EIP-4361 style signature (`signMessage`) to prove wallet ownership.
- **Problem**: The frontend auth is based on the CDP wallet, which primarily uses signatures for authentication. The backend expects a JWT, but there is no documented flow for exchanging a wallet signature for a JWT.
- **Proposed Solution**: The backend should provide an endpoint to handle signature-based verification as planned by the frontend, or a new endpoint `POST /api/v1/auth/wallet-login` must be created to exchange a signature for a JWT.
  ```
  // Proposed new endpoint
  POST /api/v1/auth/wallet-login
  Body: { walletAddress: string, signature: string, message: string }
  Response: { token: string, expiresIn: number }
  ```
