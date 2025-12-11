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
import { useAuth } from "../../hooks/useAuth"; // Import useAuth
import { type RefinedReport } from "../../services/api/marketplace.service"; // Import RefinedReport

export function MyCreationsTab() {
  const storyClient = useStoryClient();
  const toast = useToast();
  const { address } = useAuth(); // Get address from useAuth

  const { data: creations, isLoading, refetch } = useQuery({
    queryKey: ["user-creations", address], // Update queryKey
    queryFn: () => getUserCreations(address!), // Pass address to getUserCreations
    enabled: !!address, // Only run query if address is available
  });

  // Temporarily remove handleClaimRevenue and related blockchain logic for now
  // as RefinedReport does not directly contain IP asset specific fields like childIpIds
  const handleClaimRevenue = async (creation: any) => {
    toast.info("Claim revenue functionality is under development for this view.");
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!creations || creations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Creations Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creations.map((creation) => (
          <CreationCard
            key={creation.derivative_id} // Use derivative_id as key for RefinedReport
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
      <button
        onClick={() => {
          // Redirect to marketplace
          window.location.href = "/marketplace";
        }}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Explore Marketplace
      </button>
      
    </div>
  );
}
