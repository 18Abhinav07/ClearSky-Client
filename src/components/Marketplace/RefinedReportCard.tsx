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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false);

  const dateMatch = report.content.match(/# 📜 Daily Log: (.*)/);
  const date = dateMatch ? dateMatch[1] : '';

  const handleBuyLicense = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if already sold
    if (report.is_minted) {
      toast.error("This derivative has already been sold");
      return;
    }

    setIsPurchasing(true);

    try {
      console.log("[RefinedReportCard] Purchasing derivative NFT...", {
        derivativeId: report.derivative_id,
        buyerWallet: address
      });

      // Step 1: Backend mints NFT and transfers to buyer
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/marketplace/purchase/${report.derivative_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ buyerWallet: address })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Purchase failed");
      }

      const result = await response.json();

      console.log("[RefinedReportCard] ✅ NFT purchased and transferred!", result);

      // Step 2: OPTIONAL - Mint license for derivative creation rights
      if (storyClient && result.data.ip_id) {
        console.log("[RefinedReportCard] Minting license for derivative rights...");

        try {
          await storyClient.buyLicense({
            ipId: result.data.ip_id as Address,
            licenseTermsId: "5",
            priceWIP: "0"
          });
          console.log("[RefinedReportCard] ✅ License minted!");
        } catch (licenseError) {
          console.warn("[RefinedReportCard] License minting failed (non-critical):", licenseError);
        }
      }

      toast.success(
        `Purchase successful! Check your profile to view and download.`
      );

      onPurchaseSuccess?.();

    } catch (error: any) {
      console.error("[RefinedReportCard] Purchase failed:", error);
      toast.error(
        `Failed to purchase: ${error.message || "Unknown error"}`
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
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-slate-900 font-cairo line-clamp-2 group-hover:text-sky-600 transition-colors">
              {report.title || `${report.type} Air Quality Report`}
            </h3>
            <button onClick={() => setIsDetailsModalOpen(true)} className="text-slate-400 hover:text-sky-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{date}</p>
          <p className="text-sm text-slate-600 mt-2 line-clamp-3">
            LLM-ready AQI Report
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
                {report.price_wip || "100"}
              </span>
              <span className="text-slate-600 font-semibold">WIP</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Includes 10% platform fee + 5% creator royalty
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

        <button onClick={() => setIsRawDataModalOpen(true)} className="w-full text-center text-xs text-sky-600 hover:underline">
            See Raw Data
        </button>

        {/* Action Button */}
        <Button
          onClick={handleBuyLicense}
          disabled={isPurchasing || !address || report.is_minted}
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
              Processing Purchase...
            </span>
          ) : report.is_minted ? (
            "Sold Out"
          ) : !address ? (
            "Connect Wallet to Buy"
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Buy for {report.price_wip || "100"} WIP
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
      {isDetailsModalOpen && <ReportDetailsModal report={report} onClose={() => setIsDetailsModalOpen(false)} />}
      {isRawDataModalOpen && <RawDataModal primitiveData={report.primitive_data} onClose={() => setIsRawDataModalOpen(false)} />}
    </div>
  );
}

function ReportDetailsModal({ report, onClose }: { report: RefinedReport, onClose: () => void }) {
  const ipfsHashMatch = report.processing.ipfs_uri?.match(/ipfs:\/\/(.*)/);
  const ipfsHash = ipfsHashMatch ? ipfsHashMatch[1] : null;
  const ipfsGatewayUrl = ipfsHash ? `https://ipfs.io/ipfs/${ipfsHash}` : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Verification Details</h3>
        <div className="space-y-2 text-sm">
          <div>
            <label className="font-semibold">Merkle Root:</label>
            <p className="font-mono text-xs break-all">{report.processing.merkle_root || 'N/A'}</p>
          </div>
          <div>
            <label className="font-semibold">IPFS URI:</label>
            {ipfsGatewayUrl ? (
              <a 
                href={ipfsGatewayUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-xs break-all text-blue-600 hover:underline"
              >
                {report.processing.ipfs_uri}
              </a>
            ) : (
              <p className="font-mono text-xs break-all">{report.processing.ipfs_uri || 'N/A'}</p>
            )}
          </div>
        </div>
        <Button onClick={onClose} className="w-full mt-6">Close</Button>
      </div>
    </div>
  );
}

function RawDataModal({ primitiveData, onClose }: { primitiveData: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Raw Sensor Data</h3>
        <pre className="bg-slate-100 p-4 rounded-lg text-xs">
          {JSON.stringify(primitiveData, null, 2)}
        </pre>
        <Button onClick={onClose} className="w-full mt-6">Close</Button>
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
