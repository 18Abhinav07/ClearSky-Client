/**
 * Marketplace - Main Page
 *
 * Discovery and purchasing of air quality insights
 * Theme: Clean white background with sky-blue accents (matching landing page)
 * Three tiers:
 * 1. Raw sensor data (free CSV downloads)
 * 2. Refined AI reports (IP Assets with licenses)
 * 3. Community derivatives (creative remixes)
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { type SearchRequest } from "../../services/api/marketplace.service";
import { RefinedReportsGrid } from "./RefinedReportsGrid";
import { DerivativesGallery } from "./DerivativesGallery";
import Cloud from "../../components/ui/Cloud";
import { AuthModal } from "../../components/Auth/AuthModal";
import { ROUTES } from "@/config/routes";
import { useNavigate } from "react-router-dom";
import { getCities, type City } from "../../services/api/config.service";

interface MarketplaceProps {
  // Props can be added here if needed in the future
}

export default function Marketplace({}: MarketplaceProps) {
  const { isAuthenticated, address, isConnected, login } = useAuth();
  const [searchParams, setSearchParams] = useState<{
    city?: string;
    sensorType?: string;
    dateFrom?: string;
    dateTo?: string;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async () => {
    console.log("[Marketplace] CDP authentication successful");

    try {
      // Simple login - just authenticate, no device registration needed
      await login();
      console.log("[Marketplace] ✅ User authenticated successfully");

      // Close modal after successful login
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error("[Marketplace] Failed to login:", error);
      // Keep modal open on error
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Decorative Clouds */}
     

      {/* Fixed Navbar matching landing page */}
      <nav className="fixed top-6 left-0 right-0 z-50 px-6">
        <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl border border-gray-200/50 shadow-lg px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                 <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center">
              <img src="/ClearSky.png" alt="Logo" className="w-10 h-10" />
            </div>
              </div>
              <span className="text-xl font-bold text-black">ClearSky</span>
            </div>

            {/* Home Link (CENTER) */}
           

            {/* RIGHT: Connect OR Profile (Single Conditional) */}
            <div className="flex items-center gap-3">
               <div className="flex-1 flex items-center justify-center rounded-full bg-black text-white px-4 py-2 hover:bg-slate-800 transition-colors">
             <button onClick={() => navigate(ROUTES.LANDING)}>Home</button>
            </div>
              {!isAuthenticated || !address ? (
                // Show Connect button when not authenticated
                <Button
                  variant="outline"
                  className="border-2 border-black text-black px-6 font-semibold rounded-full h-11"
                  onClick={handleGetStarted}
                >
                  Connect
                </Button>
              ) : (
                // Show Profile info when authenticated
                <>
                  <div className="hidden sm:block px-4 py-2 bg-sky-50 border border-sky-200 rounded-full">
                    <p className="text-xs font-medium text-sky-700 font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                  <Button
                    className="bg-black text-white hover:bg-slate-800 px-6 font-semibold rounded-full h-11 shadow-sm"
                    onClick={() => navigate(ROUTES.USER_PROFILE)}
                  >
                    My Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative pt-32 pb-12 overflow-hidden">
        <div className="container-main mx-auto relative z-10">
          <div className="text-center space-y-6 animate-fade-in-up max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-sm font-medium">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Live Network • Blockchain-Verified Data
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight text-slate-900">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Verified</span> Air Quality Insights
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 max-w-2xl font-normal leading-relaxed mx-auto">
             Instantly access LLM-ready AQI Datastreams and explore community-built derivatives. All data cryptographically signed by our DePIN network.
            </p>

          </div>
        </div>
      </div>

      {/* Search Section */}
      <section className="py-8 bg-slate-50/50">
        <div className="container-main mx-auto">
          <SearchBar onSearch={setSearchParams} />
        </div>
      </section>

      {/* Results */}
      {searchParams ? (
        <div className="container-main mx-auto py-16 space-y-20 relative z-10">
          {/* Tier 1: Raw Data */}
          <section className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
              
              
            </div>
          </section>

          {/* Tier 2: Refined Reports (IP Assets) */}
          <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-900 font-cairo">
                    AI-Generated Insights
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 01-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-700">Blockchain IP</span>
                  </div>
                </div>
                <p className="text-slate-600 text-base">
                  Professional analysis registered as IP Assets on Story Protocol
                </p>
              </div>
            </div>
            <RefinedReportsGrid searchParams={searchParams} />
          </section>

          {/* Tier 3: Community Derivatives */}
          <section className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-slate-900 font-cairo">
                  Creator Art & Remixes
                </h2>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-sm font-semibold">
                  Community
                </span>
              </div>
              <p className="text-slate-600 text-base">
                Derivative works linked to original data sources via blockchain
              </p>
            </div>
            <DerivativesGallery />
          </section>
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Add fade-in animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (Temporary placeholders - will be separate files)
// ============================================================================

function SearchBar({ onSearch }: { onSearch: (params: { city?: string; sensorType?: string; dateFrom?: string; dateTo?: string }) => void }) {
  const { isAuthenticated } = useAuth();
  const [sensorType, setSensorType] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const handleSearch = () => {
    if (!isAuthenticated) {
      return;
    }

    const params: { city?: string; sensorType?: string; dateFrom?: string; dateTo?: string } = {};

    if (city.trim()) params.city = city.trim();
    if (sensorType && sensorType !== "ALL") params.sensorType = sensorType;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    onSearch(params);
  };

  // Pre-trigger search on initial load when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-gray-200/80 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Sensor Type Select */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Sensor Type
          </label>
          <select
            value={sensorType}
            onChange={(e) => setSensorType(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
          >
            <option value="">All Sensors</option>
            <option value="PM2.5">🌫️ PM2.5</option>
            <option value="PM10">💨 PM10</option>
            <option value="CO2">🏭 CO2</option>
            <option value="NO2">🚗 NO2</option>
            <option value="O3">☀️ O3</option>
            <option value="SO2">🏭 SO2</option>
          </select>
        </div>

        {/* City Dropdown */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loadingCities}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Cities</option>
            {loadingCities ? (
              <option disabled>Loading cities...</option>
            ) : (
              cities.map((cityData) => (
                <option key={cityData.city_id} value={cityData.city_id}>
                  {cityData.city_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Date From */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
          />
        </div>

        {/* Date To */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
          />
        </div>

        {/* Search Button */}
        <div className="w-full flex items-end">
          <Button
            onClick={handleSearch}
            disabled={!isAuthenticated}
            className="w-full px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all h-[52px] flex items-center justify-center shadow-md"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isAuthenticated ? "Search" : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RawDataList({ searchParams }: { searchParams: { type: string } }) {
  // This component is now disconnected from the primary search, as backend doesn't support raw data search via this endpoint.
  // This can be a static display or be driven by a different API call in the future.
  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
        <h3 className="font-semibold text-slate-600">Raw Data Downloads</h3>
        <p className="text-sm text-slate-500 mt-1">Direct access to raw sensor data is under development.</p>
    </div>
  );
}


function EmptyState() {
  return (
    <div className="container mx-auto px-6 py-24 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Start Your Search
        </h2>
        <p className="text-slate-400">
          Enter your search criteria above to discover air quality insights, reports, and creative derivatives
        </p>
      </div>
    </div>
  );
}
