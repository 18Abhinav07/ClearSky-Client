/**
 * Minimal CDP Provider - Step-by-step initialization for debugging
 *
 * This breaks down CDP initialization into testable steps
 */

import React, { useEffect, useState } from "react";
import { WagmiProvider as WagmiProviderBase, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createCDPEmbeddedWalletConnector } from "@coinbase/cdp-wagmi";
import type { Config } from "@coinbase/cdp-core";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { env } from "../../config/env";

interface MinimalCDPProviderProps {
  children: React.ReactNode;
}

// React Query Client (created outside component to prevent recreation)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Minimal CDP Provider with debugging
 */
export function MinimalCDPProvider({ children }: MinimalCDPProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cdpConfig, setCdpConfig] = useState<Config | null>(null);
  const [wagmiConfig, setWagmiConfig] = useState<any>(null);

  useEffect(() => {
    console.log("[CDP Init] Starting initialization...");

    try {
      // Step 1: Validate environment variables
      console.log("[CDP Init] Step 1: Checking env vars");
      if (!env.CDP_PROJECT_ID) {
        throw new Error("CDP_PROJECT_ID is missing from environment");
      }
      console.log("[CDP Init] Project ID:", env.CDP_PROJECT_ID);
      console.log("[CDP Init] Base Path:", env.CDP_API_BASE_PATH);

      // Step 2: Create CDP Config
      console.log("[CDP Init] Step 2: Creating CDP config");
      const config: Config = {
        projectId: env.CDP_PROJECT_ID,
        ethereum: {
          createOnLogin: "eoa",
        },
        debugging: true,
      };
      setCdpConfig(config);
      console.log("[CDP Init] CDP Config created:", config);

      // Step 3: Create CDP Connector
      console.log("[CDP Init] Step 3: Creating CDP connector");
      const connector = createCDPEmbeddedWalletConnector({
        cdpConfig: config,
        providerConfig: {
          chains: [base, baseSepolia],
          transports: {
            [base.id]: http(),
            [baseSepolia.id]: http(),
          },
        },
      });
      console.log("[CDP Init] Connector created");

      // Step 4: Create Wagmi Config
      console.log("[CDP Init] Step 4: Creating Wagmi config");
      const wConfig = createConfig({
        connectors: [connector],
        chains: [base, baseSepolia],
        transports: {
          [base.id]: http(),
          [baseSepolia.id]: http(),
        },
      });
      setWagmiConfig(wConfig);
      console.log("[CDP Init] Wagmi config created");

      // Step 5: Mark as initialized
      console.log("[CDP Init] ✅ Initialization complete!");
      setIsInitialized(true);

    } catch (err: any) {
      console.error("[CDP Init] ❌ Initialization failed:", err);
      setError(err.message);
    }
  }, []);

  // Show loading state
  if (!isInitialized && !error) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
        <p style={styles.text}>Initializing CDP...</p>
        <p style={styles.subtext}>Check console for details</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>CDP Initialization Failed</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.button}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render providers once initialized
  if (!cdpConfig || !wagmiConfig) {
    return (
      <div style={styles.container}>
        <p style={styles.text}>Configuration error</p>
      </div>
    );
  }

  console.log("[CDP Init] Rendering providers");

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

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  text: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  subtext: {
    fontSize: "14px",
    opacity: 0.8,
  },
  error: {
    background: "white",
    color: "#333",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center" as const,
    maxWidth: "500px",
  },
  button: {
    marginTop: "20px",
    padding: "12px 24px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
