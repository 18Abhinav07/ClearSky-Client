/**
 * My Devices Tab
 *
 * Displays user's registered IoT devices
 * This reuses existing Dashboard device logic
 */

import { useEffect, useState } from "react";
import { getUserDevices, type Device } from "../../services/api/device.service";
import { Button } from "../../components/ui/button";

export function MyDevicesTab() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const data = await getUserDevices();
      setDevices(data.devices);
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (devices.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device) => (
        <DeviceCard key={device.device_id} device={device} />
      ))}
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  return (
    <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-blue-500/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-lg">{device.device_id || "Unnamed Device"}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {device.sensor_meta?.city || "Unknown Location"}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          device.status === "active"
            ? "bg-green-500/20 text-green-400"
            : "bg-yellow-500/20 text-yellow-400"
        }`}>
          {device.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Device ID:</span>
          <span className="font-mono text-slate-300">{device.device_id.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Sensor Type:</span>
          <span className="text-slate-300">{device.sensor_meta.sensor_types[0]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Registered:</span>
          <span className="text-slate-300">
            {new Date(device.registered_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-slate-800/30 border border-slate-700 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No Devices Registered</h2>
      <p className="text-slate-400 mb-6">Start by registering your first IoT device</p>
      <Button className="bg-blue-500 hover:bg-blue-600">
        Register Device
      </Button>
    </div>
  );
}
