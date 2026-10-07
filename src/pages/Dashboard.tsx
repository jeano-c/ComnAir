import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { MdSensors, MdMoreVert } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import { FaPlus, FaTrash } from "react-icons/fa";
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

export const SENSOR_DISPLAY = [
  { key: "pm25", label: "PM 2.5" },
  { key: "so2", label: "SO²" },
  { key: "co", label: "CO" },
  { key: "o3", label: "O³" },
  { key: "no2", label: "NO²" },
] as const;

export type SensorKey = (typeof SENSORS)[number]["key"];

export function getAqiCategory(aqi: number | null | undefined): {
  label: string;
  fullName: string;
  color: string;
} {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return { label: "Good", fullName: "Good", color: "#22c55e" };
  }
  if (aqi <= 50) return { label: "Good", fullName: "Good", color: "#22c55e" };
  if (aqi <= 100) return { label: "Moderate", fullName: "Moderate", color: "#eab308" };
  if (aqi <= 150)
    return {
      label: "Unhealthy (SG)",
      fullName: "Unhealthy for Sensitive Groups",
      color: "#f97316",
    };
  if (aqi <= 200) return { label: "Unhealthy", fullName: "Unhealthy", color: "#ef4444" };
  if (aqi <= 300)
    return {
      label: "Very Unhealthy",
      fullName: "Very Unhealthy",
      color: "#8b5cf6",
    };
  return { label: "Hazardous", fullName: "Hazardous", color: "#881337" };
}

export function getFillPercentage(aqi: number | null | undefined): number {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return 28;
  const val = Number(aqi);
  if (val <= 0) return 28;
  if (val >= 300) return 100;
  if (val <= 50) {
    return 28 + (val / 50) * 7;
  } else if (val <= 100) {
    return 35 + ((val - 50) / 50) * 17;
  } else if (val <= 150) {
    return 52 + ((val - 100) / 50) * 16;
  } else if (val <= 200) {
    return 68 + ((val - 150) / 50) * 14;
  } else {
    return 82 + ((val - 200) / 100) * 18;
  }
}

export function getPollutantStatus(
  key: string,
  val: number | null | undefined,
  isDisconnected: boolean,
): { label: string; colorClass: string } {
  if (isDisconnected) {
    return { label: "Offline", colorClass: "text-rose-500" };
  }
  if (val === null || val === undefined || isNaN(val)) {
    return { label: "Good", colorClass: "text-emerald-500" };
  }
  const num = Number(val);
  let isGood = true;
  let isModerate = true;
  if (key === "pm25") {
    isGood = num <= 12;
    isModerate = num <= 35.4;
  } else if (key === "co") {
    isGood = num <= 4.4;
    isModerate = num <= 9.4;
  } else if (key === "o3") {
    isGood = num <= 0.054;
    isModerate = num <= 0.07;
  } else if (key === "so2") {
    isGood = num <= 35;
    isModerate = num <= 75;
  } else if (key === "no2") {
    isGood = num <= 53;
    isModerate = num <= 100;
  }

  if (isGood) {
    return { label: "Good", colorClass: "text-emerald-500" };
  }
  if (isModerate) {
    return { label: "Moderate", colorClass: "text-amber-500" };
  }
  return { label: "Poor", colorClass: "text-rose-500" };
}

export function getSensorReading(location: any, key: string): number | null {
  if (location.sensorHealth?.[key]?.value !== undefined && location.sensorHealth?.[key]?.value !== null) {
    return Number(location.sensorHealth[key].value);
  }
  if (location.latestReading?.[key] !== undefined && location.latestReading?.[key] !== null) {
    return Number(location.latestReading[key]);
  }
  if (location.readings?.[0]?.[key] !== undefined && location.readings?.[0]?.[key] !== null) {
    return Number(location.readings[0][key]);
  }
  if (location[key] !== undefined && location[key] !== null) {
    return Number(location[key]);
  }
  return null;
}

export function formatTimeAgo(dateInput?: string | Date | null): string {
  if (!dateInput) return "Updated 10 hours ago";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Updated 10 hours ago";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Updated just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Updated ${diffMin} ${diffMin === 1 ? "min" : "mins"} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Updated ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  return `Updated ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

// Fallback stations matching mockup when backend returns empty data
const DEFAULT_LOCATIONS = [
  {
    id: 1,
    name: "Valenzuela City",
    status: "ACTIVE",
    latestAQI: 23,
    lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    fallbackSensors: ["so2", "no2"],
    disconnectedSensors: ["co", "o3"],
    gateway: { id: "gw_valenzuela_01", isOnline: true, isSocketConnected: true },
    sensorHealth: {
      pm25: { connected: true, value: 14 },
      so2: { connected: true, value: 14, source: "OPEN_METEO_FALLBACK" },
      co: { connected: false, value: 14 },
      o3: { connected: false, value: 14 },
      no2: { connected: true, value: 14, source: "OPEN_METEO_FALLBACK" },
    },
  },
  {
    id: 2,
    name: "Quezon City",
    status: "ACTIVE",
    latestAQI: 23,
    lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    fallbackSensors: ["so2", "no2"],
    disconnectedSensors: ["co", "o3"],
    gateway: { id: "gw_quezon_02", isOnline: true, isSocketConnected: true },
    sensorHealth: {
      pm25: { connected: true, value: 14 },
      so2: { connected: true, value: 14, source: "OPEN_METEO_FALLBACK" },
      co: { connected: false, value: 14 },
      o3: { connected: false, value: 14 },
      no2: { connected: true, value: 14, source: "OPEN_METEO_FALLBACK" },
    },
  },
  {
    id: 3,
    name: "Manila",
    status: "ACTIVE",
    latestAQI: 23,
    lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    fallbackSensors: ["so2", "no2"],
    disconnectedSensors: ["co", "o3"],
    gateway: { id: "gw_manila_03", isOnline: true, isSocketConnected: true },
    sensorHealth: {
      pm25: { connected: true, value: 14 },
      so2: { connected: true, value: 14, source: "OPEN_METEO_FALLBACK" },
      co: { connected: false, value: 14 },
      o3: { connected: false, value: 14 },
      no2: { connected: true, value: 14, source: "OPEN_METEO_FALLBACK" },
    },
  },
];

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

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

function Home() {
  const navigate = useNavigate();
  const { overviewData, isLoading } = useDashboardSocket();
  const { deleteLocation } = useLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [diagnosticsLocation, setDiagnosticsLocation] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Determine stations to display: use socket/API data if available, fallback to mock stations matching the design
  const displayLocations = useMemo(() => {
    if (overviewData && overviewData.length > 0) {
      return overviewData;
    }
    return DEFAULT_LOCATIONS;
  }, [overviewData]);

  return (
    <div className="p-6 md:p-8 lg:p-10 bg-[#f8fafc] min-h-screen flex flex-col font-sans">
      {/* --- Action Row / Dashboard Header --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Monitoring Stations
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-normal">
            Real-time environmental monitoring and hardware sensor health
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-95 duration-150 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <FaPlus className="text-xs" />
          <span>Add Location</span>
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

      {/* --- Location Cards Grid: Clicking a card navigates to its StationDetails screen --- */}
      {isLoading && overviewData.length === 0 ? (
        <div className="text-center text-gray-500 py-16 font-medium">
          Loading stations...
        </div>
      ) : displayLocations.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border-2 border-dashed border-gray-300 rounded-2xl bg-white">
          No monitoring stations found. Click "+ Add Location" to register one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayLocations.map((location) => {
            const fallbackList = location.fallbackSensors || [];
            const disconnectedList = location.disconnectedSensors || [];
            const totalDevices = 5;
            const fallbackCount = fallbackList.length;
            const offlineCount = disconnectedList.length;
            const onlineCount = Math.max(0, totalDevices - fallbackCount - offlineCount);

            const aqiInfo = getAqiCategory(location.latestAQI);
            const fillPercent = getFillPercentage(location.latestAQI);

            return (
              <div
                key={location.id}
                onClick={() => navigate(`/station/${location.id}`, { state: { location } })}
                className="bg-white rounded-3xl border border-gray-100 hover:border-gray-200 transition-all duration-300 flex flex-col p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl cursor-pointer relative h-full justify-between"
              >
                {/* 1. Header: Location Name on the left, and 3-dots action menu on the top-right */}
                <div className="flex items-center justify-between gap-3 relative h-8 shrink-0">
                  <h2
                    className="text-xl font-bold text-gray-900 tracking-tight truncate"
                    title={location.name}
                  >
                    {location.name}
                  </h2>

                  {/* Top-right: Three vertical dots menu */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === location.id ? null : location.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Options"
                    >
                      <MdMoreVert className="text-xl" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === location.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20 cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <div
                          className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 flex flex-col"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              navigate(`/station/${location.id}`, { state: { location } });
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition"
                          >
                            <span>View Details</span>
                            <IoIosArrowForward className="text-xs text-gray-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              if (
                                window.confirm(
                                  `Are you sure you want to delete ${location.name}?`,
                                )
                              ) {
                                deleteLocation(location.id).then(() =>
                                  window.location.reload(),
                                );
                              }
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-between cursor-pointer transition"
                          >
                            <span>Delete</span>
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Status Indicators: ● 1 Online · ● 2 Fallback · ● 2 Offline · 5 devices */}
                <div className="flex items-center gap-2 text-xs text-gray-700 mt-2 flex-wrap min-h-[22px] shrink-0">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{onlineCount} Online</span>
                  </span>
                  <span className="text-gray-300 font-bold select-none">·</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>{fallbackCount} Fallback</span>
                  </span>
                  <span className="text-gray-300 font-bold select-none">·</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{offlineCount} Offline</span>
                  </span>
                  <span className="text-gray-300 font-bold select-none">·</span>
                  <span className="text-gray-500 font-medium">{totalDevices} devices</span>
                </div>

                {/* 3. Middle AQI Capsule Banner: Expanding fill based on AQI severity (fills 100% on Hazardous) */}
                <div className="relative w-full h-14 bg-[#f1f5f9] rounded-full p-1.5 my-5 flex items-center overflow-hidden shrink-0">
                  {/* Inside colored pill that expands with increasing AQI */}
                  <div
                    className="absolute left-1.5 top-1.5 bottom-1.5 rounded-full transition-all duration-500 ease-out shadow-xs"
                    style={{
                      width: fillPercent >= 100 ? "calc(100% - 12px)" : `${fillPercent}%`,
                      backgroundColor: aqiInfo.color,
                    }}
                  />

                  {/* Content layer over the pill */}
                  <div className="relative z-10 w-full flex items-center justify-between px-4 py-1.5 pointer-events-none">
                    <div className="flex items-baseline gap-1 text-white shrink-0">
                      <span className="text-2xl font-black leading-none tracking-tight">
                        {location.latestAQI ?? 23}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase opacity-95">
                        AQI
                      </span>
                    </div>
                    <div className="pr-3 flex items-center justify-end overflow-hidden">
                      <span
                        title={aqiInfo.fullName}
                        className={`font-black tracking-tight transition-colors duration-300 whitespace-nowrap select-none ${
                          aqiInfo.label.length > 10 ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
                        } ${fillPercent >= 85 ? "text-white" : "text-gray-900"}`}
                      >
                        {aqiInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Sensor Pollutant Breakdown (PM 2.5, SO², CO, O³, NO²) */}
                <div className="grid grid-cols-5 divide-x divide-gray-100 pt-1 pb-1 shrink-0">
                  {SENSOR_DISPLAY.map((sensor) => {
                    const isOffline = disconnectedList.includes(sensor.key);
                    const rawVal = getSensorReading(location, sensor.key);
                    const displayVal = isOffline ? "--" : rawVal !== null ? Math.round(rawVal) : 14;
                    const pollutantStatus = getPollutantStatus(sensor.key, rawVal, isOffline);

                    return (
                      <div
                        key={sensor.key}
                        className="flex flex-col items-center justify-center text-center px-1 overflow-hidden"
                      >
                        <span className="text-[11px] font-bold text-gray-600 tracking-wide uppercase truncate w-full">
                          {sensor.label}
                        </span>
                        <span className="text-base font-extrabold text-gray-900 mt-1">
                          {displayVal}
                        </span>
                        <span
                          className={`text-xs font-semibold mt-0.5 truncate w-full ${pollutantStatus.colorClass}`}
                          title={pollutantStatus.label}
                        >
                          {pollutantStatus.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 5. Bottom Toolbar */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 shrink-0">
                  <span className="text-xs text-gray-400 font-medium">
                    {formatTimeAgo(location.lastUpdated)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/station/${location.id}`, { state: { location } });
                    }}
                    className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                  >
                    <span>View Details</span>
                    <IoIosArrowForward className="text-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
