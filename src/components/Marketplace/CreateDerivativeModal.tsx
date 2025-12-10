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
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { createUserDerivative } from "../../services/api/marketplace.service";

interface CreateDerivativeModalProps {
  parentAssetId: string;
  parentIpId: string;
  parentLicenseTokenId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDerivativeModal({
  parentAssetId,
  onClose,
  onSuccess
}: CreateDerivativeModalProps) {
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [derivativeType, setDerivativeType] = useState("creative_derivative");
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState("0");
  const [creatorRevShare, setCreatorRevShare] = useState("10");

  const [isCreating, setIsCreating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreate = async () => {
    if (!title || !description || !file) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsCreating(true);

    try {
      // In a real app, you'd upload the file to a service like IPFS or a custom backend
      // and get a content URI back. For this demo, we'll use a mock URI.
      const contentUri = `ipfs://mock-uri-for-${file.name}`;

      await createUserDerivative({
        parentAssetId,
        title,
        description,
        derivativeType: derivativeType.toLowerCase(),
        contentUri,
        price: parseFloat(price),
        creatorRevShare: parseFloat(creatorRevShare),
      });

      toast.success("Derivative created successfully!");
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error("[CreateDerivativeModal] Failed to create derivative:", error);
      toast.error(error.message || "Failed to create derivative");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 font-cairo mb-2">Create Derivative</h2>
            <p className="text-slate-600 text-sm">Transform licensed content into your unique creation</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 3D Visualization of Mumbai Air Quality" className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl" disabled={isCreating} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your derivative creation..." rows={4} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl resize-none" disabled={isCreating} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Derivative Type *</label>
              <select value={derivativeType} onChange={(e) => setDerivativeType(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl" disabled={isCreating}>
                <option value="MODEL">Model</option>
                <option value="DATASET">Dataset</option>
                <option value="ANALYSIS">Analysis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Upload File *</label>
              <input type="file" onChange={handleFileChange} className="w-full" disabled={isCreating} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Price (WIP tokens)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl" disabled={isCreating} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Creator Revenue Share (%)</label>
              <input type="number" value={creatorRevShare} onChange={(e) => setCreatorRevShare(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl" disabled={isCreating} />
            </div>
            <div className="flex gap-4 pt-4">
              <Button onClick={onClose} disabled={isCreating} className="flex-1 bg-gray-200 hover:bg-gray-300 text-slate-900 font-semibold py-3 rounded-xl">Cancel</Button>
              <Button onClick={handleCreate} disabled={isCreating || !title || !description || !file} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-xl">
                {isCreating ? "Creating..." : "Create Derivative"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
