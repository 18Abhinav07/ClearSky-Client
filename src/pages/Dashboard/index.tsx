/**
 * Dashboard - Device & Sensor Readings Interface
 *
 * A clean interface for viewing registered devices and their sensor readings
 * Features:
 * - View registered devices
 * - Display device information (location, sensor types, status)
 * - View sensor reading history
 * - Filter readings by status
 * - View detailed reading information
 * - Delete devices
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../config/routes";
import { Button } from "../../components/ui/button";
import { Toast } from "../../components/ui/toast";
import {
  getDeviceReadings,
  getReadingsByStatus,
  getReadingById,
  type AqiReading,
} from "../../services/api/aqi.service";
import { getUserDevices, deleteDevice, type Device } from "../../services/api/device.service";
import { browseMarketplace, type RefinedReport } from "../../services/api/marketplace.service";
import { useAuthStore } from "../../app/store/authStore";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ... (keep existing interfaces)

interface DerivativeModalState {
  show: boolean;
  content: string;
}

// ... (keep existing Dashboard component up to the main render)

// ... (inside Dashboard component)
  
// ... (rest of the state and functions)


// ... (at the end of the file, before the other component functions)
function DerivativesView() {
  const [derivatives, setDerivatives] = useState<RefinedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAuthStore();
  const [selectedDerivative, setSelectedDerivative] = useState<RefinedReport | null>(null);

  useEffect(() => {
    const loadDerivatives = async () => {
      if (!walletAddress) {
        setIsLoading(false);
        setError("Wallet address not found.");
        return;
      }

      try {
        setIsLoading(true);
        const data = await browseMarketplace({ creator: walletAddress });
        setDerivatives(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load derivatives.");
        console.error("Failed to load derivatives:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDerivatives();
  }, [walletAddress]);

  const openModal = (derivative: RefinedReport) => {
    setSelectedDerivative(derivative);
  };

  const closeModal = () => {
    setSelectedDerivative(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading derivatives...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-red-500">{error}</div>;
  }

  if (derivatives.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-black mb-2">No Derivatives Found</h2>
        <p className="text-slate-400">You have not created any derivatives yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {derivatives.map((derivative) => (
          <DerivativeCard key={derivative.derivative_id} derivative={derivative} onClick={() => openModal(derivative)} />
        ))}
      </div>
      {selectedDerivative && (
        <DerivativeContentModal
          content={selectedDerivative.content}
          onClose={closeModal}
        />
      )}
    </>
  );
}

function DerivativeContentModal({ content, onClose }: { content: string, onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto prose"
        onClick={(e) => e.stopPropagation()}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        <Button onClick={onClose} className="w-full mt-6 bg-black text-white hover:bg-gray-800 rounded-xl">
          Close
        </Button>
      </div>
    </div>
  );
}


interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
}

interface ReadingDetailModal {
  show: boolean;
  reading: AqiReading | null;
}

export default function Dashboard() {
  const { isAuthenticated, address, logout } = useAuth();
  const navigate = useNavigate();

  // ========================================================================
  // State Management
  // ========================================================================
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [readings, setReadings] = useState<AqiReading[]>([]);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "info" });
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Verified" | "Derived" | "Failed">("All");
  const [readingModal, setReadingModal] = useState<ReadingDetailModal>({ show: false, reading: null });
    const [bottomViewMode, setBottomViewMode] = useState<'readings' | 'derivatives'>('readings');

  // ========================================================================
  // Effects
  // ========================================================================

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LANDING);
    }
  }, [isAuthenticated, navigate]);

  // Load user devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      if (!isAuthenticated) return;

      // Debug: Check if tokens exist
      const accessToken = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");
      console.log("[Dashboard] Access token exists:", !!accessToken);
      console.log("[Dashboard] Refresh token exists:", !!refreshToken);
      console.log("[Dashboard] Access token preview:", accessToken?.slice(0, 20) + "...");

      if (!accessToken) {
        console.error("[Dashboard] ❌ No access token found in localStorage!");
        setToast({ show: true, message: "Authentication error: Please login again", type: "error" });
        setDevices([]);
        setIsLoadingDevices(false);
        return;
      }

      setIsLoadingDevices(true);
      try {
        console.log("[Dashboard] Calling getUserDevices API...");
        const response = await getUserDevices();
        console.log("[Dashboard] Device API response:", response);
        console.log("[Dashboard] Devices array:", response.devices);

        // Ensure devices is an array
        if (Array.isArray(response.devices)) {
          setDevices(response.devices);
        } else {
          console.error("[Dashboard] Devices is not an array:", response);
          setDevices([]);
        }
      } catch (error) {
        console.error("[Dashboard] Failed to load devices:", error);
        setToast({ show: true, message: "Failed to load devices", type: "error" });
        setDevices([]); // Set empty array on error
      } finally {
        setIsLoadingDevices(false);
      }
    };

    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Auto-select first device
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].device_id);
    }
  }, [devices, selectedDeviceId]);

  // Load readings when device is selected
  useEffect(() => {
    if (selectedDeviceId) {
      loadDeviceReadings(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  // ========================================================================
  // Data Loading Functions
  // ========================================================================

  const loadDeviceReadings = async (deviceId: string) => {
    setIsLoadingReadings(true);
    try {
      const response = await getDeviceReadings(deviceId, 10);
      setReadings(response.readings);
    } catch (error) {
      console.error("Failed to load readings:", error);
      showToast("Failed to load readings", "error");
    } finally {
      setIsLoadingReadings(false);
    }
  };

  const loadReadingsByStatus = async (status: "Pending" | "Verified" | "Failed" | "Derived") => {
    setIsLoadingReadings(true);
    try {
      const response = await getReadingsByStatus(status, 20);
      setReadings(response.readings);
    } catch (error) {
      console.error("Failed to load filtered readings:", error);
      showToast("Failed to load filtered readings", "error");
    } finally {
      setIsLoadingReadings(false);
    }
  };

  const handlenavigatetoregisterdevice = () => {
    navigate(ROUTES.REGISTER_DEVICE);
  };

  // ========================================================================
  // Action Handlers
  // ========================================================================

  const handleStatusFilterChange = async (status: "All" | "Pending" | "Verified" | "Derived" | "Failed") => {
    setStatusFilter(status);

    if (status === "All") {
      if (selectedDeviceId) {
        await loadDeviceReadings(selectedDeviceId);
      }
    } else {
      await loadReadingsByStatus(status);
    }
  };

  const handleViewReadingDetails = async (readingId: string) => {
    try {
      const reading = await getReadingById(readingId);
      setReadingModal({ show: true, reading });
    } catch (error) {
      console.error("Failed to load reading details:", error);
      showToast("Failed to load reading details", "error");
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to delete this device? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDevice(deviceId);
      showToast("Device deleted successfully", "success");

      // Refresh device list
      const response = await getUserDevices();
      setDevices(response.devices);

      // Clear selection if deleted device was selected
      if (selectedDeviceId === deviceId) {
        setSelectedDeviceId("");
        setReadings([]);
      }
    } catch (error: any) {
      console.error("Failed to delete device:", error);
      showToast(error.message || "Failed to delete device", "error");
    }
  };
  const handlenavigatemarketplace = () => {
    navigate(ROUTES.MARKETPLACE);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LANDING);
  };

  // ========================================================================
  // Helper Functions
  // ========================================================================

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ show: true, message, type });
  };

  const formatTimestamp = (timestamp: number | string | undefined) => {
    if (!timestamp) return "N/A";
    // If it's a string (ISO format), parse directly
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleString();
    }
    // If it's a number (Unix seconds), multiply by 1000
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    
    // Handle VERIFIED status
    if (upperStatus === "VERIFIED") {
      return "bg-green-500";
    }
    // Handle PENDING status
    if (upperStatus === "PENDING") {
      return "bg-yellow-500";
    }
    // Handle FAILED status
    if (upperStatus === "FAILED") {
      return "bg-red-500";
    }
    // Handle DERIVED statuses (DERIVED_INDIVIDUAL, COMPLETE)
    if (upperStatus === "DERIVED_INDIVIDUAL" || upperStatus === "COMPLETE" || upperStatus === "DERIVED") {
      return "bg-blue-500";
    }
    
    return "bg-gray-500";
  };


  // ========================================================================
  // Render Protection
  // ========================================================================

  if (!isAuthenticated) {
    return null;
  }

  // ========================================================================
  // Main Render
  // ========================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== TOP BAR ===== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-black font-cairo">ClearSky</span>
            </div>

              {/* User Profile Section */}
            <div className="flex items-center gap-6">
              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <Button onClick={handlenavigatemarketplace}> Go to Marketplace</Button>
                    </div>
               
              </div>
              </div>
           

            {/* User Profile Section */}
            <div className="flex items-center gap-6">
              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-gray-500 text-xs">Devices Owned</span>
                  <span className="font-bold text-gray-900 font-cairo">{devices.length}</span>
                </div>
               
              </div>
              

              {/* Wallet Address */}
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs text-gray-500">Wallet</span>
                <span className="text-sm font-mono text-gray-900">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>

              {/* Disconnect Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-2 border-black text-black hover:bg-gray-50 px-6 font-semibold rounded-full h-10"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== LEFT COLUMN: Device Readings ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registered Devices Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black font-cairo">My Devices</h2>
                <span className="text-sm text-gray-500">{devices.length} device(s) registered</span>
              </div>

              {isLoadingDevices ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500">Loading devices...</p>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No devices registered</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by registering your first device.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {devices.map((device) => {
                    const isSelected = selectedDeviceId === device.device_id;
                    const cityId = device?.sensor_meta?.city_id || 'Unknown City';
                    const stationId = device?.sensor_meta?.station_id || 'Unknown Station';
                    const city = device?.sensor_meta?.city || cityId;
                    const station = device?.sensor_meta?.station || stationId;

                    return (
                      <div
                        key={device.device_id}
                        className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => setSelectedDeviceId(device.device_id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                              </svg>
                              <h3 className="font-semibold text-gray-900">{city}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                device.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {device.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{station}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {device.sensor_meta?.sensor_types?.map((sensorType) => (
                                <span key={sensorType} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                  {sensorType}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 font-mono">
                              ID: {device.device_id.slice(0, 16)}...
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDevice(device.device_id);
                            }}
                            className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete device"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">
                      <Button onClick={handlenavigatetoregisterdevice} 
                      variant="outline"
                      className="border-2 border-black text-black px-6 font-semibold rounded-full h-10"
                      >Register more devices</Button>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-black font-cairo">
                    {bottomViewMode === 'readings' ? 'Latest Sensor Readings' : 'My Derivatives'}
                  </h2>
                  <div className="flex items-center gap-1 p-0.5 rounded-full bg-gray-100">
                    <button
                      onClick={() => setBottomViewMode('readings')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        bottomViewMode === 'readings' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                      disabled={!selectedDeviceId}
                    >
                      Readings
                    </button>
                    <button
                      onClick={() => setBottomViewMode('derivatives')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        bottomViewMode === 'derivatives' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Derivatives
                    </button>
                  </div>
                </div>
              </div>

              {bottomViewMode === 'readings' ? (
                <>
                  {isLoadingReadings ? (
                    <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p className="mt-4 text-gray-500">Loading readings...</p></div>
                  ) : readings.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No readings yet</h3>
                      <p className="mt-1 text-sm text-gray-500">{selectedDeviceId ? "This device hasn't recorded any data yet." : "Select a device to see its readings."}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {readings.slice(0, 5).map((reading) => (
                        <button key={reading.reading_id} onClick={() => handleViewReadingDetails(reading.reading_id)} className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(reading.status)}`}></div><span className="text-sm font-semibold text-gray-900">{reading.status}</span></div>
                            <span className="text-xs text-gray-500">{formatTimestamp(reading.meta?.last_ingestion || reading.timestamp)}</span>
                          </div>
                          {reading.sensor_data && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {Object.entries(reading.sensor_data).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="text-xs"><span className="text-gray-500">{key}:</span><span className="font-semibold text-gray-900 ml-1">{value}</span></div>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                      {readings.length > 5 && <p className="text-center text-xs text-gray-500 pt-2">Showing 5 of {readings.length} readings</p>}
                    </div>
                  )}
                </>
              ) : (
                <DerivativesView />
              )}
            </div>
          </div>

          {/* ===== RIGHT COLUMN: Live History ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold text-black mb-4 font-cairo">Live History</h3>

              {/* Status Filter Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {(["All", "Pending", "Verified", "Derived", "Failed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilterChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      statusFilter === status
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Readings List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {isLoadingReadings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : readings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No readings yet</p>
                    <p className="text-xs text-gray-400 mt-1">Ingest data to see history</p>
                  </div>
                ) : (
                  readings.map((reading) => (
                    <button
                      key={reading.reading_id}
                      onClick={() => handleViewReadingDetails(reading.reading_id)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          {reading.reading_id.slice(0, 12)}...
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusBadgeColor(
                            reading.status
                          )}`}
                        >
                          {reading.status === "DERIVED_INDIVIDUAL" || reading.status === "COMPLETE" ? "DERIVED" : reading.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatTimestamp(reading.meta?.last_ingestion || reading.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.keys(reading.sensor_data).length} sensors
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== READING DETAIL MODAL ===== */}
      {readingModal.show && readingModal.reading && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setReadingModal({ show: false, reading: null })}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-black font-cairo">Reading Details</h3>
              <button
                onClick={() => setReadingModal({ show: false, reading: null })}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Reading ID */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Reading ID</label>
                <p className="text-sm font-mono text-gray-900">{readingModal.reading.reading_id}</p>
              </div>

              {/* Device ID */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Device ID</label>
                <p className="text-sm font-mono text-gray-900">{readingModal.reading.device_id}</p>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <p>
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full text-white ${getStatusBadgeColor(
                      readingModal.reading.status
                    )}`}
                  >
                    {readingModal.reading.status}
                  </span>
                </p>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Last Ingestion</label>
                <p className="text-sm text-gray-900">{formatTimestamp(readingModal.reading.meta?.last_ingestion || readingModal.reading.timestamp)}</p>
              </div>

              {/* Created At */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Created At</label>
                <p className="text-sm text-gray-900">
                  {new Date(readingModal.reading.created_at).toLocaleString()}
                </p>
              </div>

              {/* Verification Details - Only show if verified */}
              {(readingModal.reading.status === "VERIFIED" || readingModal.reading.status === "Verified") && readingModal.reading.processing && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <label className="text-sm font-semibold text-green-800 uppercase tracking-wide">Verification Details</label>
                  </div>
                  
                  {/* Verified At */}
                  {readingModal.reading.processing.verified_at && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-green-700 font-medium">Verified At:</span>
                      <span className="text-xs text-green-900 font-mono">
                        {new Date(readingModal.reading.processing.verified_at).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* IPFS URI */}
                  {readingModal.reading.processing.ipfs_uri && (
                    <div>
                      <span className="text-xs text-green-700 font-medium block mb-1">IPFS URI:</span>
                      <a 
                        href={`https://ipfs.io/ipfs/${readingModal.reading.processing.ipfs_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-blue-600 hover:text-blue-800 break-all bg-white px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors inline-block w-full"
                      >
                        {readingModal.reading.processing.ipfs_uri}
                      </a>
                    </div>
                  )}

                  {/* Content Hash */}
                  {readingModal.reading.processing.content_hash && (
                    <div>
                      <span className="text-xs text-green-700 font-medium block mb-1">Content Hash:</span>
                      <code className="text-xs font-mono text-gray-700 break.all bg-white px-2 py-1 rounded border border-gray-200 block">
                        {readingModal.reading.processing.content_hash}
                      </code>
                    </div>
                  )}

                  {/* Merkle Root */}
                  {readingModal.reading.processing.merkle_root && (
                    <div>
                      <span className="text-xs text-green-700 font-medium block mb-1">Merkle Root:</span>
                      <code className="text-xs font-mono text-gray-700 break-all bg-white px-2 py-1 rounded border border-gray-200 block">
                        {readingModal.reading.processing.merkle_root}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Sensor Data */}
              <div>
                <label className="text-xs text-gray-500 uppercase mb-2 block">Sensor Data</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(readingModal.reading.sensor_data).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase">{key}</div>
                      <div className="text-lg font-bold text-black font-cairo">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setReadingModal({ show: false, reading: null })}
              className="w-full mt-6 bg-black text-white hover:bg-gray-800 rounded-xl"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ===== TOAST NOTIFICATIONS ===== */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

function DerivativeCard({ derivative, onClick }: { derivative: RefinedReport, onClick: () => void }) {
  const titleMatch = derivative.content.match(/# 📜 (.*)/);
  const title = titleMatch ? titleMatch[1] : 'Untitled Derivative';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${derivative.is_minted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(derivative.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-xs"><span className="text-gray-500">Type:</span><span className="font-semibold text-gray-900 ml-1">{derivative.type}</span></div>
        <div className="text-xs"><span className="text-gray-500">IP ID:</span><span className="font-mono text-gray-900 ml-1">{derivative.ip_id ? `${derivative.ip_id.slice(0, 6)}...` : 'N/A'}</span></div>
      </div>
    </button>
  );
}

