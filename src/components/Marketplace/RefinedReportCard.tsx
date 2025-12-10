/**
 * Refined Report Card Component
 *
 * Displays a derivative (AI-generated report) with purchase functionality
 * Flow: Backend mints NFT → Frontend mints LICENSE via Story SDK
 */

import { useState } from "react";
import { type Address } from "viem";
import { useAuth } from "../../hooks/useAuth";
import { useStoryClient } from "../../hooks/useStoryClient";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { type RefinedReport } from "../../services/api/marketplace.service";
import { getStoredTokens } from "../../services/api/auth.service";

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
  const storyClient = useStoryClient();
  const toast = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const dateMatch = report.content.match(/# 📜 Daily Log: (.*)/);
  const date = dateMatch ? dateMatch[1] : '';

  const handleBuyLicense = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (report.is_minted) {
      toast.error("This derivative has already been sold");
      return;
    }

    setIsPurchasing(true);

    try {
      const tokens = getStoredTokens();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (tokens?.access_token) {
        headers["Authorization"] = `Bearer ${tokens.access_token}`;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/marketplace/purchase/${report.derivative_id}`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ buyerWallet: address }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Purchase failed");
      }

      const result = await response.json();

      if (storyClient && result.data.ip_id) {
        try {
          await storyClient.buyLicense({
            ipId: result.data.ip_id as Address,
            licenseTermsId: "5",
            priceWIP: "0",
          });
        } catch (licenseError) {
          console.warn("[RefinedReportCard] License minting failed (non-critical):", licenseError);
        }
      }

      toast.success("Purchase successful! Check your profile to view and download.");
      onPurchaseSuccess?.();
    } catch (error: any) {
      console.error("[RefinedReportCard] Purchase failed:", error);
      toast.error(`Failed to purchase: ${error.message || "Unknown error"}`);
    } finally {
      setIsPurchasing(false);
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
                              {report.price_wip || "5"}
                            </span>
              <span className="text-slate-600 font-semibold">WIP</span>
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
          disabled={isPurchasing || !address || report.is_minted}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-sky-200 hover:shadow-sky-300"
        >
          {isPurchasing ? "Processing Purchase..." : report.is_minted ? "Sold Out" : !address ? "Connect Wallet to Buy" : `Buy for ${report.price_wip || "5"} WIP`}
        </Button>
      </div>
    </div>
  );
}
