/**
 * Derivatives Gallery Component
 *
 * Displays community-created derivatives (child IPs)
 * Allows filtering by parent IP
 */

import { useQuery } from "@tanstack/react-query";
import { getCommunityDerivatives } from "../../services/api/marketplace.service"; // Changed import
import { DerivativeCard } from "../../components/Marketplace/DerivativeCard";

export function DerivativesGallery() {
  // Removed: const [parentFilter, setParentFilter] = useState<string>("");

  const { data: derivatives, isLoading } = useQuery({
    queryKey: ["marketplace-community-derivatives"], // Updated queryKey
    queryFn: getCommunityDerivatives // Changed queryFn
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!derivatives || derivatives.length === 0) {
    return <EmptyState />;
  }

  
    return (
      <div className="space-y-6">
        {/* Masonry Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {derivatives.map((derivative) => (
            <DerivativeCard
              key={derivative.user_derivative_id}
              derivative={derivative}
            />
          ))}
        </div>
      </div>
    );
  }
function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-96 bg-slate-800/30 border border-slate-700 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border border-slate-700 border-dashed rounded-2xl bg-slate-900/30">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No Derivatives Yet
      </h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto">
        Be the first to create a derivative! Purchase a license and unleash your creativity.
      </p>
    </div>
  );
}
