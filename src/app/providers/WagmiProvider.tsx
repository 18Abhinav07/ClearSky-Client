/**
 * Wagmi Provider Configuration - MINIMAL VERSION
 *
 * Matches CDP documentation EXACTLY to avoid initialization issues
 * Based on: https://docs.cdp.coinbase.com/cdp-wagmi
 */

import React from "react";
import { WagmiProvider as WagmiProviderBase, createConfig } from "wagmi";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createCDPEmbeddedWalletConnector } from "@coinbase/cdp-wagmi";
import type { Config } from "@coinbase/cdp-core";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { env } from "../../config/env";
import { STORY_TESTNET_CHAIN_ID, STORY_TESTNET_RPC } from "../../config/story-contracts";
import { defineChain } from "viem";

// Define Story Protocol Testnet chain
const storyTestnet = defineChain({
  id: STORY_TESTNET_CHAIN_ID,
  name: 'Story Protocol Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: { http: [STORY_TESTNET_RPC] },
    public: { http: [STORY_TESTNET_RPC] },
  },
  blockExplorers: {
    default: { name: 'Story Explorer', url: 'https://testnet.storyscan.xyz' },
  },
  testnet: true,
});

// CDP Configuration
// Valid properties: projectId, basePath, ethereum, solana, customAuth, useMock, debugging, disableAnalytics
const cdpConfig: Config = {
  projectId: env.CDP_PROJECT_ID,
  basePath: env.CDP_API_BASE_PATH, // Explicitly set base path for API calls
  ethereum: {
    createOnLogin: "eoa", // Required: Create EVM account on login
  },
  debugging: true, // Enable debugging to see detailed auth flow logs
  disableAnalytics: false, // Keep analytics for better error tracking
};

// Create CDP Embedded Wallet Connector
const connector = createCDPEmbeddedWalletConnector({
  cdpConfig: cdpConfig,
  providerConfig: {
    chains: [storyTestnet], // ONLY Story testnet - Base networks removed
    transports: {
      [storyTestnet.id]: http(STORY_TESTNET_RPC),
    },
  },
});

// Wagmi Configuration
const wagmiConfig = createConfig({
  connectors: [connector],
  chains: [storyTestnet], // ONLY Story testnet - Base networks removed
  transports: {
    [storyTestnet.id]: http(STORY_TESTNET_RPC),
  },
});

// React Query Client
const queryClient = new QueryClient();

interface WagmiProviderProps {
  children: React.ReactNode;
}

/**
 * Combined provider for CDP + Wagmi
 * Wraps the app with necessary context providers
 */
export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <CDPReactProvider config={cdpConfig}>
      <WagmiProviderBase config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProviderBase>
    </CDPReactProvider>
  );
}
