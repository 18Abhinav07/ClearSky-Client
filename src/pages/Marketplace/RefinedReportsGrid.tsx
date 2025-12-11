/**
 * Refined Reports Grid Component
 *
 * Displays AI-generated reports as IP Assets
 * Shows loader while backend mints the IP Asset
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { browseMarketplace, type RefinedReport } from "../../services/api/marketplace.service";
import { GeneratingLoader } from "../../components/Marketplace/GeneratingLoader";
import { RefinedReportCard } from "../../components/Marketplace/RefinedReportCard";
import { Button } from "../../components/ui/button";

interface RefinedReportsGridProps {
  searchParams: {
    city?: string;
    sensorType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function RefinedReportsGrid({ searchParams }: RefinedReportsGridProps) {
  const [detailsModalReport, setDetailsModalReport] = useState<RefinedReport | null>(null);
  const [rawDataModalReport, setRawDataModalReport] = useState<RefinedReport | null>(null);

  // Use searchParams directly without adding creator filter
  // This ensures all derivatives matching the search criteria are shown
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["marketplace-browse", searchParams],
    queryFn: () => browseMarketplace(searchParams),
  });

  if (isLoading) {
    return <GeneratingLoader />;
  }

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
    <>
      <div className="flex gap-8 overflow-x-auto pb-4 max-h-[350px]">
        {reports.map((report) => (
          <div key={report.derivative_id} className="flex-shrink-0 w-90">
        <RefinedReportCard
          report={report}
          onPurchaseSuccess={() => refetch()}
          onOpenDetails={() => setDetailsModalReport(report)}
          onOpenRawData={() => setRawDataModalReport(report)}
        />
          </div>
        ))}
      </div>
      {detailsModalReport && <ReportDetailsModal report={detailsModalReport} onClose={() => setDetailsModalReport(null)} />}
      {rawDataModalReport && <RawDataModal primitiveData={rawDataModalReport.primitive_data} onClose={() => setRawDataModalReport(null)} />}
    </>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Raw Sensor Data</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl font-bold">
            &times;
          </button>
        </div>
        <div className="space-y-4">
          {(primitiveData || []).map((data: any, index: number) => (
            <div key={index} className="border-b pb-4">
              <h4 className="font-semibold">Reading ID: <span className="font-mono text-xs">{data.reading_id}</span></h4>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Parameter</th>
                      <th scope="col" className="px-6 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.sensor_data).map(([key, value]) => (
                      <tr key={key} className="bg-white border-b">
                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{key}</th>
                        <td className="px-6 py-4">{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full mt-6">Close</Button>
      </div>
    </div>
  );
}