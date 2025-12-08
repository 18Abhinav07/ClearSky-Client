/**
 * Creation Card Component
 *
 * Displays an owned IP asset (user's derivative creation)
 * Shows revenue stats and claim button
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { type OwnedIPAsset } from "../../services/api/user-assets.service";

interface CreationCardProps {
  creation: OwnedIPAsset;
  onClaimRevenue: () => void;
}

export function CreationCard({ creation, onClaimRevenue }: CreationCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaimRevenue();
    } finally {
      setIsClaiming(false);
    }
  };

  const hasClaimableRevenue = parseFloat(creation.claimableRevenue) > 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white backdrop-blur-sm transition-all hover:border-green-400 hover:shadow-xl hover:shadow-green-100">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Thumbnail */}
      {creation.metadata.thumbnailUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={creation.metadata.thumbnailUrl}
            alt={creation.metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />

          {/* Revenue Badge */}
          {hasClaimableRevenue && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                Revenue Available
              </span>
            </div>
          )}
        </div>
      )}

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-cairo line-clamp-2">
            {creation.metadata.title}
          </h3>
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
            {creation.metadata.description}
          </p>
        </div>

        {/* IP ID */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 01-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
          <span>IP Asset:</span>
          <span className="font-mono">
            {creation.ipId.slice(0, 6)}...{creation.ipId.slice(-4)}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Total Earned</p>
            <p className="text-lg font-bold text-slate-900">
              {creation.totalRevenue} <span className="text-sm font-normal text-slate-600">WIP</span>
            </p>
          </div>
          <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-xs text-green-700 mb-1">Claimable</p>
            <p className="text-lg font-bold text-green-700">
              {creation.claimableRevenue} <span className="text-sm font-normal text-green-600">WIP</span>
            </p>
          </div>
        </div>

        {/* Derivatives Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Derivatives Created:</span>
          <span className="font-semibold text-slate-900">{creation.childrenCount}</span>
        </div>

        {/* Claim Button */}
        <Button
          onClick={handleClaim}
          disabled={!hasClaimableRevenue || isClaiming}
          className={`w-full font-semibold py-3 rounded-xl transition-all ${
            hasClaimableRevenue
              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-200 hover:shadow-green-300"
              : "bg-gray-300 cursor-not-allowed"
          } text-white`}
        >
          {isClaiming ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Claiming Revenue...
            </span>
          ) : hasClaimableRevenue ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Claim {creation.claimableRevenue} WIP
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No Revenue to Claim
            </span>
          )}
        </Button>

        {/* Info */}
        {hasClaimableRevenue && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-green-700">
              Revenue from {creation.childrenCount} derivative{creation.childrenCount !== 1 ? 's' : ''} ready to claim
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
