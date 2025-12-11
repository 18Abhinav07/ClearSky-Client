/**
 * Device Registration Form
 *
 * Simplified multi-step form with modal-based selection:
 * 1. Select City (via button that opens modal)
 * 2. Select Station (via button that opens modal)
 * 3. Select Sensors (via button that opens modal)
 * 4. Confirm & Register
 * 
 * Steps 2 and 3 are shown as modals, only Step 1 and Step 4 are displayed as main steps
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCities, getStations, getSensors, type City, type Station, type Sensor } from "../../services/api/config.service";
import { registerDevice } from "../../services/api/device.service";
import { useDeviceStore } from "../../app/store/deviceStore";
import { getUserDevices } from "../../services/api/device.service";
import { ROUTES } from "../../config/routes";

type Step = 1 | 4;

interface DeviceRegistrationFormProps {
  onBack?: () => void;
}

export function DeviceRegistrationForm({ onBack }: DeviceRegistrationFormProps) {
  const navigate = useNavigate();
  const { setDevices } = useDeviceStore();

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<string[]>([]);

  // Modal state
  const [showCityModal, setShowCityModal] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);

  // Data fetching state
  const [cities, setCities] = useState<City[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch cities on mount
  useEffect(() => {
    async function fetchCities() {
      try {
        setIsLoading(true);
        setError(null);
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cities");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCities();
  }, []);

  const handleCitySelect = async (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedStationId("");
    setSelectedSensorTypes([]);
    setShowCityModal(false);
    
    // Fetch stations for selected city
    try {
      setIsLoading(true);
      const stationsData = await getStations(cityId);
      setStations(stationsData);
      // Auto-open station modal
      setShowStationModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStationSelect = async (stationId: string) => {
    setSelectedStationId(stationId);
    setSelectedSensorTypes([]);
    setShowStationModal(false);
    
    // Fetch sensors for selected station
    try {
      setIsLoading(true);
      const sensorsData = await getSensors(stationId);
      setSensors(sensorsData);
      // Auto-open sensor modal
      setShowSensorModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sensors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSensorToggle = (sensorType: string) => {
    setSelectedSensorTypes((prev) =>
      prev.includes(sensorType)
        ? prev.filter((s) => s !== sensorType)
        : [...prev, sensorType]
    );
  };

  const handleSensorConfirm = () => {
    if (selectedSensorTypes.length === 0) {
      setError("Please select at least one sensor");
      return;
    }
    setShowSensorModal(false);
    setCurrentStep(4);
  };

  const handleRegister = async () => {
    if (selectedSensorTypes.length === 0) {
      setError("Please select at least one sensor");
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      console.log("[DeviceRegistration] Registering device...");
      console.log("  City:", selectedCityId);
      console.log("  Station:", selectedStationId);
      console.log("  Sensors:", selectedSensorTypes);

      await registerDevice({
        city_id: selectedCityId,
        station_id: selectedStationId,
        sensor_types: selectedSensorTypes,
      });

      console.log("[DeviceRegistration] ✅ Device registered successfully!");

      // Refresh device list to update Smart Landing state
      console.log("[DeviceRegistration] Refreshing device list...");
      const devicesData = await getUserDevices();
      setDevices(devicesData);

      // Navigate to dashboard
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register device";
      setError(errorMessage);
      console.error("[DeviceRegistration] Registration failed:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const getSelectedCity = () => cities.find((c) => c.city_id === selectedCityId);
  const getSelectedStation = () => stations.find((s) => s.station_id === selectedStationId);

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Register New Device</h1>
        <p className="text-muted-foreground">
          Follow the steps below to register your air quality monitoring device
        </p>
      </div>

      {/* Progress Indicator - Only 2 steps shown */}
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Selection Interface */}
      {currentStep === 1 && (
        <div className="mb-6 space-y-4">
          {/* City Selection */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">1. Select City</h3>
              <button
                onClick={() => setShowCityModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                {selectedCityId ? "Change City" : "Select City"}
              </button>
            </div>
            {selectedCityId && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="font-medium text-primary">
                  {cities.find(c => c.city_id === selectedCityId)?.city_name}
                </div>
              </div>
            )}
          </div>

          {/* Station Selection */}
          {selectedCityId && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">2. Select Station</h3>
                <button
                  onClick={() => setShowStationModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  {selectedStationId ? "Change Station" : "Select Station"}
                </button>
              </div>
              {selectedStationId && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="font-medium text-primary">
                    {stations.find(s => s.station_id === selectedStationId)?.station_name}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sensor Selection */}
          {selectedStationId && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">3. Select Sensors</h3>
                <button
                  onClick={() => setShowSensorModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  {selectedSensorTypes.length > 0 ? "Change Sensors" : "Select Sensors"}
                </button>
              </div>
              {selectedSensorTypes.length > 0 && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">
                    {selectedSensorTypes.length} sensor(s) selected:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSensorTypes.map((sensor) => (
                      <span key={sensor} className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">
                        {sensor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          {selectedSensorTypes.length > 0 && (
            <button
              onClick={() => setCurrentStep(4)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Continue to Confirmation
            </button>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 4 && (
        <div className="mb-6 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Step 2: Confirm Registration</h3>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">City</div>
              <div className="font-medium">{getSelectedCity()?.city_name}</div>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Station</div>
              <div className="font-medium">{getSelectedStation()?.station_name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                📍 {getSelectedStation()?.coordinates.latitude.toFixed(4)}, {getSelectedStation()?.coordinates.longitude.toFixed(4)}
              </div>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Sensors ({selectedSensorTypes.length})</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSensorTypes.map((sensor) => (
                  <span
                    key={sensor}
                    className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full"
                  >
                    {sensor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              disabled={isRegistering}
              className="flex-1 py-3 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Back to Edit
            </button>
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground mr-2"></div>
                  Registering...
                </>
              ) : (
                "Register Device"
              )}
            </button>
          </div>
        </div>
      )}

      {/* City Selection Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCityModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Select City</h3>
              <button onClick={() => setShowCityModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cities.map((city) => (
                  <button
                    key={city.city_id}
                    onClick={() => handleCitySelect(city.city_id)}
                    className="p-4 text-left border rounded-lg transition-colors border-border hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="font-medium">{city.city_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{city.stations.length} stations available</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Station Selection Modal */}
      {showStationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowStationModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Select Station in {getSelectedCity()?.city_name}</h3>
              <button onClick={() => setShowStationModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {stations.map((station) => (
                  <button
                    key={station.station_id}
                    onClick={() => handleStationSelect(station.station_id)}
                    className="w-full p-4 text-left border rounded-lg transition-colors border-border hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="font-medium">{station.station_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      📍 {station.coordinates.latitude.toFixed(4)}, {station.coordinates.longitude.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{station.available_sensors.length} sensors available</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sensor Selection Modal */}
      {showSensorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSensorModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Select Sensors at {getSelectedStation()?.station_name}</h3>
              <button onClick={() => setShowSensorModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select one or more sensors to monitor. You can choose any subset of available sensors.
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {sensors.map((sensor) => (
                    <label
                      key={sensor.sensor_type}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSensorTypes.includes(sensor.sensor_type)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSensorTypes.includes(sensor.sensor_type)}
                        onChange={() => handleSensorToggle(sensor.sensor_type)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{sensor.sensor_type}</div>
                        <div className="text-xs text-muted-foreground">{sensor.unit}</div>
                        <div className="text-xs text-muted-foreground mt-1">{sensor.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg mb-4">
                  <p className="text-sm">
                    <span className="font-semibold">{selectedSensorTypes.length}</span> sensor(s) selected
                    {selectedSensorTypes.length > 0 && ": "}
                    {selectedSensorTypes.join(", ")}
                  </p>
                </div>
                <button
                  onClick={handleSensorConfirm}
                  disabled={selectedSensorTypes.length === 0}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Confirm Selection
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
