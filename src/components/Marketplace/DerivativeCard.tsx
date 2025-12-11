/**
 * Derivative Card Component
 *
 * Displays a derivative IP asset (child IP) with parent link
 * Supports custom pricing set by creator
 */

import { useState, useEffect } from "react";
import { type Address, parseUnits, formatUnits } from "viem";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { purchaseCommunityDerivative, type DerivativeAsset } from "../../services/api/marketplace.service";
import { STORY_TESTNET_CHAIN_ID } from "../../config/story-contracts";

// Payment recipient address
const PAYMENT_ADDRESS = "0xe7a5731070145b490fc9c81a45f98dc04bbece20" as Address;

interface DerivativeCardProps {
  derivative: DerivativeAsset;
  onPurchaseSuccess?: () => void;
}

export function DerivativeCard({
  derivative,
  onPurchaseSuccess
}: DerivativeCardProps) {
  const { address } = useAuth();
  const { address: wagmiAddress, chain } = useAccount();
  const toast = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [awaitingPurchase, setAwaitingPurchase] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  // Get balance on Story testnet
  const { data: balanceData } = useBalance({
    address: wagmiAddress,
    chainId: STORY_TESTNET_CHAIN_ID,
  });

  const { switchChain } = useSwitchChain();

  // Effect to handle purchase after payment confirmation
  useEffect(() => {
    if (txHash && awaitingPurchase) {
      const monitorTransaction = async () => {
        try {
          console.log("[DerivativeCard] Monitoring transaction:", txHash);
          const receipt = await window.ethereum!.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          }) as any;

          if (receipt && receipt.blockNumber) {
            console.log("[DerivativeCard] ✅ Transaction confirmed!");
            await completePurchase(txHash);
          } else {
            // Check again in 2 seconds
            setTimeout(monitorTransaction, 2000);
          }
        } catch (error) {
          console.error("[DerivativeCard] Error monitoring transaction:", error);
          setTimeout(monitorTransaction, 2000);
        }
      };
      monitorTransaction();
    }
  }, [txHash, awaitingPurchase]);

  const completePurchase = async (paymentTxHash: `0x${string}`) => {
    console.log("[DerivativeCard] ✅ Payment confirmed! Proceeding with backend purchase...");
    console.log("[DerivativeCard] Payment TX hash:", paymentTxHash);
    toast("Step 3/3: Finalizing purchase...");

    try {
      console.log("[DerivativeCard] Calling backend purchase API...");
      await purchaseCommunityDerivative(derivative.user_derivative_id, address!);
      
      console.log("[DerivativeCard] ✅ Purchase flow completed successfully!");
      toast.success("Purchase successful! Check your profile to view your license.");
      onPurchaseSuccess?.();
    } catch (error: any) {
      console.error("[DerivativeCard] ❌ Purchase completion failed:", error);
      toast.error(`Failed to complete purchase: ${error.message || "Unknown error"}`);
    } finally {
      setIsPurchasing(false);
      setAwaitingPurchase(false);
      setTxHash(null);
    }
  };

  const handleBuyLicense = async () => {
    // Validation checks
    if (!address || !wagmiAddress) {
      console.error("[DerivativeCard] Wallet not connected:", { address, wagmiAddress });
      toast.error("Please connect your wallet first");
      return;
    }

    console.log("[DerivativeCard] Starting purchase flow...");
    console.log("[DerivativeCard] Current chain:", chain?.id, chain?.name);
    console.log("[DerivativeCard] User address:", wagmiAddress);
    console.log("[DerivativeCard] Payment recipient:", PAYMENT_ADDRESS);
    console.log("[DerivativeCard] Price:", derivative.price, "IP");

    setIsPurchasing(true);

    try {
      // Step 0: MUST be on Story testnet - force switch if not
      if (chain?.id !== STORY_TESTNET_CHAIN_ID) {
        console.log(`[DerivativeCard] ❌ Wrong network detected!`);
        toast("Switching to Story Protocol testnet...");
        
        try {
          await switchChain({ chainId: STORY_TESTNET_CHAIN_ID });
          console.log("[DerivativeCard] ✅ Successfully switched to Story testnet");
          toast.success("Switched to Story Protocol testnet!");
          
          // Wait for chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (switchError: any) {
          // Try manual approach if wagmi fails
          if (window.ethereum && switchError.code === 4902) {
            console.log("[DerivativeCard] Adding Story Testnet...");
            toast("Adding Story Testnet to your wallet...");
            
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x5E9", // 1513 in hex
                chainName: "Story Protocol Testnet",
                rpcUrls: ["https://testnet.storyrpc.io"],
                nativeCurrency: {
                  name: "IP",
                  symbol: "IP",
                  decimals: 18
                },
                blockExplorerUrls: ["https://testnet.storyscan.xyz"]
              }]
            });
            console.log("[DerivativeCard] ✅ Story Testnet added");
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.error("[DerivativeCard] ❌ Chain switch failed:", switchError);
            toast.error("Failed to switch to Story testnet. Please switch manually.");
            setIsPurchasing(false);
            return;
          }
        }
      }

      // Step 1: Prepare payment transaction
      console.log("[DerivativeCard] Step 1/3: Preparing payment transaction...");
      toast("Step 1/3: Initiating payment transfer...");

      const priceIP = String(derivative.price);
      const amountInWei = parseUnits(priceIP, 18);
      
      console.log("[DerivativeCard] Transaction details:");
      console.log("  - Price (IP):", priceIP);
      console.log("  - Amount (Wei):", amountInWei.toString());

      // Check balance
      if (balanceData) {
        const balanceInIP = formatUnits(balanceData.value, 18);
        console.log("[DerivativeCard] Current balance:", balanceInIP, "IP");
        
        if (balanceData.value < amountInWei) {
          const shortfallIP = formatUnits(amountInWei - balanceData.value, 18);
          toast.error(`Insufficient IP balance. You need ${shortfallIP} more IP.`);
          setIsPurchasing(false);
          return;
        }
      }

      // Send transaction via MetaMask
      if (!window.ethereum) {
        toast.error("MetaMask not found. Please install MetaMask.");
        setIsPurchasing(false);
        return;
      }

      console.log("[DerivativeCard] Requesting MetaMask connection...");
      toast("Connecting to MetaMask...");
      
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in MetaMask");
      }
      
      const metamaskAddress = accounts[0];
      console.log("[DerivativeCard] ✅ MetaMask connected:", metamaskAddress);
      toast.success("MetaMask connected!");
      
      console.log("[DerivativeCard] Sending transaction via MetaMask...");
      toast("Step 2/3: Approve transaction in MetaMask...");
      
      const transactionHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: metamaskAddress,
          to: PAYMENT_ADDRESS,
          value: `0x${amountInWei.toString(16)}`,
        }],
      }) as `0x${string}`;
      
      console.log("[DerivativeCard] ✅ Transaction submitted!");
      console.log("[DerivativeCard] TX hash:", transactionHash);
      toast("Transaction submitted! Waiting for confirmation...");
      
      setTxHash(transactionHash);
      setAwaitingPurchase(true);
      
    } catch (error: any) {
      console.error("[DerivativeCard] ❌ Purchase failed:", error);
      toast.error(`Failed to purchase: ${error.message || "Unknown error"}`);
      setIsPurchasing(false);
      setAwaitingPurchase(false);
      setTxHash(null);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "MODEL":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "DATASET":
        return "bg-pink-50 text-pink-700 border border-pink-200";
      case "ANALYSIS":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white backdrop-blur-sm transition-all hover:border-purple-400 hover:shadow-xl hover:shadow-purple-100">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* No Thumbnail - as it's not available in the new DerivativeAsset structure */}
      {/* <div className="relative h-56 overflow-hidden">
          <img
            src={derivative.metadata.thumbnailUrl}
            alt={derivative.metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
        </div> */}

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-cairo line-clamp-2 group-hover:text-purple-600 transition-colors">
            {derivative.title}
          </h3>
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
            {derivative.description}
          </p>
        </div>

        {/* Parent Link */}
        <div className="flex items-center gap-2 text-xs">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="text-slate-500">Derived from:</span>
          <span className="font-mono text-slate-700">
            {derivative.parent_ip_id.slice(0, 6)}...{derivative.parent_ip_id.slice(-4)}
          </span>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Creator:</span>
          <span className="font-mono">
            {derivative.creator_wallet.slice(0, 6)}...{derivative.creator_wallet.slice(-4)}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {derivative.price}
              </span>
              <span className="text-slate-600 font-semibold">IP</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Custom pricing by creator
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Created</p>
            <p className="text-xs text-slate-600">
              {new Date(derivative.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleBuyLicense}
          disabled={isPurchasing || !address}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-purple-200 hover:shadow-purple-300"
        >
          {isPurchasing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Purchasing...
            </span>
          ) : !address ? (
            "Connect Wallet"
          ) : (
            "Mint License"
          )}
        </Button>
      </div>
    </div>
  );
}