/**
 * Wagmi Provider Configuration - MINIMAL VERSION
 *
 * Matches CDP documentation EXACTLY to avoid initialization issues
 * Based on: https://docs.cdp.coinbase.com/cdp-wagmi
 */

import React from "react";
import { WagmiProvider as WagmiProviderBase, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createCDPEmbeddedWalletConnector } from "@coinbase/cdp-wagmi";
import type { Config } from "@coinbase/cdp-core";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { env } from "../../config/env";

// CDP Configuration - MINIMAL (matching documentation)
const cdpConfig: Config = {
  projectId: env.CDP_PROJECT_ID,
  ethereum: {
    createOnLogin: "eoa", // Required: Create EVM account on login
  },
  // REMOVED: basePath, useMock, debugging, appName, appLogoUrl
  // These might be causing initialization issues
};

// Create CDP Embedded Wallet Connector
const connector = createCDPEmbeddedWalletConnector({
  cdpConfig: cdpConfig,
  providerConfig: {
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  },
});

// Wagmi Configuration
const wagmiConfig = createConfig({
  connectors: [connector],
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
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
