/**
 * Refined Reports Grid Component
 *
 * Displays AI-generated reports as IP Assets
 * Shows loader while backend mints the IP Asset
 */

/**
 * Refined Reports Grid Component
 *
 * Displays available derivatives from the marketplace.
 */
import { useQuery } from "@tanstack/react-query";
import { browseMarketplace, type SearchRequest } from "../../services/api/marketplace.service";
import { GeneratingLoader } from "../../components/Marketplace/GeneratingLoader";
import { RefinedReportCard } from "../../components/Marketplace/RefinedReportCard";

interface RefinedReportsGridProps {
  searchParams: Omit<SearchRequest, 'start_date' | 'end_date' | 'city'> & { type?: string };
}

export function RefinedReportsGrid({ searchParams }: RefinedReportsGridProps) {
  // The backend supports filtering by 'type', but we'll fetch all types
  // We also hardcode is_minted=false as per the backend E2E test.
  const queryParams = {
    is_minted: false,
  };

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["marketplace-browse", queryParams],
    // The component's searchParams might have more fields than the API needs,
    // but browseMarketplace will only use the ones it knows about.
    queryFn: () => browseMarketplace(queryParams),
    enabled: !!searchParams.type // Only search when a type is selected
  });

  // Show loader while fetching data
  if (isLoading) {
    return <GeneratingLoader />;
  }

  // No reports found or an empty array was returned
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-16 border border-slate-700 border-dashed rounded-2xl bg-slate-900/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No Derivatives Found
        </h3>
        <p className="text-sm text-slate-400">
          Try adjusting your search filters to find available assets.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {reports.map((report) => (
        <RefinedReportCard
          key={report.derivative_id} // Use derivative_id as stable key
          report={report}
          onPurchaseSuccess={() => {
            refetch();
            // Optionally navigate to profile
          }}
        />
      ))}
    </div>
  );
}
