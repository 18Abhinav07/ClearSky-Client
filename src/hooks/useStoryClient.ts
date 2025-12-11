/**
 * useStoryClient Hook
 *
 * React hook for Story Protocol SDK interactions
 * Provides access to StoryService with wallet client from wagmi
 */

import { useMemo } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { createStoryService, StoryService } from "../services/story/StoryService";
import { STORY_TESTNET_CHAIN_ID } from "../config/story-contracts";

export function useStoryClient(): StoryService | null {
  const { data: walletClient } = useWalletClient({ chainId: STORY_TESTNET_CHAIN_ID });
  const { isConnected } = useAccount();

  const storyService = useMemo(() => {
    if (!walletClient || !isConnected) {
      console.log("[useStoryClient] Wallet client not ready:", {
        hasWalletClient: !!walletClient,
        isConnected,
      });
      return null;
    }

    console.log("[useStoryClient] Creating Story service with wallet client");
    
    try {
      return createStoryService(walletClient);
    } catch (error) {
      console.error("[useStoryClient] Failed to create Story service:", error);
      return null;
    }
  }, [walletClient, isConnected]);

  return storyService;
}

/**
 * Hook that throws error if wallet not connected
 * Use this when Story client is required
 */
export function useStoryClientRequired(): StoryService {
  const storyService = useStoryClient();

  if (!storyService) {
    throw new Error("Story client not available. Please connect your wallet.");
  }

  return storyService;
}
