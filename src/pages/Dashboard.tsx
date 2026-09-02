import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowDropDown, MdOutlineFileDownload, MdSensors, MdOutlineSensorsOff } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import { FaPlus, FaTrash, FaExclamationTriangle, FaCheckCircle, FaLaptop, FaGlobeAmericas } from "react-icons/fa";
import { LineChart } from "@mui/x-charts/LineChart";
import { socket } from "../api/socket";
import AddLocationModal from "../components/AddLocationModal";
import SensorStatusDrawer from "../components/SensorStatusDrawer";
import { useLocations } from "../hooks/useLocation";

// ==========================================
// 1. HELPERS & SENSOR CONFIG
// ==========================================

export const SENSORS = [
  { key: "pm25", label: "PM2.5", fullName: "Fine Particulate Matter", unit: "µg/m³", color: "#6366f1" },
  { key: "co", label: "CO", fullName: "Carbon Monoxide", unit: "ppm", color: "#f59e0b" },
  { key: "o3", label: "O3", fullName: "Ozone", unit: "ppm", color: "#10b981" },
  { key: "so2", label: "SO2", fullName: "Sulfur Dioxide", unit: "ppb", color: "#ef4444" },
  { key: "no2", label: "NO2", fullName: "Nitrogen Dioxide", unit: "ppb", color: "#8b5cf6" },
] as const;

export type SensorKey = (typeof SENSORS)[number]["key"];

// When disconnected, Modbus/scripts send 0, and serial/USB gives null/nothing
export function isSensorValueConnected(sensorKey: string, val: any, explicitStatus?: boolean): boolean {
  if (explicitStatus !== undefined) return Boolean(explicitStatus);
  if (val === null || val === undefined || isNaN(val)) return false;
  return Number(val) > 0;
}

// ==========================================
// 2. CUSTOM HOOKS
// ==========================================

function useDashboardSocket() {
  const [overviewData, setOverviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("getDashboardData", (response: any) => {
      if (response && !response.error) {
        setOverviewData(response);
      }
      setIsLoading(false);
    });

    socket.on("dashboardUpdated", (updatedData) => {
      setOverviewData(updatedData);
    });

    return () => {
      socket.off("dashboardUpdated");
    };
  }, []);

  return { overviewData, isLoading };
}

function useLocationSocket(locationId: number) {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [latestAQI, setLatestAQI] = useState<number | null>(null);
  const [liveSensorHealth, setLiveSensorHealth] = useState<Record<string, { connected: boolean; value: number | null; source?: string }> | null>(null);
  const [liveDisconnectedSensors, setLiveDisconnectedSensors] = useState<string[] | null>(null);
  const [liveFallbackSensors, setLiveFallbackSensors] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    setIsLoading(true);

    // Subscribe to this specific location's room for the graph
    socket.emit("subscribeToLocation", locationId, (response: any) => {
      if (response?.historicalData) {
        setHistoricalData(response.historicalData);
      }
      setIsLoading(false);
    });

    // Listen for live updates and push them into the chart
    socket.on("locationUpdate", (data: { reading: any; latestAQI: number; sensorHealth?: any; disconnectedSensors?: string[]; fallbackSensors?: string[]; hasFallback?: boolean }) => {
      setLatestAQI(data.latestAQI);
      if (data.sensorHealth) setLiveSensorHealth(data.sensorHealth);
      if (data.disconnectedSensors) setLiveDisconnectedSensors(data.disconnectedSensors);
      if (data.fallbackSensors) setLiveFallbackSensors(data.fallbackSensors);
      setHistoricalData((prev) => [...prev, data.reading]);
    });

    return () => {
      socket.off("locationUpdate");
    };
  }, [locationId]);

  return {
    historicalData,
    latestAQI,
    liveSensorHealth,
    liveDisconnectedSensors,
    liveFallbackSensors,
    isLoading,
  };
}

// ==========================================
// 3. EXPANDED DETAILS COMPONENT
// ==========================================

function ExpandedLocationDetails({
  locationId,
  locationName,
  locationSensorHealth,
  locationDisconnectedSensors,
  locationFallbackSensors,
  onOpenDiagnostics,
}: {
  locationId: number;
  locationName: string;
  locationSensorHealth?: Record<string, { connected: boolean; value: number | null; source?: string }>;
  locationDisconnectedSensors?: string[];
  locationFallbackSensors?: string[];
  onOpenDiagnostics: () => void;
}) {
  const { historicalData, liveSensorHealth, liveDisconnectedSensors, liveFallbackSensors, isLoading } = useLocationSocket(locationId);

  // State to track which of the 5 sensors the user is currently viewing
  const [activeSensor, setActiveSensor] = useState<SensorKey>("pm25");

  // Merge latest socket health with initial overview health
  const effectiveSensorHealth = liveSensorHealth || locationSensorHealth || {};
  const effectiveDisconnected = liveDisconnectedSensors || locationDisconnectedSensors || [];
  const effectiveFallback = liveFallbackSensors || locationFallbackSensors || [];

  // Find the config object for the currently selected sensor
  const currentSensorConfig = SENSORS.find((s) => s.key === activeSensor)!;

  // Filter only readings with valid numeric data for the chart
  const validData = useMemo(() => {
    return historicalData.filter((d) => {
      const v = d[activeSensor];
      return v !== null && v !== undefined && !isNaN(v);
    });
  }, [historicalData, activeSensor]);

  // Determine current active sensor connection status
  const currentReading = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
  const currentRawVal = currentReading?.[activeSensor];

  const isCurrentSensorFallback =
    effectiveSensorHealth[activeSensor]?.source === "OPEN_METEO_FALLBACK" ||
    effectiveFallback.includes(activeSensor);

  const isCurrentSensorOnline =
    isCurrentSensorFallback ||
    (effectiveSensorHealth[activeSensor]?.connected ?? isSensorValueConnected(activeSensor, currentRawVal));

  // X-Axis and Y-Axis for Chart
  const xData =
    validData.length > 0
      ? validData.map((d) =>
          new Date(d.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        )
      : ["--:--"];

  const yData =
    validData.length > 0 ? validData.map((d) => d[activeSensor]) : [0];

  // Find last valid reading for when currently disconnected
  const lastValidReading = validData.length > 0 ? validData[validData.length - 1] : null;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse font-medium">
        Loading sensor data...
      </div>
    );
  }

  return (
    <div className="w-full mt-4 flex flex-col pt-2 font-sans">
      <hr className="w-full h-px bg-gray-200 border-none mb-6" />

      {/* --- Sensor Selection Tabs with Live Connection Status --- */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6 py-1 px-1">
        {SENSORS.map((sensor) => {
          const isFallback =
            effectiveSensorHealth[sensor.key]?.source === "OPEN_METEO_FALLBACK" ||
            effectiveFallback.includes(sensor.key);

          const isOnline =
            isFallback ||
            (effectiveSensorHealth[sensor.key]?.connected ?? !effectiveDisconnected.includes(sensor.key));

          const isSelected = activeSensor === sensor.key;

          return (
            <button
              key={sensor.key}
              onClick={() => setActiveSensor(sensor.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-white shadow-md text-gray-900"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
              }`}
              style={{
                borderColor: isSelected ? sensor.color : undefined,
                color: isSelected ? sensor.color : undefined,
                boxShadow: isSelected ? `0 4px 12px ${sensor.color}25` : undefined,
              }}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isFallback
                    ? "bg-purple-500 ring-2 ring-purple-300"
                    : isOnline
                    ? "bg-green-500"
                    : "bg-red-500 animate-pulse ring-2 ring-red-300"
                }`}
              />
              <span>{sensor.label}</span>
              {isFallback ? (
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <FaGlobeAmericas className="text-[9px]" /> Fallback
                </span>
              ) : !isOnline ? (
                <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                  Offline
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          onClick={onOpenDiagnostics}
          className="ml-auto text-xs font-bold text-[#1F8F22] hover:text-[#176e19] bg-green-50 hover:bg-green-100 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-green-200 cursor-pointer"
        >
          <MdSensors className="text-base" /> Hardware Diagnostics
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 w-full">
        <div className="flex-1 flex flex-col gap-6">
          {/* Dynamic Highlight Card */}
          <div
            className={`w-full sm:w-64 border rounded-xl p-4 shadow-sm bg-white flex flex-col relative transition-all duration-300 ${
              isCurrentSensorFallback
                ? "border-purple-300 bg-purple-50/20"
                : isCurrentSensorOnline
                ? "border-gray-200"
                : "border-red-300 bg-red-50/20"
            }`}
          >
            <MdOutlineFileDownload className="absolute top-4 right-4 text-gray-400 text-xl cursor-pointer hover:text-[#1F8F22]" />

            <span className="text-xs font-semibold text-gray-400 mb-1">
              {currentSensorConfig.label} ({currentSensorConfig.unit})
            </span>

            {/* Value Display */}
            {isCurrentSensorOnline ? (
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-[#1e293b]">
                  {currentRawVal !== undefined && currentRawVal !== null
                    ? Number(currentRawVal).toFixed(4)
                    : "--"}
                </span>
                {isCurrentSensorFallback && (
                  <span className="text-[11px] font-semibold text-purple-700 mt-1 flex items-center gap-1">
                    <FaGlobeAmericas className="text-[10px]" /> Open-Meteo Satellite Data
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-2xl font-black text-red-600 flex items-center gap-1.5">
                  <MdOutlineSensorsOff className="text-xl" /> Disconnected
                </span>
                <span className="text-[11px] text-gray-500 mt-1">
                  {activeSensor === "pm25"
                    ? "No packet received from probe"
                    : "Zero value / No input detected"}
                </span>
              </div>
            )}

            {/* Status and Last Active Meta */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              {isCurrentSensorFallback ? (
                <span className="text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <FaGlobeAmericas className="text-xs text-purple-600" /> API Fallback
                </span>
              ) : isCurrentSensorOnline ? (
                <span className="text-xs font-bold text-[#1F8F22] bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Hardware Live
                </span>
              ) : (
                <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <FaExclamationTriangle className="text-[10px]" /> Offline
                </span>
              )}

              {isCurrentSensorFallback ? (
                <span className="text-[10px] text-purple-600 font-medium">
                  Probe Offline
                </span>
              ) : lastValidReading && !isCurrentSensorOnline ? (
                <span className="text-[10px] text-gray-500 font-medium">
                  Last active: {new Date(lastValidReading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </div>
          </div>

          {/* Dynamic Chart with Disconnected Notice */}
          <div className="w-full border border-[#e2e8f0] rounded-xl p-4 sm:p-6 shadow-sm bg-white min-h-75 sm:min-h-87.5 transition-all duration-300 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
              <h3 className="font-bold text-sm text-gray-700">
                {currentSensorConfig.label} History ({currentSensorConfig.fullName})
              </h3>

              {!isCurrentSensorOnline && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                  <FaExclamationTriangle className="text-xs" /> Sensor disconnected — displaying recorded history
                </span>
              )}
            </div>

            <div className="h-62.5 sm:h-75 w-full">
              {validData.length > 0 ? (
                <LineChart
                  xAxis={[
                    {
                      data: xData,
                      scaleType: "point",
                    },
                  ]}
                  series={[
                    {
                      data: yData,
                      color: isCurrentSensorOnline ? currentSensorConfig.color : "#94a3b8",
                      area: true,
                      showMark: true,
                      valueFormatter: (value) =>
                        value !== null
                          ? `${value} ${currentSensorConfig.unit}`
                          : "--",
                    },
                  ]}
                  margin={{ top: 10, bottom: 30, left: 50, right: 20 }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <MdOutlineSensorsOff className="text-3xl text-gray-300" />
                  <span>No valid readings recorded yet for {currentSensorConfig.label}.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Panel */}
        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 gap-4 sm:gap-6">
          <span className="text-sm font-semibold text-gray-700 text-center">
            Hardware & Sensor Controls
          </span>

          <button
            onClick={onOpenDiagnostics}
            className="w-full sm:w-auto bg-[#1F8F22] hover:bg-[#1a7a1d] text-white px-6 py-3 rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg active:scale-95 duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MdSensors className="text-lg" /> View Sensor Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================

function Home() {
  const { overviewData, isLoading } = useDashboardSocket();
  const { deleteLocation } = useLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [diagnosticsLocation, setDiagnosticsLocation] = useState<any | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expandedLocationId");
      if (saved !== null) {
        return saved === "null" ? null : parseInt(saved, 10);
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem(
      "expandedLocationId",
      expandedId === null ? "null" : expandedId.toString(),
    );
  }, [expandedId]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col min-h-screen font-sans">
      {/* --- Action Row --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
            Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time environmental monitoring and hardware sensor health
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#1F8F22] cursor-pointer hover:bg-[#1a7a1d] text-white px-4 py-2 rounded-md font-medium text-sm transition flex items-center gap-2 shadow-sm active:scale-95 duration-150 w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add Location
        </button>
      </div>

      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Hardware Diagnostics Drawer */}
      <SensorStatusDrawer
        isOpen={!!diagnosticsLocation}
        onClose={() => setDiagnosticsLocation(null)}
        locationName={diagnosticsLocation?.name || ""}
        locationId={diagnosticsLocation?.id || 0}
        gateway={diagnosticsLocation?.gateway}
        sensorHealth={diagnosticsLocation?.sensorHealth}
        disconnectedSensors={diagnosticsLocation?.disconnectedSensors}
        fallbackSensors={diagnosticsLocation?.fallbackSensors}
        hasFallback={diagnosticsLocation?.hasFallback}
        lastUpdated={diagnosticsLocation?.lastUpdated}
      />

      {/* --- Location Cards List --- */}
      <div className="flex flex-col gap-5 p-1">
        {isLoading ? (
          <div className="text-center text-gray-500 py-12 font-medium">
            Loading locations...
          </div>
        ) : overviewData.length === 0 ? (
          <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-xl">
            No locations found.
          </div>
        ) : (
          overviewData.map((location) => {
            const isExpanded = expandedId === location.id;
            const isOnline = location.status === "ACTIVE";
            const isGatewaySocket = Boolean(location.gateway?.isSocketConnected);
            const isGatewayActive = Boolean(location.gateway?.isOnline ?? isOnline);
            const disconnectedList = location.disconnectedSensors || [];
            const fallbackList = location.fallbackSensors || [];
            const hasDisconnectedSensors = disconnectedList.length > 0;
            const hasFallbackSensors = fallbackList.length > 0;
            const allSensorsConnected = location.allSensorsConnected ?? (!hasDisconnectedSensors && !hasFallbackSensors);

            return (
              <div
                key={location.id}
                className={`flex flex-col w-full rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
                  isExpanded
                    ? "bg-white border-2 border-[#1F8F22]/50 shadow-xl ring-1 ring-[#1F8F22]/20"
                    : "bg-[linear-gradient(270deg,rgba(146,146,146,0.7)_0%,rgba(31,143,34,0.7)_64%,rgba(9,70,10,0.7)_100%)] backdrop-blur-sm border-2 border-white/90 shadow-lg shadow-[#1F8F22]/40 hover:shadow-[#1F8F22]/60"
                }`}
              >
                <div
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full cursor-pointer gap-4 lg:gap-0"
                  onClick={() => toggleExpand(location.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"
                        }`}
                      />
                      <span
                        className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${
                          isExpanded ? "text-gray-500" : "text-white"
                        }`}
                      >
                        {location.status}
                      </span>
                    </div>

                    <h2
                      className={`text-base sm:text-lg font-bold tracking-wide transition-colors duration-300 ${
                        isExpanded ? "text-gray-900" : "text-white"
                      }`}
                    >
                      {location.name}
                    </h2>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 sm:gap-4 w-full lg:w-auto">
                    {/* Gateway Laptop Status Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors duration-300 ${
                        isExpanded
                          ? isGatewaySocket
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                          : isGatewaySocket
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-red-500/80 text-white border border-white/40 animate-pulse"
                      }`}
                      title={`Gateway Device ID: ${location.gateway?.id || "eps_32"}`}
                    >
                      <FaLaptop className="text-xs" />
                      <span>
                        Laptop: {isGatewaySocket ? "Online" : "Offline"}
                      </span>
                    </div>

                    {/* Sensor Connectivity Summary Badge */}
                    {hasFallbackSensors ? (
                      <div
                        className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors duration-300 ${
                          isExpanded
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : "bg-purple-700/80 text-white border border-white/40"
                        }`}
                        title={`Hardware Online: ${5 - fallbackList.length - disconnectedList.length}, Satellite Fallback: ${fallbackList.length}`}
                      >
                        <FaGlobeAmericas className="text-xs" />
                        <span>
                          {5 - fallbackList.length - disconnectedList.length}/5 Online · {fallbackList.length} Fallback
                        </span>
                      </div>
                    ) : allSensorsConnected ? (
                      <div
                        className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors duration-300 ${
                          isExpanded
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-white/20 text-white border border-white/30"
                        }`}
                        title="All 5 hardware sensors are transmitting active data"
                      >
                        <FaCheckCircle className="text-xs text-green-400" />
                        <span>5/5 Sensors Online</span>
                      </div>
                    ) : (
                      <div
                        className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors duration-300 ${
                          isExpanded
                            ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                            : "bg-red-500/80 text-white border border-white/40 animate-pulse"
                        }`}
                        title={`Disconnected sensors: ${disconnectedList.join(", ")}`}
                      >
                        <FaExclamationTriangle className="text-xs" />
                        <span>
                          {disconnectedList.length} Disconnected ({disconnectedList.map((s: string) => s.toUpperCase()).join(", ")})
                        </span>
                      </div>
                    )}

                    {/* AQI Pill */}
                    <div
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-colors duration-300 ${
                        isExpanded
                          ? "bg-[#1F8F22] text-white"
                          : "bg-transparent border border-white text-white"
                      }`}
                    >
                      {location.latestAQI} AQI
                    </div>

                    {/* Last Updated */}
                    <div
                      className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-md font-medium border transition-colors duration-300 ${
                        isExpanded
                          ? "bg-white border-gray-300 text-gray-700"
                          : "bg-white border-transparent text-gray-600"
                      }`}
                    >
                      {isExpanded
                        ? "Live Updates"
                        : location.lastUpdated
                        ? `Last updated: ${new Date(location.lastUpdated).toLocaleTimeString()}`
                        : "No readings"}
                      {isExpanded && <MdArrowDropDown className="inline ml-1" />}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              "Are you sure you want to delete this location?",
                            )
                          ) {
                            deleteLocation(location.id).then(() =>
                              window.location.reload(),
                            );
                          }
                        }}
                        title="Delete Location"
                        className={`p-2 rounded transition-colors duration-300 cursor-pointer ${
                          isExpanded
                            ? "text-red-500 hover:bg-red-50"
                            : "text-white hover:text-red-400 hover:bg-black/10"
                        }`}
                      >
                        <FaTrash className="text-sm" />
                      </button>

                      <button
                        className={`p-1 rounded transition-colors duration-300 cursor-pointer ${
                          isExpanded ? "text-gray-500 hover:bg-gray-100" : "text-white hover:bg-black/10"
                        }`}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center"
                        >
                          <IoIosArrowForward className="text-xl" />
                        </motion.div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content Area with Socket Connection */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden p-1"
                    >
                      <ExpandedLocationDetails
                        locationId={location.id}
                        locationName={location.name}
                        locationSensorHealth={location.sensorHealth}
                        locationDisconnectedSensors={location.disconnectedSensors}
                        locationFallbackSensors={location.fallbackSensors}
                        onOpenDiagnostics={() => setDiagnosticsLocation(location)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Home;
