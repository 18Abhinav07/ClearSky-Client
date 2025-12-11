/**
 * Derivative Card Component
 *
 * Displays a derivative IP asset (child IP) with parent link
 * Supports custom pricing set by creator
 */

import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { purchaseCommunityDerivative, type DerivativeAsset } from "../../services/api/marketplace.service";

interface DerivativeCardProps {
  derivative: DerivativeAsset;
  onPurchaseSuccess?: () => void;
}

export function DerivativeCard({
  derivative,
  onPurchaseSuccess
}: DerivativeCardProps) {
  const { address } = useAuth();
  const toast = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleBuyLicense = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsPurchasing(true);

    try {
      await purchaseCommunityDerivative(derivative.user_derivative_id, address);
      toast.success("License purchased from derivative!");
      onPurchaseSuccess?.();

    } catch (error: any) {
      console.error("[DerivativeCard] Purchase failed:", error);
      toast.error(error.message || "Failed to purchase license");
    } finally {
      setIsPurchasing(false);
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