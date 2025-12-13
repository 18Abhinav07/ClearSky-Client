/**
 * Refined Report Card Component
 *
 * Displays a derivative (AI-generated report) with purchase functionality
 * Flow: User transfers IP (native currency) → Backend mints NFT → Frontend mints LICENSE via Story SDK
 */

import { useState, useEffect } from "react";
import { type Address, parseUnits, formatUnits } from "viem";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useBalance } from "wagmi";
import { useAuth } from "../../hooks/useAuth";
import { useStoryClient } from "../../hooks/useStoryClient";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { type RefinedReport } from "../../services/api/marketplace.service";
import { getStoredTokens } from "../../services/api/auth.service";
import { STORY_TESTNET_CHAIN_ID } from "../../config/story-contracts";

// Payment recipient address
const PAYMENT_ADDRESS = "0xe7a5731070145b490fc9c81a45f98dc04bbece20" as Address;

interface RefinedReportCardProps {
  report: RefinedReport;
  onPurchaseSuccess?: () => void;
  onOpenDetails: () => void;
  onOpenRawData: () => void;
}

export function RefinedReportCard({
  report,
  onPurchaseSuccess,
  onOpenDetails,
  onOpenRawData,
}: RefinedReportCardProps) {
  const { address } = useAuth();
  const { address: wagmiAddress, chain } = useAccount();
  const storyClient = useStoryClient();
  const toast = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [awaitingPurchase, setAwaitingPurchase] = useState(false);

  // Get balance on Story testnet
  const { data: balanceData } = useBalance({
    address: wagmiAddress,
    chainId: STORY_TESTNET_CHAIN_ID,
  });

  // Wagmi hooks for sending native IP transfer
  const { data: txHash, sendTransaction, isPending: isSendingTx, error: txError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isTxConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  // Extract and format date from primitive_data or created_at
  const getFormattedDate = () => {
    const dateString = report.primitive_data?.[0]?.batch_window?.start || report.created_at;
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  const date = getFormattedDate();

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      console.error("[RefinedReportCard] ❌ Transaction error:", txError);
      toast.error(`Transaction failed: ${txError.message || "Unknown error"}`);
      setIsPurchasing(false);
      setAwaitingPurchase(false);
    }
  }, [txError, toast]);

  useEffect(() => {
    if (receiptError) {
      console.error("[RefinedReportCard] ❌ Receipt error:", receiptError);
      toast.error(`Transaction confirmation failed: ${receiptError.message || "Unknown error"}`);
      setIsPurchasing(false);
      setAwaitingPurchase(false);
    }
  }, [receiptError, toast]);

  // Effect to handle purchase after payment confirmation
  useEffect(() => {
    console.log("[RefinedReportCard] Transaction status update:", {
      isTxConfirmed,
      txHash,
      awaitingPurchase,
      isConfirming,
      isSendingTx,
    });

    if (isTxConfirmed && txHash && awaitingPurchase) {
      console.log("[RefinedReportCard] ✅ Payment transaction confirmed!");
      console.log("[RefinedReportCard] Transaction hash:", txHash);
      console.log("[RefinedReportCard] Proceeding to complete purchase...");
      
      // Call completePurchase
      const finalizePurchase = async () => {
        try {
          await completePurchase(txHash);
        } catch (error) {
          console.error("[RefinedReportCard] ❌ Error in completePurchase:", error);
          setIsPurchasing(false);
          setAwaitingPurchase(false);
        }
      };
      
      finalizePurchase();
    }
  }, [isTxConfirmed, txHash, awaitingPurchase, isConfirming, isSendingTx]);

  const completePurchase = async (paymentTxHash: `0x${string}`) => {
    console.log("[RefinedReportCard] Step 3/3: Completing purchase with backend...");
    console.log("[RefinedReportCard] Payment TX Hash:", paymentTxHash);
    
    try {
      toast.success("Payment confirmed! Processing purchase...");
      toast("Step 3/3: Minting your derivative...");
      
      const tokens = getStoredTokens();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (tokens?.access_token) {
        headers["Authorization"] = `Bearer ${tokens.access_token}`;
        console.log("[RefinedReportCard] Using access token for authentication");
      } else {
        console.warn("[RefinedReportCard] No access token found - request may fail");
      }

      const purchasePayload = {
        buyerWallet: address,
        paymentTxHash: paymentTxHash,
      };

      console.log("[RefinedReportCard] Sending purchase request to backend:", {
        url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/marketplace/purchase/${report.derivative_id}`,
        payload: purchasePayload,
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/marketplace/purchase/${report.derivative_id}`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(purchasePayload),
        }
      );

      console.log("[RefinedReportCard] Backend response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[RefinedReportCard] ❌ Backend purchase failed:", errorData);
        throw new Error(errorData.message || "Purchase failed");
      }

      const result = await response.json();
      console.log("[RefinedReportCard] ✅ Backend purchase successful:", result);

      // Mint license on Story Protocol (optional)
      if (storyClient && result.data.ip_id) {
        console.log("[RefinedReportCard] Attempting to mint license on Story Protocol...");
        console.log("[RefinedReportCard] IP ID:", result.data.ip_id);
        try {
          const licenseResult = await storyClient.buyLicense({
            ipId: result.data.ip_id as Address,
            licenseTermsId: "5",
            priceWIP: "0",
          });
          console.log("[RefinedReportCard] ✅ License minted successfully:", licenseResult);
        } catch (licenseError) {
          console.warn("[RefinedReportCard] ⚠️ License minting failed (non-critical):", licenseError);
        }
      } else {
        console.log("[RefinedReportCard] Skipping license minting:", {
          hasStoryClient: !!storyClient,
          ipId: result.data.ip_id,
        });
      }

      console.log("[RefinedReportCard] ✅ Purchase flow completed successfully!");
      toast.success("Purchase successful! Check your profile to view and download.");
      onPurchaseSuccess?.();
    } catch (error: any) {
      console.error("[RefinedReportCard] ❌ Purchase completion failed:", error);
      console.error("[RefinedReportCard] Error details:", {
        message: error.message,
        stack: error.stack,
      });
      toast.error(`Failed to purchase: ${error.message || "Unknown error"}`);
    } finally {
      setIsPurchasing(false);
      setAwaitingPurchase(false);
      console.log("[RefinedReportCard] Purchase flow ended. Resetting states.");
    }
  };

  const handleBuyLicense = async () => {
    // Validation checks
    if (!address || !wagmiAddress) {
      console.error("[RefinedReportCard] Wallet not connected:", { address, wagmiAddress });
      toast.error("Please connect your wallet first");
      return;
    }

    if (report.is_minted) {
      console.warn("[RefinedReportCard] Report already minted:", report.derivative_id);
      toast.error("This derivative has already been sold");
      return;
    }

    console.log("[RefinedReportCard] Starting purchase flow...");
    console.log("[RefinedReportCard] Current chain:", chain?.id, chain?.name);
    console.log("[RefinedReportCard] User address:", wagmiAddress);
    console.log("[RefinedReportCard] Payment recipient:", PAYMENT_ADDRESS);
    console.log("[RefinedReportCard] Price:", report.price_wip || "0.1", "IP");

    setIsPurchasing(true);

    try {
      // Step 0: MUST be on Story testnet - force switch if not
      if (chain?.id !== STORY_TESTNET_CHAIN_ID) {
        console.log(`[RefinedReportCard] ❌ Wrong network detected!`);
        console.log(`[RefinedReportCard] Current: ${chain?.id} (${chain?.name})`);
        console.log(`[RefinedReportCard] Required: ${STORY_TESTNET_CHAIN_ID} (Story Testnet)`);
        toast("Switching to Story Protocol testnet...");
        
        try {
          console.log("[RefinedReportCard] Attempting to switch chain to Story testnet...");
          
          // Try to switch using wagmi first
          try {
            await switchChain({ chainId: STORY_TESTNET_CHAIN_ID });
            console.log("[RefinedReportCard] ✅ Successfully switched to Story testnet via wagmi");
          } catch (wagmiError: any) {
            console.warn("[RefinedReportCard] Wagmi switch failed, trying manual wallet_addEthereumChain...", wagmiError);
            
            // If wagmi fails, try manual approach with wallet_addEthereumChain
            if (window.ethereum) {
              const chainIdHex = "0x5E9"; // 1513 in hex
              
              try {
                // First try to switch
                await window.ethereum.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: chainIdHex }],
                });
                console.log("[RefinedReportCard] ✅ Switched via wallet_switchEthereumChain");
              } catch (switchError: any) {
                // If network not added (error code 4902), add it first
                if (switchError.code === 4902) {
                  console.log("[RefinedReportCard] Network not found, adding Story Testnet...");
                  toast("Adding Story Testnet to your wallet...");
                  
                  await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                      chainId: chainIdHex,
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
                  console.log("[RefinedReportCard] ✅ Story Testnet added and switched");
                } else {
                  throw switchError;
                }
              }
            } else {
              throw new Error("No ethereum provider found");
            }
          }
          
          toast.success("Switched to Story Protocol testnet!");
          
          // Wait for chain switch to complete and wallet to update
          console.log("[RefinedReportCard] Waiting for wallet to stabilize on new chain...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify the switch was successful
          console.log("[RefinedReportCard] Verifying chain switch...");
          console.log("[RefinedReportCard] Current chain after switch:", chain?.id);
          
        } catch (switchError: any) {
          console.error("[RefinedReportCard] ❌ Chain switch failed:", switchError);
          toast.error("Failed to switch to Story testnet. Please add the network manually in your wallet.");
          setIsPurchasing(false);
          return;
        }
      } else {
        console.log("[RefinedReportCard] ✅ Already on Story testnet");
      }

      // Step 1: Transfer IP (native currency) to payment address on Story testnet
      console.log("[RefinedReportCard] Step 1/3: Preparing payment transaction...");
      toast("Step 1/3: Initiating payment transfer...");

      // Get price and ensure it's a string number
      const priceIP = String(report.price_wip || "0.1");
      console.log("[RefinedReportCard] Raw price from report:", report.price_wip);
      console.log("[RefinedReportCard] Price IP (string):", priceIP);
      
      // Parse to wei (18 decimals for IP token)
      const amountInWei = parseUnits(priceIP, 18);
      
      console.log("[RefinedReportCard] Transaction details:");
      console.log("  - To:", PAYMENT_ADDRESS);
      console.log("  - Price (IP human-readable):", priceIP, "IP");
      console.log("  - Price (Wei/smallest unit):", amountInWei.toString());
      console.log("  - Price (Wei in hex):", `0x${amountInWei.toString(16)}`);
      console.log("  - Chain ID:", STORY_TESTNET_CHAIN_ID);
      console.log("  - Current Wallet Chain:", chain?.id);

      // Verify the amount conversion is correct
      const expectedWei = parseUnits(priceIP, 18);
      if (amountInWei !== expectedWei) {
        console.error("[RefinedReportCard] ⚠️ WARNING: Amount mismatch!");
        console.error("  Expected:", expectedWei.toString());
        console.error("  Got:", amountInWei.toString());
      }

      // Check balance before attempting transaction
      console.log("[RefinedReportCard] Checking wallet balance...");
      if (balanceData) {
        const balanceInIP = formatUnits(balanceData.value, 18);
        console.log("[RefinedReportCard] Current balance:", balanceInIP, "IP");
        console.log("[RefinedReportCard] Required amount:", priceIP, "IP");
        
        if (balanceData.value < amountInWei) {
          const shortfall = amountInWei - balanceData.value;
          const shortfallIP = formatUnits(shortfall, 18);
          console.error("[RefinedReportCard] ❌ Insufficient balance!");
          console.error("  Have:", balanceInIP, "IP");
          console.error("  Need:", priceIP, "IP");
          console.error("  Short:", shortfallIP, "IP");
          
          toast.error(`Insufficient IP balance. You have ${balanceInIP} IP but need ${priceIP} IP. Get testnet IP from the Story faucet.`);
          setIsPurchasing(false);
          return;
        } else {
          console.log("[RefinedReportCard] ✅ Balance check passed");
        }
      } else {
        console.warn("[RefinedReportCard] ⚠️ Could not fetch balance, proceeding anyway...");
      }

      // Send native IP transfer transaction on Story testnet using MetaMask directly
      console.log("[RefinedReportCard] Using MetaMask for payment (bypassing CDP)...");
      
      if (!window.ethereum) {
        toast.error("MetaMask not found. Please install MetaMask to make purchases.");
        setIsPurchasing(false);
        return;
      }

      try {
        // Step 1: Request MetaMask connection and get accounts
        console.log("[RefinedReportCard] Requesting MetaMask connection...");
        toast("Connecting to MetaMask...");
        
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        }) as string[];
        
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found in MetaMask");
        }
        
        const metamaskAddress = accounts[0];
        console.log("[RefinedReportCard] ✅ MetaMask connected:", metamaskAddress);
        toast.success("MetaMask connected!");
        
        // Step 2: Send the transaction from the connected MetaMask account
        console.log("[RefinedReportCard] Sending transaction via MetaMask...");
        toast("Step 2/3: Approve transaction in MetaMask...");
        
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: metamaskAddress,
            to: PAYMENT_ADDRESS,
            value: `0x${amountInWei.toString(16)}`, // Convert to hex string
          }],
        }) as `0x${string}`;
        
        console.log("[RefinedReportCard] ✅ Transaction submitted successfully via MetaMask!");
        console.log("[RefinedReportCard] Transaction hash:", txHash);
        console.log("[RefinedReportCard] From address:", metamaskAddress);
        toast("Transaction submitted! Waiting for confirmation...");
        
        // Mark that we're waiting for purchase to complete after tx confirms
        setAwaitingPurchase(true);
        
        // Step 3: Wait for transaction confirmation
        console.log("[RefinedReportCard] Monitoring transaction confirmation...");
        const checkConfirmation = async () => {
          try {
            const receipt = await window.ethereum!.request({
              method: "eth_getTransactionReceipt",
              params: [txHash],
            });
            
            if (receipt && (receipt as any).status === "0x1") {
              console.log("[RefinedReportCard] ✅ Transaction confirmed!");
              console.log("[RefinedReportCard] Receipt:", receipt);
              
              // Transaction confirmed, proceed to complete purchase
              await completePurchase(txHash);
            } else if (receipt && (receipt as any).status === "0x0") {
              console.error("[RefinedReportCard] ❌ Transaction failed on-chain");
              toast.error("Transaction failed on-chain. Please try again.");
              setIsPurchasing(false);
              setAwaitingPurchase(false);
            } else {
              // Still pending, check again in 2 seconds
              console.log("[RefinedReportCard] Transaction still pending...");
              setTimeout(checkConfirmation, 2000);
            }
          } catch (error) {
            console.error("[RefinedReportCard] Error checking transaction:", error);
            // Retry
            setTimeout(checkConfirmation, 2000);
          }
        };
        
        // Start monitoring
        checkConfirmation();
        
      } catch (txError: any) {
        console.error("[RefinedReportCard] ❌ MetaMask transaction failed:", txError);
        
        if (txError.code === 4001) {
          toast.error("Transaction rejected by user");
        } else if (txError.code === 4100) {
          toast.error("MetaMask not authorized. Please connect your wallet.");
        } else if (txError.code === -32002) {
          toast.error("MetaMask connection request already pending. Please check MetaMask.");
        } else {
          toast.error(`Transaction failed: ${txError.message || "Unknown error"}`);
        }
        
        setIsPurchasing(false);
        setAwaitingPurchase(false);
        return;
      }

    } catch (error: any) {
      console.error("[RefinedReportCard] ❌ Payment failed:", error);
      console.error("[RefinedReportCard] Error details:", {
        message: error.message,
        code: error.code,
        data: error.data,
      });
      toast.error(`Failed to process payment: ${error.message || "Unknown error"}`);
      setIsPurchasing(false);
      setAwaitingPurchase(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white backdrop-blur-sm transition-all hover:border-sky-400 hover:shadow-xl hover:shadow-sky-100">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/30 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {report.thumbnailUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={report.thumbnailUrl}
            alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
        </div>
      )}
      <div className="relative p-6 space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-slate-900 font-cairo line-clamp-2 group-hover:text-sky-600 transition-colors">
              {report.title || `${report.type} Air Quality Report`}
            </h3>
            <button onClick={onOpenDetails} className="text-slate-400 hover:text-sky-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{date}</p>
          <p className="text-sm text-slate-600 mt-2 line-clamp-3">LLM-ready AQI Report</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {report.type} Report
          </span>
          <span>•</span>
          <span className="font-mono">{report.derivative_id?.slice(0, 12)}...</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">
                              {report.price_wip || "0.1"}
                            </span>
              <span className="text-slate-600 font-semibold">IP</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Includes 10% platform fee + 5% creator royalty</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded">Story Protocol</div>
            <p className="text-xs text-slate-500">Blockchain-verified</p>
          </div>
        </div>
        <button onClick={onOpenRawData} className="w-full text-center text-xs text-sky-600 hover:underline">See Raw Data</button>
        <Button
          onClick={handleBuyLicense}
          disabled={isPurchasing || isSendingTx || isConfirming || isSwitchingChain || !address || report.is_minted}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-sky-200 hover:shadow-sky-300"
        >
          Buy
        </Button>
      </div>
    </div>
  );
}
