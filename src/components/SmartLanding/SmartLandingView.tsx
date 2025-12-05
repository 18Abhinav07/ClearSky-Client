/**
 * Smart Landing View Component
 *
 * Conditional rendering based on device count (from Sequence Diagram)
 * - Mode 0: New User (count == 0) → Show "Register First Device" only
 * - Mode 1: Active User (0 < count < 3) → Show "Register" + "Dashboard"
 * - Mode 3: Maxed User (count >= 3) → Show "Dashboard" only
 */

import { useDeviceStore } from "../../app/store/deviceStore";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";

export function SmartLandingView() {
  const { uiMode, count, limitReached, devices, isLoading } = useDeviceStore();
  const navigate = useNavigate();

  const handleRegisterDevice = () => {
    // Navigate to device registration page
    navigate(ROUTES.REGISTER_DEVICE);
  };

  const handleGoToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading your devices...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6">
      {/* MODE 0: New User - No Devices */}
      {uiMode === "MODE_0" && (
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground">Welcome to ClearSky! 🌤️</h1>
            <p className="text-xl text-muted-foreground">
              Let's get started by registering your first device
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-4">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-semibold">No Devices Registered</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Register your first air quality monitoring device to start collecting data
            </p>
            <button
              onClick={handleRegisterDevice}
              className="mt-6 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Register Your First Device
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Real-time Data</div>
              <div>Monitor air quality 24/7</div>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-2xl mb-2">🔔</div>
              <div className="font-medium">Alerts</div>
              <div>Get notified of changes</div>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-medium">Analytics</div>
              <div>Track trends over time</div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 1: Active User - Has Devices (1-2) */}
      {uiMode === "MODE_1" && (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-foreground">Your ClearSky Dashboard</h1>
            <p className="text-xl text-muted-foreground">
              You have {count} device{count !== 1 ? 's' : ''} registered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registered Devices Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Your Devices</h3>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.device_id} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="font-medium text-sm">{device.sensor_meta.station}</div>
                    <div className="text-xs text-muted-foreground">
                      {device.sensor_meta.city} • {device.sensor_meta.sensor_types.length} sensors
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Cards */}
            <div className="space-y-4">
              <button
                onClick={handleGoToDashboard}
                className="w-full p-6 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-left"
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="text-lg font-semibold">Go to Dashboard</h3>
                <p className="text-sm opacity-90">View real-time data and analytics</p>
              </button>

              <button
                onClick={handleRegisterDevice}
                className="w-full p-6 border-2 border-border rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <div className="text-3xl mb-2">➕</div>
                <h3 className="text-lg font-semibold">Register Another Device</h3>
                <p className="text-sm text-muted-foreground">
                  You can register {3 - count} more device{3 - count !== 1 ? 's' : ''}
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Maxed User - Limit Reached (3 devices) */}
      {uiMode === "MODE_3" && (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-foreground">Device Limit Reached</h1>
            <p className="text-xl text-muted-foreground">
              You have {count} devices registered (Maximum allowed)
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
              Registration Disabled
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 max-w-md mx-auto mt-2">
              You've reached the maximum of 3 devices. To register a new device, please delete an existing one first.
            </p>
          </div>

          {/* Show all devices */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Your Registered Devices</h3>
            <div className="space-y-3">
              {devices.map((device, index) => (
                <div key={device.device_id} className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">Device {index + 1}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {device.sensor_meta.station}, {device.sensor_meta.city}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {device.sensor_meta.sensor_types.join(', ')}
                      </div>
                    </div>
                    <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      {device.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Button */}
          <button
            onClick={handleGoToDashboard}
            className="w-full p-6 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-semibold">Go to Dashboard</h3>
            <p className="text-sm opacity-90 mt-1">View data from all your devices</p>
          </button>
        </div>
      )}
    </div>
  );
}
