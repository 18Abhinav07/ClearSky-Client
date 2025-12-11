/**
 * My Collection Tab
 *
 * Displays purchased licenses with:
 * - Secure download (signature verification)
 * - Create derivative functionality
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { getUserAssets } from "../../services/api/user-assets.service";
import { LicenseCard } from "../../components/UserProfile/LicenseCard";
import { CreateDerivativeModal } from "../../components/Marketplace/CreateDerivativeModal";
import { type PurchasedLicense } from "../../services/api/user-assets.service";

export function MyCollectionTab() {
  const { address } = useAuth();
  const { data: purchases, isLoading, refetch } = useQuery({
    // Use the user's address in the query key to ensure data is fetched per user
    queryKey: ["user-assets", address],
    // Call the new service function with the user's address
    queryFn: () => getUserAssets(address!),
    // Only run the query if the address is available
    enabled: !!address,
  });

  const [selectedForDerivative, setSelectedForDerivative] = useState<PurchasedLicense | null>(null);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!purchases || purchases.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Collection Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Licenses"
            value={purchases.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
          <StatCard
            label="Can Create Derivatives"
            value={purchases.filter(p => p.can_create_derivatives).length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          />
          <StatCard
            label="Recent Purchases"
            value={purchases.filter(p => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(p.purchased_at) > weekAgo;
            }).length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Licenses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((asset) => {
            const license: PurchasedLicense = {
              assetId: asset.asset_id,
              licenseTokenId: asset.license_token_id,
              ipId: asset.ip_id,
              derivativeId: asset.derivative_id,
              title: "", // This will be fetched later
              description: "", // This will be fetched later
              purchasedAt: asset.purchased_at,
              canCreateDerivative: asset.can_create_derivatives,
              txHash: asset.tx_hash,
            };
            return (
              <LicenseCard
                key={asset.asset_id}
                license={license}
                onCreateDerivative={() => setSelectedForDerivative(license)}
                onDownloadSuccess={() => refetch()}
              />
            );
          })}
        </div>
      </div>

      {/* Create Derivative Modal */}
      {selectedForDerivative && (
        <CreateDerivativeModal
          parentAssetId={selectedForDerivative.assetId}
          parentIpId={selectedForDerivative.ipId}
          parentLicenseTokenId={selectedForDerivative.licenseTokenId}
          onClose={() => setSelectedForDerivative(null)}
          onSuccess={() => {
            setSelectedForDerivative(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-white/60 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-black/80">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 bg-slate-800/30 border border-slate-700 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">No Licenses Yet</h2>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        Visit the marketplace to purchase your first license and start creating derivatives
      </p>
      <a
        href="/marketplace"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Browse Marketplace
      </a>
    </div>
  );
}
