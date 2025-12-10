/**
 * License Card Component
 *
 * Displays a purchased license with:
 * - Secure download (wallet signature + backend verification)
 * - Create derivative option
 */

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { downloadDerivative, getDerivativeDetails, type PurchasedLicense } from "../../services/api/user-assets.service";

interface LicenseCardProps {
  license: PurchasedLicense;
  onCreateDerivative: () => void;
  onDownloadSuccess?: () => void;
}

export function LicenseCard({
  license,
  onCreateDerivative,
  onDownloadSuccess
}: LicenseCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [title, setTitle] = useState(license.title || "Loading...");
  const [description, setDescription] = useState(license.description || "Loading...");
  const toast = useToast();

  useEffect(() => {
    async function fetchDetails() {
      if ((!license.title || !license.description) && license.derivativeId) {
        try {
          const details = await getDerivativeDetails(license.derivativeId);
          const titleMatch = details.content.match(/# 📜 (.*)/);
          const newTitle = titleMatch ? titleMatch[1] : 'Untitled Derivative';
          
          const locationMatch = details.content.match(/\*\*Location\*\*: (.*)/);
          const newDescription = locationMatch ? `Location: ${locationMatch[1]}` : 'Details available in download.';

          setTitle(newTitle);
          setDescription(newDescription);
        } catch (error) {
          console.error("Failed to fetch derivative details:", error);
          setTitle("Derivative");
          setDescription("Details unavailable");
        }
      }
    }
    fetchDetails();
  }, [license.derivativeId, license.title, license.description]);


  const handleSecureDownload = async () => {
    setIsDownloading(true);
    try {
      console.log(`[LicenseCard] Downloading content for derivative: ${license.derivativeId}`);
      const { content } = await downloadDerivative(license.derivativeId);

      // Create a blob from the markdown content
      const blob = new Blob([content], { type: 'text/markdown' });

      // Create a temporary link to trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${license.derivativeId}.md`; // Set a filename
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download started successfully!");
      onDownloadSuccess?.();

    } catch (error: any) {
      console.error("[LicenseCard] Download failed:", error);
      toast.error(error.message || "Failed to download - Please try again");
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-white font-cairo line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">License Token:</span>
            <span className="font-mono text-slate-300">
              {license.licenseTokenId.slice(0, 6)}...{license.licenseTokenId.slice(-4)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">IP Asset:</span>
            <span className="font-mono text-slate-300">
              {license.ipId.slice(0, 6)}...{license.ipId.slice(-4)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Purchased:</span>
            <span className="text-slate-300">
              {new Date(license.purchasedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* Actions */}
        <div className="space-y-2">
          {/* Secure Download Button */}
          <Button
            onClick={handleSecureDownload}
            disabled={isDownloading}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition-all"
          >
            {isDownloading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Access...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Secure Download
              </span>
            )}
          </Button>

          {/* Create Derivative Button */}
          {license.canCreateDerivative && (
            <Button
              onClick={onCreateDerivative}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 rounded-xl transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Derivative
              </span>
            </Button>
          )}
        </div>

        {/* Security Info */}
        <div className="pt-2">
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-300">
              Secure download uses wallet signature verification to ensure only license holders can access content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}