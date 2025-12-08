/**
 * useStoryClient Hook
 *
 * React hook for Story Protocol SDK interactions
 * Provides access to StoryService with wallet client from wagmi
 */

import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { createStoryService, StoryService } from "../services/story/StoryService";

export function useStoryClient(): StoryService | null {
  const { data: walletClient } = useWalletClient();

  const storyService = useMemo(() => {
    if (!walletClient) {
      return null;
    }

    try {
      return createStoryService(walletClient);
    } catch (error) {
      console.error("[useStoryClient] Failed to create Story service:", error);
      return null;
    }
  }, [walletClient]);

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
