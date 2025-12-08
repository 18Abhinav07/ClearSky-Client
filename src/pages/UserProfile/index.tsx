/**
 * User Profile - Main Page
 *
 * Tabbed interface for managing user assets:
 * - Tab A: My Devices (existing functionality)
 * - Tab B: My Collection (purchased licenses)
 * - Tab C: My Creations (owned IP assets)
 */

import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { MyDevicesTab } from "./MyDevicesTab";
import { MyCollectionTab } from "./MyCollectionTab";
import { MyCreationsTab } from "./MyCreationsTab";
import { TokenWithdraw } from "../../components/UserProfile/TokenWithdraw";

type Tab = "devices" | "collection" | "creations";

export default function UserProfile() {
  const { address, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("devices");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Please Connect Your Wallet
          </h2>
          <p className="text-slate-600">
            You need to authenticate to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-cairo bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-slate-600 mt-1 font-mono text-sm">
                {address?.slice(0, 10)}...{address?.slice(-8)}
              </p>
            </div>

            {/* Token Balances Widget */}
            <TokenWithdraw />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50/30">
        <div className="container mx-auto px-6">
          <nav className="flex gap-8">
            <TabButton
              active={activeTab === "devices"}
              onClick={() => setActiveTab("devices")}
              label="My Devices"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              }
            />
            <TabButton
              active={activeTab === "collection"}
              onClick={() => setActiveTab("collection")}
              label="My Collection"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <TabButton
              active={activeTab === "creations"}
              onClick={() => setActiveTab("creations")}
              label="My Creations"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
            />
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === "devices" && <MyDevicesTab />}
        {activeTab === "collection" && <MyCollectionTab />}
        {activeTab === "creations" && <MyCreationsTab />}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function TabButton({ active, onClick, label, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 py-4 px-2 font-semibold transition-all ${
        active
          ? "text-slate-900"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full" />
      )}
    </button>
  );
}
