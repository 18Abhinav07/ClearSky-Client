# Clear Sky Marketplace & User Profile - Complete Implementation Plan

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Story Protocol Integration Flow](#story-protocol-integration-flow)
3. [Frontend Components Structure](#frontend-components-structure)
4. [API Integration](#api-integration)
5. [Story SDK Service Layer](#story-sdk-service-layer)
6. [Component Implementation Details](#component-implementation-details)
7. [State Management](#state-management)
8. [Theme & Styling](#theme--styling)

---

## 1. Architecture Overview

### Tech Stack
- **Framework**: React 19.2.0 + TypeScript
- **Styling**: Tailwind CSS (Dark/Slate Industrial Theme)
- **Auth**: @coinbase/cdp-react (Embedded Smart Wallet)
- **Blockchain**: @story-protocol/core-sdk v1.4.2 + viem v2.41.2
- **State Management**: @tanstack/react-query v5.90.11
- **Routing**: react-router-dom v7.10.0

### Key Contracts (Story Protocol Testnet)
```typescript
export const STORY_CONTRACTS = {
  SPG_NFT_CONTRACT: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
  ROYALTY_POLICY_LAP: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
  WIP_TOKEN: "0x1514000000000000000000000000000000000000",
  STORY_TESTNET_CHAIN_ID: 1513,
  STORY_TESTNET_RPC: "https://testnet.storyrpc.io"
} as const;
```

---

## 2. Story Protocol Integration Flow

### 🟢 0. Asset Owner Setup (Backend Process)

**When**: User searches for specific data → Backend generates refined report

**Backend Workflow**:
```typescript
// 1. Aggregate sensor data
const aggregatedData = await aggregateSensorData({ city, type, startDate, endDate });

// 2. Run AI analysis
const aiReport = await generateAIAnalysis(aggregatedData);

// 3. Upload metadata to IPFS
const ipfsHash = await uploadToIPFS({
  title: `${city} ${type} Analysis - ${dateRange}`,
  description: aiReport.summary,
  content: aiReport.fullReport,
  dataSource: "ClearSky DePIN Network"
});

// 4. Register IP Asset on Story Protocol
const registerResponse = await storyClient.ipAsset.register({
  nftContract: SPG_NFT_CONTRACT,
  tokenId: await mintNFT(),
  ipMetadata: {
    ipMetadataURI: `ipfs://${ipfsHash}`,
    ipMetadataHash: keccak256(ipfsHash)
  }
});

// 5. Attach License Terms with commercialRevShare
const attachResponse = await storyClient.license.registerPILTermsAndAttach({
  ipId: registerResponse.ipId,
  terms: {
    transferable: true,
    royaltyPolicy: ROYALTY_POLICY_LAP,
    commercialUse: true,
    commercialRevShare: 10, // 10% to parent
    currency: WIP_TOKEN,
    mintingFee: parseEther("50"), // 50 WIP
    commercialAttribution: true
  }
});

// 6. Store in database
await db.refinedReports.create({
  ipId: registerResponse.ipId,
  licenseTermsId: attachResponse.licenseTermsId,
  searchParams: { city, type, startDate, endDate },
  priceWIP: "50",
  status: "MINTED"
});
```

**Response to Frontend**:
```json
{
  "raw_batches": [...],
  "refined_report": {
    "status": "MINTED",
    "ipId": "0x...",
    "licenseTermsId": "5",
    "price_wip": "50",
    "title": "Mumbai PM2.5 Analysis - Last 7 Days",
    "description": "AI-generated air quality insights"
  }
}
```

---

### 🟠 1. User Views Asset (Frontend)

**Component**: `MarketplaceSearch.tsx`

**State**:
```typescript
const [searchResults, setSearchResults] = useState<{
  raw_batches: RawBatch[];
  refined_report: RefinedReport | null;
}>();
const [isGenerating, setIsGenerating] = useState(false);
```

**UI Flow**:
```typescript
// User enters search parameters
const handleSearch = async () => {
  setIsGenerating(true);

  const response = await fetch("/api/v1/marketplace/search", {
    method: "POST",
    body: JSON.stringify({ city, type, start_date, end_date })
  });

  const data = await response.json();

  if (data.refined_report?.status === "PROCESSING") {
    // Show loader: "Generating Intelligence & Minting IP..."
    pollForCompletion(data.refined_report.jobId);
  } else {
    // Show report card with "Mint License" button
    setSearchResults(data);
    setIsGenerating(false);
  }
};
```

---

### 🟠 2. User Buys License (Frontend → Blockchain)

**Component**: `RefinedReportCard.tsx`

**Story SDK Call**:
```typescript
const handleBuyLicense = async (report: RefinedReport) => {
  try {
    // Step 1: Check WIP token allowance
    const allowance = await readContract({
      address: WIP_TOKEN,
      abi: erc20Abi,
      functionName: "allowance",
      args: [userAddress, LICENSE_ATTACHMENT_WORKFLOW]
    });

    // Step 2: Approve WIP tokens if needed
    if (allowance < parseEther(report.price_wip)) {
      const approveTx = await writeContract({
        address: WIP_TOKEN,
        abi: erc20Abi,
        functionName: "approve",
        args: [LICENSE_ATTACHMENT_WORKFLOW, parseEther(report.price_wip)]
      });
      await waitForTransaction(approveTx);
    }

    // Step 3: Mint License Token
    const mintResponse = await storyClient.license.mintLicenseTokens({
      licensorIpId: report.ipId,
      licenseTermsId: report.licenseTermsId,
      amount: 1,
      receiver: userAddress,
      maxMintingFee: parseEther(report.price_wip),
      maxRevenueShare: 100
    });

    // Step 4: Wait for transaction
    await waitForTransaction(mintResponse.txHash);

    // Step 5: Sync with backend
    await fetch("/api/v1/user/purchases", {
      method: "POST",
      body: JSON.stringify({
        ipId: report.ipId,
        licenseTokenId: mintResponse.licenseTokenId,
        txHash: mintResponse.txHash
      })
    });

    toast.success("License purchased successfully!");

  } catch (error) {
    toast.error("Failed to purchase license");
  }
};
```

**What Happens**:
- ✅ User's wallet opens (CDP modal)
- ✅ User approves WIP token spending
- ✅ User confirms transaction
- ✅ Blockchain mints license NFT to user's wallet
- ✅ Minting fee (50 WIP) goes to parent IP's Royalty Vault
- ✅ Backend records purchase

---

### 🟣 3. User Downloads Protected File

**Component**: `MyCollectionTab.tsx`

**Flow**:
```typescript
const handleSecureDownload = async (licenseTokenId: string, ipId: string) => {
  try {
    // Step A: Sign message to prove wallet ownership (off-chain, no gas)
    const message = `Download access request for IP: ${ipId}\nTimestamp: ${Date.now()}`;
    const signature = await signMessage({ message });

    // Step B: Send signature to backend for verification
    const response = await fetch("/api/v1/access/verify-download", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ipId,
        licenseTokenId,
        walletAddress: userAddress,
        signature,
        message
      })
    });

    // Step C: Backend verifies ownership on-chain
    // Backend checks: Does this wallet own this licenseTokenId?
    // If YES → generates 60-second presigned S3 URL
    // If NO → returns 403 Forbidden

    if (!response.ok) {
      throw new Error("Access denied - License not found");
    }

    const { downloadUrl } = await response.json();

    // Step D: Download file
    window.open(downloadUrl, "_blank");

  } catch (error) {
    toast.error("Download failed - Please verify you own this license");
  }
};
```

**Backend Verification** (`/api/v1/access/verify-download`):
```typescript
// 1. Verify signature
const recoveredAddress = await verifyMessage({ message, signature });
if (recoveredAddress !== walletAddress) {
  return res.status(401).json({ error: "Invalid signature" });
}

// 2. Check license ownership on-chain
const ownerOf = await publicClient.readContract({
  address: LICENSE_NFT_CONTRACT,
  abi: licenseNFTAbi,
  functionName: "ownerOf",
  args: [licenseTokenId]
});

if (ownerOf !== walletAddress) {
  return res.status(403).json({ error: "License not owned by wallet" });
}

// 3. Generate presigned S3 URL (60 seconds expiry)
const downloadUrl = await s3.getSignedUrl("getObject", {
  Bucket: "clearsky-protected-assets",
  Key: `refined-reports/${ipId}.pdf`,
  Expires: 60
});

return res.json({ downloadUrl });
```

---

### 🔵 4. Creating Derivative (Child IP)

**Component**: `CreateDerivativeModal.tsx`

**Props**:
```typescript
interface CreateDerivativeModalProps {
  parentIpId: string;
  parentLicenseTokenId: string; // The license the user purchased
  onSuccess: () => void;
}
```

**Flow**:
```typescript
const handleCreateDerivative = async (file: File, metadata: DerivativeMetadata) => {
  try {
    // Step 1: Upload user's derivative file to IPFS
    const ipfsHash = await uploadFileToIPFS(file);

    // Step 2: Register derivative IP asset
    const derivativeResponse = await storyClient.ipAsset.registerDerivativeIpAsset({
      nft: {
        type: "mint",
        spgNftContract: SPG_NFT_CONTRACT
      },
      derivData: {
        parentIpIds: [parentIpId],
        licenseTermsIds: [parentLicenseTermsId]
      },
      ipMetadata: {
        ipMetadataURI: `ipfs://${ipfsHash}`,
        ipMetadataHash: keccak256(ipfsHash),
        nftMetadataURI: `ipfs://${ipfsHash}/metadata.json`,
        nftMetadataHash: keccak256(metadataJson)
      }
    });

    // What happens on-chain:
    // ✅ Burns the license token (licenseTokenId)
    // ✅ Mints new NFT for derivative
    // ✅ Registers new IP asset
    // ✅ Links child IP to parent IP
    // ✅ Child inherits parent's license terms

    await waitForTransaction(derivativeResponse.txHash);

    // Step 3: Sync with backend
    await fetch("/api/v1/assets/register-derivative", {
      method: "POST",
      body: JSON.stringify({
        childIpId: derivativeResponse.ipId,
        parentIpId: parentIpId,
        licenseTokenId: parentLicenseTokenId,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          type: "creative_derivative"
        },
        txHash: derivativeResponse.txHash
      })
    });

    toast.success("Derivative created successfully!");
    onSuccess();

  } catch (error) {
    toast.error("Failed to create derivative");
  }
};
```

**Backend Storage** (`/api/v1/assets/register-derivative`):
```typescript
await db.derivatives.create({
  childIpId: body.childIpId,
  parentIpId: body.parentIpId,
  creatorAddress: walletAddress,
  metadata: body.metadata,
  txHash: body.txHash,
  createdAt: new Date()
});

// This allows us to query derivatives by parent in Marketplace Component 3
```

---

### 🟠 6. Further Buying from Child IP

**Component**: `DerivativesGallery.tsx` (Marketplace Tier 3)

**Same as buying from parent**:
```typescript
const handleBuyDerivativeLicense = async (derivative: DerivativeAsset) => {
  // Exact same flow as buying from parent IP
  const mintResponse = await storyClient.license.mintLicenseTokens({
    licensorIpId: derivative.childIpId, // Child IP now
    licenseTermsId: derivative.licenseTermsId, // Inherited from parent
    amount: 1,
    receiver: userAddress,
    maxMintingFee: parseEther(derivative.price_wip),
    maxRevenueShare: 100
  });

  // Minting fee goes to child's Royalty Vault
};
```

---

### 🔴 7. Royalty Distribution

**Component**: `MyCreationsTab.tsx`

**Step 1: Pay Child IP** (Done by marketplace/buyer):
```typescript
// When someone buys from a derivative
const payResponse = await storyClient.royalty.payRoyaltyOnBehalf({
  receiverIpId: childIpId,
  payerIpId: "0x0000000000000000000000000000000000000000", // Zero address
  token: WIP_TOKEN,
  amount: parseEther("100") // Payment amount
});

// On-chain distribution:
// - 10 WIP → Royalty Policy (for parent)
// - 90 WIP → Child's Royalty Vault
```

**Step 2: Parent Claims Revenue**:
```typescript
const handleClaimRevenue = async (parentIpId: string, childIpIds: string[]) => {
  try {
    // Check claimable revenue first
    const claimableResponse = await storyClient.royalty.claimableRevenue({
      royaltyVaultIpId: parentIpId,
      account: userAddress,
      snapshotIds: [],
      token: WIP_TOKEN
    });

    if (BigInt(claimableResponse.amount) === 0n) {
      toast.info("No revenue to claim");
      return;
    }

    // Claim all revenue from child IPs
    const claimResponse = await storyClient.royalty.claimAllRevenue({
      ancestorIpId: parentIpId,
      claimer: parentIpId,
      currencyTokens: [WIP_TOKEN],
      childIpIds: childIpIds,
      royaltyPolicies: [ROYALTY_POLICY_LAP]
    });

    await waitForTransaction(claimResponse.txHash);

    // Now revenue is in parent's Royalty Vault
    // Transfer to personal wallet
    const transferResponse = await storyClient.ipAccount.execute({
      ipId: parentIpId,
      to: WIP_TOKEN,
      value: 0,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [userAddress, claimableResponse.amount]
      })
    });

    await waitForTransaction(transferResponse.txHash);

    toast.success(`Claimed ${formatEther(claimableResponse.amount)} WIP`);

  } catch (error) {
    toast.error("Failed to claim revenue");
  }
};
```

---

## 3. Frontend Components Structure

```
src/
├── pages/
│   ├── Marketplace/
│   │   ├── index.tsx                    # Main marketplace page
│   │   ├── MarketplaceSearch.tsx        # Search bar + filters
│   │   ├── RawDataList.tsx              # Tier 1: Raw CSV downloads
│   │   ├── RefinedReportsGrid.tsx       # Tier 2: IP Assets (reports)
│   │   └── DerivativesGallery.tsx       # Tier 3: Community art
│   │
│   └── UserProfile/
│       ├── index.tsx                    # Main profile page (tabs)
│       ├── MyDevicesTab.tsx             # Tab A: Existing devices
│       ├── MyCollectionTab.tsx          # Tab B: Purchased licenses
│       └── MyCreationsTab.tsx           # Tab C: Owned IP assets
│
├── components/
│   ├── Marketplace/
│   │   ├── RefinedReportCard.tsx        # Card with "Mint License" button
│   │   ├── DerivativeCard.tsx           # Card for community art
│   │   ├── GeneratingLoader.tsx         # Pulsing skeleton during mint
│   │   └── CreateDerivativeModal.tsx    # Upload derivative UI
│   │
│   ├── UserProfile/
│   │   ├── LicenseCard.tsx              # Purchased license display
│   │   ├── CreationCard.tsx             # Owned IP asset display
│   │   └── RevenueClaimButton.tsx       # Claim royalties
│   │
│   └── Auth/
│       ├── AuthModal.tsx                # ✅ Already exists
│       └── CDPEmailAuth.tsx             # ✅ Already exists
│
├── services/
│   ├── story/
│   │   ├── StoryService.ts              # Main Story SDK wrapper
│   │   ├── LicenseService.ts            # License operations
│   │   ├── RoyaltyService.ts            # Royalty operations
│   │   └── types.ts                     # Story-related types
│   │
│   └── api/
│       ├── marketplace.service.ts       # Marketplace API calls
│       ├── user-assets.service.ts       # User profile API calls
│       └── secure-download.service.ts   # Download verification
│
├── hooks/
│   ├── useStoryClient.ts                # Story SDK client hook
│   ├── useMarketplace.ts                # Marketplace data fetching
│   ├── useUserAssets.ts                 # User's licenses/creations
│   └── useAuth.ts                       # ✅ Already exists
│
└── config/
    ├── story-contracts.ts               # Story Protocol addresses
    └── routes.ts                        # ✅ Already exists
```

---

## 4. API Integration

### Marketplace APIs

#### POST `/api/v1/marketplace/search`

**Request**:
```typescript
interface SearchRequest {
  city: string;           // "Mumbai"
  type: string;           // "PM25", "PM10", "CO2"
  start_date: string;     // ISO date
  end_date: string;       // ISO date
}
```

**Response**:
```typescript
interface SearchResponse {
  raw_batches: RawBatch[];
  refined_report: RefinedReport | null;
}

interface RawBatch {
  batchId: string;
  url: string;
  size: string;
  recordCount: number;
  timeRange: { start: string; end: string };
}

interface RefinedReport {
  status: "MINTED" | "PROCESSING";
  ipId?: string;
  licenseTermsId?: string;
  price_wip: string;
  title: string;
  description: string;
  jobId?: string; // For polling if PROCESSING
}
```

**Frontend Handling**:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ["marketplace-search", searchParams],
  queryFn: () => searchMarketplace(searchParams),
  enabled: !!searchParams.city
});

// If refined_report.status === "PROCESSING"
// Poll every 3 seconds until status === "MINTED"
```

---

#### GET `/api/v1/marketplace/derivatives?parentIpId={ipId}`

**Response**:
```typescript
interface DerivativeAsset {
  childIpId: string;
  parentIpId: string;
  creatorAddress: string;
  metadata: {
    title: string;
    description: string;
    type: "creative_derivative" | "remix" | "analysis";
    thumbnailUrl?: string;
  };
  licenseTermsId: string;
  price_wip: string;
  createdAt: string;
}
```

---

### User Profile APIs

#### GET `/api/v1/user/purchases`

**Response**:
```typescript
interface PurchasedLicense {
  licenseTokenId: string;
  ipId: string;
  title: string;
  description: string;
  purchasedAt: string;
  txHash: string;
  canCreateDerivative: boolean;
}
```

---

#### GET `/api/v1/user/creations`

**Response**:
```typescript
interface OwnedIPAsset {
  ipId: string;
  metadata: {
    title: string;
    description: string;
  };
  childrenCount: number;
  totalRevenue: string; // In WIP
  claimableRevenue: string; // In WIP
  childIpIds: string[];
}
```

---

#### POST `/api/v1/access/verify-download`

**Request**:
```typescript
interface DownloadRequest {
  ipId: string;
  licenseTokenId: string;
  walletAddress: string;
  signature: string;
  message: string;
}
```

**Response**:
```typescript
interface DownloadResponse {
  downloadUrl: string; // Presigned S3 URL (60s expiry)
}
```

---

#### POST `/api/v1/assets/register-derivative`

**Request**:
```typescript
interface RegisterDerivativeRequest {
  childIpId: string;
  parentIpId: string;
  licenseTokenId: string;
  metadata: {
    title: string;
    description: string;
    type: string;
  };
  txHash: string;
}
```

---

#### GET `/api/v1/royalty/status/:ipId`

**Response**:
```typescript
interface RoyaltyStatus {
  totalEarned: string;
  claimable: string;
  claimed: string;
  childPayments: Array<{
    childIpId: string;
    amount: string;
    timestamp: string;
  }>;
}
```

---

## 5. Story SDK Service Layer

### File: `src/services/story/StoryService.ts`

```typescript
import { StoryClient } from "@story-protocol/core-sdk";
import { useWalletClient, usePublicClient } from "wagmi";
import { Address, parseEther, encodeFunctionData } from "viem";
import { STORY_CONTRACTS } from "../../config/story-contracts";

export class StoryService {
  private client: StoryClient;
  private walletClient: any;

  constructor(walletClient: any, publicClient: any) {
    this.client = StoryClient.newClient({
      transport: publicClient,
      wallet: walletClient,
      chainId: STORY_CONTRACTS.STORY_TESTNET_CHAIN_ID
    });
    this.walletClient = walletClient;
  }

  /**
   * Workflow A: Buy License (Mint License Token)
   *
   * Steps:
   * 1. Check WIP token allowance
   * 2. Approve WIP tokens if needed
   * 3. Call client.license.mintLicenseTokens()
   *
   * @returns licenseTokenId and txHash
   */
  async buyLicense(params: {
    ipId: Address;
    licenseTermsId: string;
    priceWIP: string;
  }) {
    const { ipId, licenseTermsId, priceWIP } = params;
    const userAddress = this.walletClient.account.address;

    // Step 1: Check allowance
    const allowance = await this.client.erc20.allowance({
      token: STORY_CONTRACTS.WIP_TOKEN,
      owner: userAddress,
      spender: STORY_CONTRACTS.LICENSE_ATTACHMENT_WORKFLOW
    });

    const requiredAmount = parseEther(priceWIP);

    // Step 2: Approve if needed
    if (BigInt(allowance) < requiredAmount) {
      const approveResponse = await this.client.erc20.approve({
        token: STORY_CONTRACTS.WIP_TOKEN,
        spender: STORY_CONTRACTS.LICENSE_ATTACHMENT_WORKFLOW,
        amount: requiredAmount
      });

      await approveResponse.wait();
    }

    // Step 3: Mint license token
    const mintResponse = await this.client.license.mintLicenseTokens({
      licensorIpId: ipId,
      licenseTermsId: licenseTermsId,
      amount: 1,
      receiver: userAddress,
      maxMintingFee: requiredAmount,
      maxRevenueShare: 100
    });

    return {
      licenseTokenId: mintResponse.licenseTokenId,
      txHash: mintResponse.txHash
    };
  }

  /**
   * Workflow B: Register Derivative IP Asset
   *
   * Steps:
   * 1. Upload derivative file to IPFS (done before calling this)
   * 2. Call client.ipAsset.registerDerivativeIpAsset()
   *
   * This burns the license token and creates parent-child link
   *
   * @returns childIpId and txHash
   */
  async registerDerivative(params: {
    parentIpId: Address;
    licenseTermsId: string;
    ipfsHash: string;
    metadata: {
      title: string;
      description: string;
    };
  }) {
    const { parentIpId, licenseTermsId, ipfsHash, metadata } = params;

    const metadataJson = JSON.stringify({
      name: metadata.title,
      description: metadata.description,
      image: `ipfs://${ipfsHash}`
    });

    const response = await this.client.ipAsset.registerDerivativeIpAsset({
      nft: {
        type: "mint",
        spgNftContract: STORY_CONTRACTS.SPG_NFT_CONTRACT
      },
      derivData: {
        parentIpIds: [parentIpId],
        licenseTermsIds: [licenseTermsId]
      },
      ipMetadata: {
        ipMetadataURI: `ipfs://${ipfsHash}`,
        ipMetadataHash: this.keccak256(ipfsHash),
        nftMetadataURI: `data:application/json;base64,${btoa(metadataJson)}`,
        nftMetadataHash: this.keccak256(metadataJson)
      }
    });

    return {
      childIpId: response.ipId,
      txHash: response.txHash
    };
  }

  /**
   * Workflow C: Claim Royalty Revenue
   *
   * Steps:
   * 1. Check claimable revenue
   * 2. Call client.royalty.claimAllRevenue()
   * 3. Transfer from IP Account to personal wallet
   *
   * @returns claimed amount and txHash
   */
  async claimRevenue(params: {
    ipId: Address;
    childIpIds: Address[];
  }) {
    const { ipId, childIpIds } = params;
    const userAddress = this.walletClient.account.address;

    // Step 1: Check claimable amount
    const claimableResponse = await this.client.royalty.claimableRevenue({
      royaltyVaultIpId: ipId,
      account: userAddress,
      snapshotIds: [],
      token: STORY_CONTRACTS.WIP_TOKEN
    });

    if (BigInt(claimableResponse.amount) === 0n) {
      throw new Error("No revenue to claim");
    }

    // Step 2: Claim all revenue
    const claimResponse = await this.client.royalty.claimAllRevenue({
      ancestorIpId: ipId,
      claimer: ipId,
      currencyTokens: [STORY_CONTRACTS.WIP_TOKEN],
      childIpIds: childIpIds,
      royaltyPolicies: [STORY_CONTRACTS.ROYALTY_POLICY_LAP]
    });

    await claimResponse.wait();

    // Step 3: Transfer to personal wallet
    const transferData = encodeFunctionData({
      abi: [{
        name: "transfer",
        type: "function",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }]
      }],
      functionName: "transfer",
      args: [userAddress, BigInt(claimableResponse.amount)]
    });

    const transferResponse = await this.client.ipAccount.execute({
      ipId: ipId,
      to: STORY_CONTRACTS.WIP_TOKEN,
      value: 0,
      data: transferData
    });

    await transferResponse.wait();

    return {
      amount: claimableResponse.amount,
      txHash: transferResponse.txHash
    };
  }

  private keccak256(data: string): `0x${string}` {
    // Use viem's keccak256
    return `0x${Buffer.from(data).toString("hex")}` as `0x${string}`;
  }
}

/**
 * React Hook to use StoryService
 */
export function useStoryService() {
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();

  if (!walletClient.data || !publicClient) {
    throw new Error("Wallet not connected");
  }

  return new StoryService(walletClient.data, publicClient);
}
```

---

## 6. Component Implementation Details

### Marketplace Page Structure

```typescript
// src/pages/Marketplace/index.tsx

import { useState } from "react";
import { MarketplaceSearch } from "./MarketplaceSearch";
import { RawDataList } from "./RawDataList";
import { RefinedReportsGrid } from "./RefinedReportsGrid";
import { DerivativesGallery } from "./DerivativesGallery";

export default function Marketplace() {
  const [searchParams, setSearchParams] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold font-cairo">ClearSky Marketplace</h1>
          <p className="text-slate-400">Discover air quality insights powered by DePIN</p>
        </div>
      </header>

      {/* Search Bar */}
      <MarketplaceSearch onSearch={setSearchParams} />

      {/* Results */}
      {searchParams && (
        <div className="container mx-auto px-6 py-8 space-y-12">
          {/* Tier 1: Raw Data */}
          <section>
            <h2 className="text-2xl font-bold mb-6 font-cairo">Raw Sensor Data</h2>
            <RawDataList searchParams={searchParams} />
          </section>

          {/* Tier 2: Refined Reports (IP Assets) */}
          <section>
            <h2 className="text-2xl font-bold mb-6 font-cairo">AI-Generated Insights</h2>
            <RefinedReportsGrid searchParams={searchParams} />
          </section>

          {/* Tier 3: Community Derivatives */}
          <section>
            <h2 className="text-2xl font-bold mb-6 font-cairo">Creator Art & Remixes</h2>
            <DerivativesGallery searchParams={searchParams} />
          </section>
        </div>
      )}
    </div>
  );
}
```

---

### Refined Reports Grid (Tier 2)

```typescript
// src/pages/Marketplace/RefinedReportsGrid.tsx

import { useQuery } from "@tanstack/react-query";
import { GeneratingLoader } from "../../components/Marketplace/GeneratingLoader";
import { RefinedReportCard } from "../../components/Marketplace/RefinedReportCard";

export function RefinedReportsGrid({ searchParams }) {
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-search", searchParams],
    queryFn: () => fetch("/api/v1/marketplace/search", {
      method: "POST",
      body: JSON.stringify(searchParams)
    }).then(r => r.json())
  });

  // Show loader while generating
  if (isLoading || data?.refined_report?.status === "PROCESSING") {
    return <GeneratingLoader />;
  }

  if (!data?.refined_report) {
    return (
      <div className="text-center py-12 text-slate-400">
        No refined reports found. Adjust your search criteria.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RefinedReportCard report={data.refined_report} />
    </div>
  );
}
```

---

### Generating Loader (Skeleton)

```typescript
// src/components/Marketplace/GeneratingLoader.tsx

export function GeneratingLoader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-pulse" />

      <div className="relative space-y-4">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-blue-400 animate-spin" /* ... */ />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-white">Generating Intelligence</h3>
          <div className="space-y-1 text-sm text-slate-400">
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Aggregating sensor data from DePIN network...
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100" />
              Running AI analysis...
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200" />
              Minting IP Asset on Story Protocol...
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-progress" />
        </div>
      </div>
    </div>
  );
}
```

---

### Refined Report Card

```typescript
// src/components/Marketplace/RefinedReportCard.tsx

import { useState } from "react";
import { useStoryService } from "../../services/story/StoryService";
import { Button } from "../ui/button";
import { Toast } from "../ui/toast";

export function RefinedReportCard({ report }) {
  const storyService = useStoryService();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleBuyLicense = async () => {
    setIsPurchasing(true);
    try {
      const result = await storyService.buyLicense({
        ipId: report.ipId,
        licenseTermsId: report.licenseTermsId,
        priceWIP: report.price_wip
      });

      // Sync with backend
      await fetch("/api/v1/user/purchases", {
        method: "POST",
        body: JSON.stringify({
          ipId: report.ipId,
          licenseTokenId: result.licenseTokenId,
          txHash: result.txHash
        })
      });

      Toast.success("License purchased successfully!");

    } catch (error) {
      Toast.error("Failed to purchase license");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Glass morphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-white font-cairo">{report.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{report.description}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" /* Story Protocol icon */ />
            IP Asset
          </span>
          <span>•</span>
          <span>ID: {report.ipId.slice(0, 10)}...</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{report.price_wip}</span>
          <span className="text-slate-400">WIP</span>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleBuyLicense}
          disabled={isPurchasing}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {isPurchasing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" /* Spinner */ />
              Minting License...
            </span>
          ) : (
            "Mint License"
          )}
        </Button>
      </div>
    </div>
  );
}
```

---

### User Profile Page (Tabs)

```typescript
// src/pages/UserProfile/index.tsx

import { useState } from "react";
import { MyDevicesTab } from "./MyDevicesTab";
import { MyCollectionTab } from "./MyCollectionTab";
import { MyCreationsTab } from "./MyCreationsTab";

type Tab = "devices" | "collection" | "creations";

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState<Tab>("devices");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold font-cairo">My Profile</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="container mx-auto px-6">
          <nav className="flex gap-8">
            <TabButton
              active={activeTab === "devices"}
              onClick={() => setActiveTab("devices")}
              label="My Devices"
            />
            <TabButton
              active={activeTab === "collection"}
              onClick={() => setActiveTab("collection")}
              label="My Collection"
            />
            <TabButton
              active={activeTab === "creations"}
              onClick={() => setActiveTab("creations")}
              label="My Creations"
            />
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === "devices" && <MyDevicesTab />}
        {activeTab === "collection" && <MyCollectionTab />}
        {activeTab === "creations" && <MyCreationsTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative py-4 px-2 font-semibold transition-colors ${
        active ? "text-white" : "text-slate-400 hover:text-slate-300"
      }`}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
      )}
    </button>
  );
}
```

---

### My Collection Tab (Purchased Licenses)

```typescript
// src/pages/UserProfile/MyCollectionTab.tsx

import { useQuery } from "@tanstack/react-query";
import { LicenseCard } from "../../components/UserProfile/LicenseCard";
import { CreateDerivativeModal } from "../../components/Marketplace/CreateDerivativeModal";

export function MyCollectionTab() {
  const { data: purchases, isLoading } = useQuery({
    queryKey: ["user-purchases"],
    queryFn: () => fetch("/api/v1/user/purchases").then(r => r.json())
  });

  const [selectedForDerivative, setSelectedForDerivative] = useState(null);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!purchases?.length) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-white mb-2">No licenses yet</h2>
        <p className="text-slate-400">Visit the marketplace to purchase your first license</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchases.map((license) => (
          <LicenseCard
            key={license.licenseTokenId}
            license={license}
            onCreateDerivative={() => setSelectedForDerivative(license)}
          />
        ))}
      </div>

      {selectedForDerivative && (
        <CreateDerivativeModal
          parentIpId={selectedForDerivative.ipId}
          parentLicenseTokenId={selectedForDerivative.licenseTokenId}
          onClose={() => setSelectedForDerivative(null)}
          onSuccess={() => {
            setSelectedForDerivative(null);
            // Refresh purchases
          }}
        />
      )}
    </>
  );
}
```

---

### My Creations Tab (Owned IP Assets)

```typescript
// src/pages/UserProfile/MyCreationsTab.tsx

import { useQuery } from "@tanstack/react-query";
import { CreationCard } from "../../components/UserProfile/CreationCard";
import { useStoryService } from "../../services/story/StoryService";

export function MyCreationsTab() {
  const storyService = useStoryService();

  const { data: creations, isLoading, refetch } = useQuery({
    queryKey: ["user-creations"],
    queryFn: () => fetch("/api/v1/user/creations").then(r => r.json())
  });

  const handleClaimRevenue = async (creation) => {
    try {
      const result = await storyService.claimRevenue({
        ipId: creation.ipId,
        childIpIds: creation.childIpIds
      });

      Toast.success(`Claimed ${formatEther(result.amount)} WIP`);
      refetch();

    } catch (error) {
      Toast.error("Failed to claim revenue");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!creations?.length) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-2xl font-bold text-white mb-2">No creations yet</h2>
        <p className="text-slate-400">Create a derivative from your collection to get started</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creations.map((creation) => (
        <CreationCard
          key={creation.ipId}
          creation={creation}
          onClaimRevenue={() => handleClaimRevenue(creation)}
        />
      ))}
    </div>
  );
}
```

---

## 7. State Management

### React Query Setup

```typescript
// src/app/providers/QueryProvider.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## 8. Theme & Styling

### Tailwind Theme Extension (Already in place)

```javascript
// Dark/Slate Industrial Theme
colors: {
  background: "hsl(222, 47%, 11%)", // slate-950
  foreground: "hsl(210, 40%, 98%)", // white
  primary: {
    DEFAULT: "hsl(217, 91%, 60%)", // blue-500
    foreground: "hsl(0, 0%, 100%)"
  },
  accent: {
    DEFAULT: "hsl(188, 94%, 55%)", // cyan-400
  }
}
```

### Glass Morphism Utility

```css
/* Add to globals.css */
.glass-card {
  @apply bg-slate-800/50 backdrop-blur-sm border border-slate-700/50;
}

.glass-card-hover {
  @apply hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all;
}

.gradient-border {
  background: linear-gradient(to right, rgb(59 130 246), rgb(34 211 238));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 9. Complete Function Call Order

### Marketplace Flow

1. **User searches** → `POST /api/v1/marketplace/search`
2. **Backend mints IP** → `ipAsset.register()` + `license.attachLicenseTerms()`
3. **User clicks "Mint License"** → `storyService.buyLicense()`
   - `erc20.approve(WIP_TOKEN)`
   - `license.mintLicenseTokens()`
4. **User downloads** → `signMessage()` + `POST /api/v1/access/verify-download`

### Derivative Flow

5. **User uploads derivative** → `storyService.registerDerivative()`
   - `ipAsset.registerDerivativeIpAsset()`
   - `POST /api/v1/assets/register-derivative`
6. **Derivative shown in marketplace** → `GET /api/v1/marketplace/derivatives`

### Royalty Flow

7. **Someone buys from derivative** → `license.mintLicenseTokens(childIpId)`
8. **Revenue distributed** → `royalty.payRoyaltyOnBehalf()`
9. **Parent claims** → `storyService.claimRevenue()`
   - `royalty.claimableRevenue()`
   - `royalty.claimAllRevenue()`
   - `ipAccount.execute(transfer())`

---

## 10. Questions for Clarification

Before implementation, please clarify:

1. **IPFS Storage**: Do you have an IPFS pinning service setup (Pinata, NFT.Storage)? Or should I use a temporary solution?

2. **WIP Token Faucet**: For testnet, do users need WIP tokens? Is there a faucet?

3. **Backend Endpoints**: Are the backend API endpoints already implemented or do I need to create mocks for frontend development?

4. **Search Polling**: Should I poll for "PROCESSING" status every 3 seconds, or use WebSockets?

5. **Derivative Display**: In Marketplace Tier 3, should I show ALL derivatives globally, or filter by parent IP?

6. **Price Display**: Should derivative prices be the same as parent, or can creators set custom prices?

7. **MCP Server**: You mentioned Story SDK MCP servers - should I integrate those for enhanced functionality?

---

## Next Steps

1. ✅ Create folder structure
2. ✅ Implement Story SDK service layer
3. ✅ Build Marketplace components
4. ✅ Build User Profile components
5. ✅ Integrate API calls
6. ✅ Add theme consistency
7. ✅ Test complete flows

Ready to start implementation! Which component should I build first?
