/**
 * Token Withdraw Component
 *
 * Allows users to:
 * 1. View WIP and IP token balances (fetched from MetaMask)
 * 2. Withdraw WIP tokens (unwrap WIP to IP)
 * 3. Deposit IP tokens (wrap IP to WIP)
 *
 * Uses Story Protocol WIP Client methods from WIPTOKEN.md
 * Balances are fetched directly from MetaMask wallet
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useStoryClient } from "../../hooks/useStoryClient";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { parseEther, formatUnits } from "viem";
import { STORY_TESTNET_CHAIN_ID } from "../../config/story-contracts";

export function TokenWithdraw() {
  const storyClient = useStoryClient();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  /**
   * Fetch token balances from MetaMask on Story testnet
   * IP = native balance, WIP = needs contract call (disabled for now)
   */
  const { data: balances, refetch } = useQuery({
    queryKey: ["metamask-token-balance"],
    queryFn: async () => {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      try {
        // Get connected account
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        }) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found");
        }

        const address = accounts[0];

        // Get native IP balance from Story testnet
        const balanceHex = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        }) as string;

        const balanceWei = BigInt(balanceHex);
        const ipBalance = formatUnits(balanceWei, 18);

        console.log("[TokenWithdraw] Fetched balance from MetaMask:", {
          address,
          ipBalance,
          balanceWei: balanceWei.toString(),
        });

        return {
          ip: parseFloat(ipBalance).toFixed(4),
          wip: "0.00", // WIP balance requires contract call - set to 0 for now
        };
      } catch (error) {
        console.error("[TokenWithdraw] Failed to fetch balance:", error);
        return { ip: "0.00", wip: "0.00" };
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  /**
   * Withdraw WIP tokens (unwrap WIP to IP)
   * Uses: client.wipClient.withdraw()
   */
  const handleWithdraw = async () => {
    if (!storyClient || !withdrawAmount) {
      toast.error("Please enter an amount to withdraw");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > parseFloat(balances?.wip || "0")) {
      toast.error("Insufficient WIP balance");
      return;
    }

    setIsWithdrawing(true);

    try {
      console.log("[TokenWithdraw] Withdrawing WIP tokens:", amount);

      // REAL BLOCKCHAIN CALL - Unwrap WIP to IP
      // This uses the WIP Client from Story SDK
      const response = await (storyClient as any).client.wip.withdraw({
        amount: parseEther(amount.toString())
      });

      console.log("[TokenWithdraw] ✅ Withdrawal successful:", response);

      toast.success(
        `WIP tokens withdrawn! ${amount} WIP → ${amount} IP`
      );

      setWithdrawAmount("");
      refetch();

    } catch (error: any) {
      console.error("[TokenWithdraw] Withdrawal failed:", error);
      toast.error(error.message || "Failed to withdraw tokens");
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * Deposit IP tokens (wrap IP to WIP)
   * Uses: client.wipClient.deposit()
   */
  const handleDeposit = async () => {
    if (!storyClient || !depositAmount) {
      toast.error("Please enter an amount to deposit");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > parseFloat(balances?.ip || "0")) {
      toast.error("Insufficient IP balance");
      return;
    }

    setIsDepositing(true);

    try {
      console.log("[TokenWithdraw] Depositing IP tokens:", amount);

      // REAL BLOCKCHAIN CALL - Wrap IP to WIP
      const response = await (storyClient as any).client.wip.deposit({
        amount: parseEther(amount.toString())
      });

      console.log("[TokenWithdraw] ✅ Deposit successful:", response);

      toast.success(
        `IP tokens deposited! ${amount} IP → ${amount} WIP`
      );

      setDepositAmount("");
      refetch();

    } catch (error: any) {
      console.error("[TokenWithdraw] Deposit failed:", error);
      toast.error(error.message || "Failed to deposit tokens");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <>
      {/* Balance Widget (Always Visible) */}
      <div className="flex items-center gap-4">
        {/* WIP Balance */}
        <div className="px-4 py-2 bg-sky-50 border-2 border-sky-200 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center">
              <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500">WIP</p>
              <p className="text-sm font-bold text-slate-900">{balances?.wip || "0.00"}</p>
            </div>
          </div>
        </div>

        {/* IP Balance */}
        <div className="px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-300 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500">IP</p>
              <p className="text-sm font-bold text-slate-900">{balances?.ip || "0.00"}</p>
            </div>
          </div>
        </div>

        {/* Manage Button */}
       
      </div>

      {/* Modal - Rendered at document.body level using React Portal */}
      {showModal && createPortal(
  <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 backdrop-blur-sm">
    {/* Flex container to handle positioning and scrolling */}
    <div className="flex min-h-full items-start justify-center p-4 text-center">

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl mt-10 mb-10 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl text-left">
        {/* Close Button */}
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors z-10 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 pr-10"> {/* pr-10 prevents text from hitting the close button */}
            <h2 className="text-2xl font-bold text-slate-900 font-cairo mb-2">
              Manage Tokens
            </h2>
            <p className="text-slate-600 text-sm">
              Wrap/unwrap IP and WIP tokens
            </p>
          </div>

          <div className="space-y-6">
            {/* Withdraw WIP (Unwrap) */}
            <div className="p-6 bg-sky-50/50 border-2 border-sky-200 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Withdraw WIP</h3>
                <span className="text-sm text-slate-600">
                  Balance: {balances?.wip || "0.00"} WIP
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Convert WIP tokens back to IP tokens
              </p>

              <div className="space-y-3">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount to withdraw"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 outline-none transition-all"
                />

                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {isWithdrawing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Withdrawing...
                    </span>
                  ) : (
                    "Withdraw WIP → IP"
                  )}
                </Button>
              </div>
            </div>

            {/* Deposit IP (Wrap) */}
            <div className="p-6 bg-purple-50/50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Deposit IP</h3>
                <span className="text-sm text-slate-600">
                  Balance: {balances?.ip || "0.00"} IP
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Convert IP tokens to WIP tokens for marketplace transactions
              </p>

              <div className="space-y-3">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount to deposit"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                />

                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {isDepositing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Depositing...
                    </span>
                  ) : (
                    "Deposit IP → WIP"
                  )}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-sky-50 border-2 border-sky-200 rounded-lg">
              <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-sky-700">
                <p className="font-semibold mb-1">About WIP and IP Tokens</p>
                <p className="text-xs opacity-90">
                  WIP (Wrapped IP) is used for marketplace transactions and license fees.
                  You can freely convert between IP and WIP tokens at a 1:1 ratio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>,
  document.body
)}
    </>
  );
}
