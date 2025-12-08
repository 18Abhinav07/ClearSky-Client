/**
 * Story Protocol Contract Addresses and Configuration
 *
 * Network: Story Protocol Testnet (Odyssey)
 * Chain ID: 1513
 * RPC: https://testnet.storyrpc.io
 */

import { type Address } from "viem";

export const STORY_TESTNET_CHAIN_ID = 1513;
export const STORY_TESTNET_RPC = "https://testnet.storyrpc.io";

/**
 * Core Story Protocol Contracts
 */
export const STORY_CONTRACTS = {
  /**
   * SPG NFT Contract - Story Protocol Grouped NFT
   * Used for minting NFTs that will become IP Assets
   */
  SPG_NFT_CONTRACT: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc" as Address,

  /**
   * Royalty Policy LAP - Liquid Absolute Percentage
   * Handles royalty distribution with commercialRevShare
   */
  ROYALTY_POLICY_LAP: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as Address,

  /**
   * WIP Token - Wrapped IP Token
   * Native currency for Story Protocol transactions
   * Used for license fees and royalty payments
   */
  WIP_TOKEN: "0x1514000000000000000000000000000000000000" as Address,

  /**
   * IP Token (Not yet implemented in testnet)
   * Placeholder for future IP token functionality
   */
  IP_TOKEN: "0x0000000000000000000000000000000000000000" as Address,

  /**
   * License Attachment Workflow
   * Contract that needs WIP token approval for minting licenses
   * NOTE: This address may need to be updated based on Story SDK version
   */
  LICENSE_ATTACHMENT_WORKFLOW: "0x0000000000000000000000000000000000000000" as Address, // TODO: Update with actual address
} as const;

/**
 * Default PIL (Programmable IP License) Terms
 *
 * Used when attaching license terms to IP Assets
 */
export const DEFAULT_PIL_TERMS = {
  /**
   * Commercial Use Settings
   */
  transferable: true,
  royaltyPolicy: STORY_CONTRACTS.ROYALTY_POLICY_LAP,
  commercialUse: true,
  commercialAttribution: true,
  commercialRevShare: 10, // 10% to parent IP

  /**
   * Derivative Settings
   */
  derivativesAllowed: true,
  derivativesAttribution: true,
  derivativesApproval: false,
  derivativesReciprocal: true,

  /**
   * Currency & Pricing
   */
  currency: STORY_CONTRACTS.WIP_TOKEN,
  defaultMintingFee: "50", // 50 WIP tokens (in whole units, not wei)

  /**
   * Territory & Distribution
   */
  territories: [], // Empty = worldwide
  distributionChannels: [], // Empty = all channels
  contentRestrictions: [], // Empty = no restrictions
} as const;

/**
 * Story Protocol Chain Configuration for Wagmi/Viem
 */
export const storyTestnet = {
  id: STORY_TESTNET_CHAIN_ID,
  name: "Story Protocol Testnet",
  network: "story-testnet",
  nativeCurrency: {
    name: "IP",
    symbol: "IP",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [STORY_TESTNET_RPC],
    },
    public: {
      http: [STORY_TESTNET_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: "Story Explorer",
      url: "https://testnet.storyscan.xyz",
    },
  },
  testnet: true,
} as const;

/**
 * Helper function to check if an address is a valid Story Protocol address
 */
export function isValidStoryAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format WIP token amount from wei to human-readable string
 */
export function formatWIP(weiAmount: bigint): string {
  const eth = Number(weiAmount) / 1e18;
  return eth.toFixed(2);
}

/**
 * Parse WIP token amount from human-readable string to wei
 */
export function parseWIP(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18));
}
