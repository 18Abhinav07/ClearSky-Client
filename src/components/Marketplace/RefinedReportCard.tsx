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

interface RefinedReportCardProps {
  report: RefinedReport;
  onPurchaseSuccess?: () => void;
}

export function RefinedReportCard({
  report,
  onPurchaseSuccess
}: RefinedReportCardProps) {
  const { address } = useAuth();
  const storyClient = useStoryClient();
  const toast = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleBuyLicense = async () => {
    if (!storyClient) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    // Check if derivative has been minted as IP Asset by backend
    if (!report.ip_id || !report.licenseTermsId) {
      toast.error("This derivative hasn't been registered as an IP Asset yet");
      return;
    }

    setIsPurchasing(true);

    try {
      console.log("[RefinedReportCard] Minting license...", {
        ipId: report.ip_id,
        licenseTermsId: report.licenseTermsId,
        priceWIP: report.price_wip
      });

      // REAL BLOCKCHAIN CALL - Mint License Token via Story SDK
      const result = await storyClient.buyLicense({
        ipId: report.ip_id as Address,
        licenseTermsId: report.licenseTermsId!,
        priceWIP: report.price_wip || "100"
      });

      console.log("[RefinedReportCard] ✅ License minted!", result);

      toast.success(
        `License purchased! Token ID: ${result.licenseTokenId}. Check your profile.`
      );

      onPurchaseSuccess?.();

    } catch (error: any) {
      console.error("[RefinedReportCard] License mint failed:", error);
      toast.error(
        `Failed to mint license: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white backdrop-blur-sm transition-all hover:border-sky-400 hover:shadow-xl hover:shadow-sky-100">
      {/* Glass morphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/30 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Thumbnail */}
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
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-cairo line-clamp-2 group-hover:text-sky-600 transition-colors">
            {report.title || `${report.type} Air Quality Report`}
          </h3>
          <p className="text-sm text-slate-600 mt-2 line-clamp-3">
            {report.description || "AI-generated comprehensive analysis of air quality data from our DePIN network sensors."}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {report.type} Report
          </span>
          <span>•</span>
          <span className="font-mono">
            {report.derivative_id?.slice(0, 12)}...
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Price */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {report.price_wip}
              </span>
              <span className="text-slate-600 font-semibold">WIP</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              License fee + 10% royalties to creator
            </p>
          </div>

          {/* Story Protocol Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded">
              Story Protocol
            </div>
            <p className="text-xs text-slate-500">Blockchain-verified</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleBuyLicense}
          disabled={isPurchasing || !storyClient || !report.ip_id}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-sky-200 hover:shadow-sky-300"
        >
          {isPurchasing ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Minting License...
            </span>
          ) : !report.ip_id ? (
            "Not Available Yet"
          ) : !storyClient ? (
            "Connect Wallet"
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mint License
            </span>
          )}
        </Button>

        {/* Benefits List */}
        <div className="pt-2 space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            What you get:
          </p>
          <ul className="space-y-1.5">
            <BenefitItem text="Full access to detailed AI analysis" />
            <BenefitItem text="Secure download with signature verification" />
            <BenefitItem text="Create derivatives & earn royalties" />
            <BenefitItem text="Blockchain-verified ownership" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-slate-600">
      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {text}
    </li>
  );
}
