/**
 * My Creations Tab
 *
 * Displays user's owned IP assets (derivatives they created)
 * Allows claiming royalty revenue
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserCreations } from "../../services/api/user-assets.service";
import { CreationCard } from "../../components/UserProfile/CreationCard";
import { useStoryClient } from "../../hooks/useStoryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth"; // Import useAuth
import { type RefinedReport } from "../../services/api/marketplace.service"; // Import RefinedReport
import { Button } from "../../components/ui/button";

export function MyCreationsTab() {
  const _storyClient = useStoryClient();
  const toast = useToast();
  const { address } = useAuth(); // Get address from useAuth
  const [detailsModalCreation, setDetailsModalCreation] = useState<any>(null);

  const { data: creations, isLoading } = useQuery({
    queryKey: ["user-creations", address], // Update queryKey
    queryFn: () => getUserCreations(address!), // Pass address to getUserCreations
    enabled: !!address, // Only run query if address is available
  });

  // Temporarily remove handleClaimRevenue and related blockchain logic for now
  // as RefinedReport does not directly contain IP asset specific fields like childIpIds
  const handleClaimRevenue = async (_creation: any) => {
    toast.success("Claim revenue functionality is under development for this view.");
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!creations || creations.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Creations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creations.map((creation) => (
            <CreationCard
              key={creation.derivative_id} // Use derivative_id as key for RefinedReport
              creation={creation}
              onClaimRevenue={() => handleClaimRevenue(creation)}
              onOpenDetails={() => setDetailsModalCreation(creation)}
            />
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {detailsModalCreation && (
        <CreationDetailsModal
          creation={detailsModalCreation}
          onClose={() => setDetailsModalCreation(null)}
        />
      )}
    </>
  );
}

function CreationDetailsModal({ creation, onClose }: { creation: any, onClose: () => void }) {
  // Handle both marketplace format (processing.ipfs_uri) and my-creations format (ipfs_hash directly)
  const ipfsHash = (creation as any).ipfs_hash || creation.processing?.ipfs_hash;
  const ipfsUri = (creation as any).content_uri || creation.processing?.ipfs_uri;
  const ipfsGatewayUrl = ipfsHash ? `https://ipfs.io/ipfs/${ipfsHash}` : null;
  
  // Get the child IP ID for user creations
  const ipId = (creation as any).child_ip_id || creation.ip_id;
  const tokenId = (creation as any).child_token_id || creation.token_id;
  const licenseTermsId = (creation as any).license_terms_id || creation.licenseTermsId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Creation Details</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl font-bold">
            &times;
          </button>
        </div>
        
        <div className="space-y-4 text-sm">
          {/* IP Asset Information */}
          <div>
            <label className="font-semibold text-slate-700">IP Asset ID:</label>
            <p className="font-mono text-xs break-all text-slate-900 mt-1">{ipId || 'N/A'}</p>
          </div>
          
          <div>
            <label className="font-semibold text-slate-700">Token ID:</label>
            <p className="font-mono text-xs break-all text-slate-900 mt-1">{tokenId || 'N/A'}</p>
          </div>

          <div>
            <label className="font-semibold text-slate-700">License Terms ID:</label>
            <p className="font-mono text-xs break-all text-slate-900 mt-1">{licenseTermsId || 'N/A'}</p>
          </div>

          {/* Parent Asset Info (only for user creations) */}
          {(creation as any).parent_ip_id && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-2">Parent Asset</h4>
              <div className="mb-3">
                <label className="font-semibold text-slate-700">Parent IP ID:</label>
                <p className="font-mono text-xs break-all text-slate-900 mt-1">{(creation as any).parent_ip_id}</p>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Parent Asset ID:</label>
                <p className="font-mono text-xs break-all text-slate-900 mt-1">{(creation as any).parent_asset_id || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* IPFS Information */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-slate-900 mb-2">Blockchain Verification</h4>
            
            <div className="mb-3">
              <label className="font-semibold text-slate-700">IPFS Hash:</label>
              <p className="font-mono text-xs break-all text-slate-900 mt-1">{ipfsHash || 'N/A'}</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Content URI:</label>
              {ipfsGatewayUrl ? (
                <a 
                  href={ipfsGatewayUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-mono text-xs break-all text-blue-600 hover:underline block mt-1"
                >
                  {ipfsUri || `ipfs://${ipfsHash}`}
                </a>
              ) : (
                <p className="font-mono text-xs break-all text-slate-900 mt-1">{ipfsUri || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Creation Metadata */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-slate-900 mb-2">Metadata</h4>
            
            <div className="mb-3">
              <label className="font-semibold text-slate-700">Title:</label>
              <p className="text-slate-900 mt-1">{(creation as any).title || 'N/A'}</p>
            </div>

            <div className="mb-3">
              <label className="font-semibold text-slate-700">Description:</label>
              <p className="text-slate-900 mt-1">{(creation as any).description || 'N/A'}</p>
            </div>

            <div className="mb-3">
              <label className="font-semibold text-slate-700">Derivative Type:</label>
              <p className="text-slate-900 mt-1">{(creation as any).derivative_type || creation.type || 'N/A'}</p>
            </div>

            <div className="mb-3">
              <label className="font-semibold text-slate-700">Created At:</label>
              <p className="text-slate-900 mt-1">{new Date((creation as any).createdAt || creation.created_at).toLocaleString()}</p>
            </div>

            {/* Sales Info (only for user creations) */}
            {typeof (creation as any).total_sales !== 'undefined' && (
              <>
                <div className="mb-3">
                  <label className="font-semibold text-slate-700">Total Sales:</label>
                  <p className="text-slate-900 mt-1">{(creation as any).total_sales}</p>
                </div>
                <div className="mb-3">
                  <label className="font-semibold text-slate-700">Total Revenue:</label>
                  <p className="text-slate-900 mt-1">{(creation as any).total_revenue} IP</p>
                </div>
                <div className="mb-3">
                  <label className="font-semibold text-slate-700">Revenue Share:</label>
                  <p className="text-slate-900 mt-1">{(creation as any).creator_rev_share}%</p>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Listed:</label>
                  <p className="text-slate-900 mt-1">{(creation as any).is_listed ? 'Yes' : 'No'}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white">Close</Button>
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
