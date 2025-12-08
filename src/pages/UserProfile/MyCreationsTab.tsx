/**
 * My Creations Tab
 *
 * Displays user's owned IP assets (derivatives they created)
 * Allows claiming royalty revenue
 */

import { useQuery } from "@tanstack/react-query";
import { getUserCreations } from "../../services/api/user-assets.service";
import { CreationCard } from "../../components/UserProfile/CreationCard";
import { useStoryClient } from "../../hooks/useStoryClient";
import { useToast } from "../../hooks/use-toast";

export function MyCreationsTab() {
  const storyClient = useStoryClient();
  const toast = useToast();

  const { data: creations, isLoading, refetch } = useQuery({
    queryKey: ["user-creations"],
    queryFn: getUserCreations
  });

  const handleClaimRevenue = async (creation: any) => {
    if (!storyClient) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      // REAL BLOCKCHAIN CALL - Claim royalty revenue
      const result = await storyClient.claimAllRevenue({
        ipId: creation.ipId,
        childIpIds: creation.childIpIds
      });

      toast.success(
        `Revenue claimed successfully! ${result.amount} WIP tokens transferred`
      );

      // Refresh data
      refetch();

    } catch (error: any) {
      console.error("[MyCreationsTab] Claim failed:", error);
      toast.error(error.message || "Failed to claim revenue");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!creations || creations.length === 0) {
    return <EmptyState />;
  }

  // Calculate total stats
  const totalRevenue = creations.reduce(
    (sum, c) => sum + parseFloat(c.totalRevenue || "0"),
    0
  );
  const totalClaimable = creations.reduce(
    (sum, c) => sum + parseFloat(c.claimableRevenue || "0"),
    0
  );
  const totalChildren = creations.reduce(
    (sum, c) => sum + c.childrenCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          label="Total Creations"
          value={creations.length}
          subtext="IP Assets"
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          label="Total Revenue"
          value={`${totalRevenue.toFixed(2)} WIP`}
          subtext="All time"
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          label="Claimable"
          value={`${totalClaimable.toFixed(2)} WIP`}
          subtext="Ready to claim"
          gradient="from-yellow-500 to-orange-500"
        />
        <StatCard
          label="Derivatives"
          value={totalChildren}
          subtext="Child IPs"
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Creations Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creations.map((creation) => (
          <CreationCard
            key={creation.ipId}
            creation={creation}
            onClaimRevenue={() => handleClaimRevenue(creation)}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  gradient
}: {
  label: string;
  value: string | number;
  subtext: string;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden p-6 bg-white border-2 border-gray-200 rounded-2xl">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-20 blur-3xl`} />
      <div className="relative">
        <p className="text-sm text-slate-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
        <p className="text-xs text-slate-500">{subtext}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-80 bg-gray-100 border-2 border-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">No Creations Yet</h2>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Create derivatives from your purchased licenses to start earning royalties
      </p>
      <a
        href="/profile"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Go to My Collection
      </a>
    </div>
  );
}
