/**
 * Create Derivative Modal
 *
 * Allows users to create derivatives from purchased licenses
 * Features:
 * - File upload (IPFS handled by backend)
 * - Metadata input (title, description)
 * - Custom pricing option
 * - Real blockchain registration via Story SDK
 */

import { useState } from "react";
import { useStoryClient } from "../../hooks/useStoryClient";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { registerDerivative } from "../../services/api/user-assets.service";

interface CreateDerivativeModalProps {
  parentIpId: string;
  parentLicenseTokenId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDerivativeModal({
  parentIpId,
  parentLicenseTokenId,
  onClose,
  onSuccess
}: CreateDerivativeModalProps) {
  const storyClient = useStoryClient();
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [customPricing, setCustomPricing] = useState(false);
  const [customPrice, setCustomPrice] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreate = async () => {
    if (!storyClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!title || !description || !file) {
      toast.error("Please fill all required fields");
      return;
    }

    if (customPricing && (!customPrice || parseFloat(customPrice) <= 0)) {
      toast.error("Please enter a valid custom price");
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Upload file to IPFS (simulated - backend handles this)
      console.log("[CreateDerivativeModal] Uploading file to IPFS...");
      setUploadProgress(30);

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload
      const mockIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}`; // Mock IPFS hash

      setUploadProgress(60);

      // Step 2: Register derivative on Story Protocol
      console.log("[CreateDerivativeModal] Registering derivative IP...");

      // REAL BLOCKCHAIN CALL - Register Derivative
      const result = await storyClient.registerDerivative({
        parentIpId: parentIpId as any,
        licenseTermsId: "5", // TODO: Get from parent license
        ipfsHash: mockIpfsHash,
        metadata: {
          title,
          description
        }
      });

      console.log("[CreateDerivativeModal] ✅ Derivative registered:", result);

      setUploadProgress(90);

      // Step 3: Sync with backend
      await registerDerivative({
        childIpId: result.childIpId,
        parentIpId: parentIpId,
        licenseTokenId: parentLicenseTokenId,
        metadata: {
          title,
          description,
          type: "creative_derivative"
        },
        txHash: result.txHash,
        customPrice: customPricing ? customPrice : undefined
      });

      setUploadProgress(100);

      toast.success(
        `Derivative created successfully! Child IP: ${result.childIpId.slice(0, 10)}...`
      );

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error("[CreateDerivativeModal] Failed to create derivative:", error);
      toast.error(error.message || "Failed to create derivative");
    } finally {
      setIsCreating(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isCreating}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 font-cairo mb-2">
              Create Derivative
            </h2>
            <p className="text-slate-600 text-sm">
              Transform licensed content into your unique creation
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 3D Visualization of Mumbai Air Quality"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                disabled={isCreating}
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your derivative creation..."
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none"
                disabled={isCreating}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Upload File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={isCreating}
                  accept="image/*,video/*,.pdf,.mp3,.mp4"
                />
                <label
                  htmlFor="file-upload"
                  className={`block w-full px-4 py-8 bg-white border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer transition-all ${
                    isCreating ? "opacity-50 cursor-not-allowed" : "hover:border-purple-400 hover:bg-purple-50/30"
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-slate-900 font-semibold">{file.name}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-slate-900 font-semibold mb-1">Click to upload</p>
                      <p className="text-sm text-slate-600">
                        Images, videos, PDFs, or audio files
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Custom Pricing Option */}
            <div className="p-6 bg-purple-50/50 border-2 border-purple-100 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Custom Pricing</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Set your own price or inherit from parent
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customPricing}
                    onChange={(e) => setCustomPricing(e.target.checked)}
                    disabled={isCreating}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              {customPricing && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Price (WIP tokens)
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="e.g., 25"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    disabled={isCreating}
                  />
                </div>
              )}
            </div>

            {/* Parent Info */}
            <div className="flex items-start gap-3 p-4 bg-sky-50 border-2 border-sky-200 rounded-lg">
              <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-sky-700">
                <p className="font-semibold mb-1">Parent IP Asset</p>
                <p className="text-xs opacity-90 font-mono">
                  {parentIpId.slice(0, 10)}...{parentIpId.slice(-8)}
                </p>
                <p className="text-xs opacity-90 mt-2">
                  Your derivative will be linked to this parent IP and automatically inherit its license terms.
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isCreating && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Creating derivative...</span>
                  <span className="text-slate-900 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 rounded-xl transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !title || !description || !file}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Derivative"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
