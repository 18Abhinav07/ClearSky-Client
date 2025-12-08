/**
 * Story Protocol Service
 *
 * Wraps Story SDK for ClearSky marketplace operations
 * Handles all blockchain interactions with Story Protocol
 */
import { Buffer } from 'buffer';
import { StoryClient, type StoryConfig } from "@story-protocol/core-sdk";
import { type Address, http } from "viem";
import { STORY_CONTRACTS, STORY_TESTNET_RPC, STORY_TESTNET_CHAIN_ID } from "../../config/story-contracts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BuyLicenseParams {
  ipId: Address;
  licenseTermsId: string;
  priceWIP: string; // Human-readable amount (e.g., "50")
}

export interface BuyLicenseResult {
  licenseTokenId: string;
  txHash: string;
}

export interface RegisterDerivativeParams {
  parentIpId: Address;
  licenseTermsId: string;
  ipfsHash: string;
  metadata: {
    title: string;
    description: string;
  };
}

export interface RegisterDerivativeResult {
  childIpId: Address;
  txHash: string;
}

export interface ClaimRevenueParams {
  ipId: Address;
  childIpIds: Address[];
}

export interface ClaimRevenueResult {
  amount: string;
  txHash: string;
}

export interface CheckClaimableParams {
  ipId: Address;
}

export interface CheckClaimableResult {
  claimable: string; // In WIP tokens
}

// ============================================================================
// STORY SERVICE CLASS
// ============================================================================

export class StoryService {
  private client: StoryClient;
  private walletClient: any;

  constructor(walletClient: any) {
    this.walletClient = walletClient;

    // Initialize Story Client
    const config: StoryConfig = {
      account: walletClient.account,
      transport: http(STORY_TESTNET_RPC),
      chainId: STORY_TESTNET_CHAIN_ID as any,
    };

    this.client = StoryClient.newClient(config);
  }

  // ==========================================================================
  // WORKFLOW A: BUY LICENSE (Mint License Token)
  // ==========================================================================

  async buyLicense(params: BuyLicenseParams): Promise<BuyLicenseResult> {
    const { ipId, licenseTermsId, priceWIP } = params;
    const userAddress = this.walletClient.account.address;

    console.log("[StoryService] Buying license...", {
      ipId,
      licenseTermsId,
      priceWIP,
      userAddress
    });

    try {
      const response = await this.client.license.mintLicenseTokens({
        licensorIpId: ipId,
        licenseTermsId: BigInt(licenseTermsId),
        amount: 1,
        receiver: userAddress,
      });

      console.log("[StoryService] ✅ License purchased:", {
        licenseTokenIds: response.licenseTokenIds,
        txHash: response.txHash
      });

      if (!response.licenseTokenIds || response.licenseTokenIds.length === 0) {
        throw new Error("License token ID not found in response.");
      }

      return {
        licenseTokenId: response.licenseTokenIds[0].toString(),
        txHash: response.txHash!
      };

    } catch (error: any) {
      console.error("[StoryService] Failed to buy license:", error);
      throw new Error(error.message || "Failed to purchase license");
    }
  }

  // ==========================================================================
  // WORKFLOW B: REGISTER DERIVATIVE (Create Child IP)
  // ==========================================================================

  async registerDerivative(params: RegisterDerivativeParams): Promise<RegisterDerivativeResult> {
    const { parentIpId, licenseTermsId, ipfsHash, metadata } = params;

    console.log("[StoryService] Registering derivative...", {
      parentIpId,
      licenseTermsId,
      ipfsHash
    });

    try {
      const metadataJson = JSON.stringify({
        name: metadata.title,
        description: metadata.description,
        image: `ipfs://${ipfsHash}`
      });

      const response = await this.client.ipAsset.registerDerivative({
        parentIpIds: [parentIpId],
        licenseTermsIds: [BigInt(licenseTermsId)],
        ipMetadata: {
          ipMetadataURI: `ipfs://${ipfsHash}`,
          ipMetadataHash: this.hashString(ipfsHash),
          nftMetadataURI: `data:application/json;base64,${btoa(metadataJson)}`,
          nftMetadataHash: this.hashString(metadataJson)
        },
      });

      console.log("[StoryService] ✅ Derivative registered:", {
        childIpId: response.derivativeId,
        txHash: response.txHash
      });

      if (!response.derivativeId) {
        throw new Error("Child IP ID not found in response.");
      }

      return {
        childIpId: response.derivativeId,
        txHash: response.txHash!
      };

    } catch (error: any) {
      console.error("[StoryService] Failed to register derivative:", error);
      throw new Error(error.message || "Failed to register derivative");
    }
  }

  // ==========================================================================
  // WORKFLOW C: CLAIM REVENUE (Claim Royalties)
  // ==========================================================================

  async checkClaimableRevenue(params: CheckClaimableParams): Promise<CheckClaimableResult> {
    const { ipId } = params;
    const userAddress = this.walletClient.account.address;

    console.log("[StoryService] Checking claimable revenue...", { ipId });

    try {
      const response = await this.client.royalty.claimableRevenue({
        ipId: ipId,
        claimer: userAddress,
        token: STORY_CONTRACTS.WIP_TOKEN
      });

      const claimableWIP = (Number(response) / 1e18).toFixed(4);

      console.log("[StoryService] Claimable revenue:", claimableWIP, "WIP");

      return {
        claimable: claimableWIP
      };

    } catch (error: any) {
      console.error("[StoryService] Failed to check claimable revenue:", error);
      return { claimable: "0" };
    }
  }

  async claimAllRevenue(params: ClaimRevenueParams): Promise<ClaimRevenueResult> {
    const { ipId, childIpIds } = params;
    const userAddress = this.walletClient.account.address;

    console.log("[StoryService] Claiming revenue...", {
      ipId,
      childIpIds
    });

    try {
      const claimableResponse = await this.checkClaimableRevenue({ ipId });

      if (parseFloat(claimableResponse.claimable) === 0) {
        throw new Error("No revenue to claim");
      }

      const claimResponse = await this.client.royalty.claimAllRevenue({
        ancestorIpId: ipId,
        childIpIds: childIpIds,
        claimer: userAddress,
        royaltyPolicies: [STORY_CONTRACTS.ROYALTY_POLICY_LAP as Address],
        currencyTokens: [STORY_CONTRACTS.WIP_TOKEN as Address],
      });

      console.log("[StoryService] ✅ Revenue claimed:", {
        amount: claimableResponse.claimable,
        txHash: claimResponse.txHashes
      });

      return {
        amount: claimableResponse.claimable,
        txHash: claimResponse.txHashes![0]
      };

    } catch (error: any)
		{
      console.error("[StoryService] Failed to claim revenue:", error);
      throw new Error(error.message || "Failed to claim revenue");
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private hashString(data: string): `0x${string}` {
    const hash = Buffer.from(data).toString("hex").slice(0, 64);
    return `0x${hash}` as `0x${string}`;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createStoryService(walletClient: any): StoryService {
  if (!walletClient || !walletClient.account) {
    throw new Error("Wallet client not connected");
  }

  return new StoryService(walletClient);
}
