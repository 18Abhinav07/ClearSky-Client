/**
 * Device Registration Form
 *
 * Multi-step form following E2E script flow:
 * 1. Select City
 * 2. Select Station
 * 3. Select Sensors (multi-select, sensor degradation allowed)
 * 4. Confirm & Register
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCities, getStations, getSensors, type City, type Station, type Sensor } from "../../services/api/config.service";
import { registerDevice } from "../../services/api/device.service";
import { useDeviceStore } from "../../app/store/deviceStore";
import { getUserDevices } from "../../services/api/device.service";
import { ROUTES } from "../../config/routes";

type Step = 1 | 2 | 3 | 4;

export function DeviceRegistrationForm() {
  const navigate = useNavigate();
  const { setDevices } = useDeviceStore();

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<string[]>([]);

  // Data fetching state
  const [cities, setCities] = useState<City[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Step 1: Fetch cities on mount
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

  // Step 2: Fetch stations when city is selected
  useEffect(() => {
    if (!selectedCityId) return;

    async function fetchStations() {
      try {
        setIsLoading(true);
        setError(null);
        const stationsData = await getStations(selectedCityId);
        setStations(stationsData);
        setCurrentStep(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStations();
  }, [selectedCityId]);

  // Step 3: Fetch sensors when station is selected
  useEffect(() => {
    if (!selectedStationId) return;

    async function fetchSensors() {
      try {
        setIsLoading(true);
        setError(null);
        const sensorsData = await getSensors(selectedStationId);
        setSensors(sensorsData);
        setCurrentStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sensors");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSensors();
  }, [selectedStationId]);

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedStationId(""); // Reset station
    setSelectedSensorTypes([]); // Reset sensors
    setStations([]);
    setSensors([]);
  };

  const handleStationSelect = (stationId: string) => {
    setSelectedStationId(stationId);
    setSelectedSensorTypes([]); // Reset sensors
    setSensors([]);
  };

  const handleSensorToggle = (sensorType: string) => {
    setSelectedSensorTypes((prev) =>
      prev.includes(sensorType)
        ? prev.filter((s) => s !== sensorType)
        : [...prev, sensorType]
    );
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

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    step < currentStep ? "bg-primary" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>City</span>
          <span>Station</span>
          <span>Sensors</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Select City */}
      {currentStep === 1 && (
        <div className="mb-6 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Step 1: Select City</h3>
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
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    selectedCityId === city.city_id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{city.city_name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {city.stations.length} stations available
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Station */}
      {currentStep === 2 && stations.length > 0 && (
        <div className="mb-6 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Step 2: Select Station in {getSelectedCity()?.city_name}
          </h3>
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
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    selectedStationId === station.station_id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{station.station_name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    📍 {station.coordinates.latitude.toFixed(4)}, {station.coordinates.longitude.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {station.available_sensors.length} sensors available
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Sensors */}
      {currentStep === 3 && sensors.length > 0 && (
        <div className="mb-6 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            Step 3: Select Sensors at {getSelectedStation()?.station_name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select one or more sensors to monitor. You can choose any subset of available sensors.
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          )}

          {/* Selected Sensors Count */}
          <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">{selectedSensorTypes.length}</span> sensor(s) selected
              {selectedSensorTypes.length > 0 && ": "}
              {selectedSensorTypes.join(", ")}
            </p>
          </div>

          {/* Proceed to Confirmation */}
          {selectedSensorTypes.length > 0 && (
            <button
              onClick={() => setCurrentStep(4)}
              className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Continue to Confirmation
            </button>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 4 && (
        <div className="mb-6 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Step 4: Confirm Registration</h3>

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
              onClick={() => setCurrentStep(3)}
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
    </div>
  );
}
