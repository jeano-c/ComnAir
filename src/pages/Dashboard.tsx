import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowDropDown, MdOutlineFileDownload } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import { FaPlus, FaTrash } from "react-icons/fa";
import { LineChart } from "@mui/x-charts/LineChart";
import { socket } from "../api/socket"; // <-- Adjust path to your socket instance
import AddLocationModal from "../components/AddLocationModal";
import { useLocations } from "../hooks/useLocation";

// ==========================================
// 1. CUSTOM HOOKS
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
    socket.on("locationUpdate", (data: { reading: any; latestAQI: number }) => {
      setLatestAQI(data.latestAQI);
      setHistoricalData((prev) => [...prev, data.reading]);
    });

    return () => {
      socket.off("locationUpdate");
    };
  }, [locationId]);

  return { historicalData, latestAQI, isLoading };
}

// ==========================================
// 2. EXPANDED DETAILS COMPONENT
// ==========================================
// We isolate this so the socket room join/leave only fires when expanded

// ==========================================
// 2. EXPANDED DETAILS COMPONENT
// ==========================================

// Configuration for our 5 sensors so we can easily map through them
const SENSORS = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", color: "#6366f1" }, // Indigo
  { key: "co", label: "CO", unit: "ppm", color: "#f59e0b" }, // Amber
  { key: "o3", label: "O3", unit: "ppm", color: "#10b981" }, // Emerald
  { key: "so2", label: "SO2", unit: "ppb", color: "#ef4444" }, // Red
  { key: "no2", label: "NO2", unit: "ppb", color: "#8b5cf6" }, // Purple
] as const;

type SensorKey = (typeof SENSORS)[number]["key"];

function ExpandedLocationDetails({ locationId }: { locationId: number }) {
  const { historicalData, isLoading } = useLocationSocket(locationId);

  // State to track which of the 5 sensors the user is currently viewing
  const [activeSensor, setActiveSensor] = useState<SensorKey>("pm25");

  // Find the config object for the currently selected sensor
  const currentSensorConfig = SENSORS.find((s) => s.key === activeSensor)!;

  // 1. FILTER: Only keep readings that actually have a value for the clicked sensor.
  // This prevents the graph line from plunging to 0 if a sensor reading is missing/null.
  const validData = historicalData.filter(
    (d) => d[activeSensor] !== null && d[activeSensor] !== undefined,
  );

  // 2. X-AXIS FIX: Convert the database timestamp into a readable time (e.g., "08:42 AM")
  const xData =
    validData.length > 0
      ? validData.map((d) =>
          new Date(d.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        )
      : ["--:--"];

  // 3. Y-AXIS FIX: Pass the raw values safely
  const yData =
    validData.length > 0 ? validData.map((d) => d[activeSensor]) : [0];

  // Get the very last reading for the highlight card
  const currentReading =
    validData.length > 0 ? validData[validData.length - 1] : null;
  const currentVal = currentReading?.[activeSensor];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading sensor data...
      </div>
    );
  }

  return (
    <div className="w-full mt-4 flex flex-col pt-2">
      <hr className="w-full h-px bg-gray-200 border-none mb-6" />

      {/* --- Sensor Selection Tabs --- */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SENSORS.map((sensor) => (
          <button
            key={sensor.key}
            onClick={() => setActiveSensor(sensor.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border ${
              activeSensor === sensor.key
                ? `bg-white shadow-md text-gray-800 border-[${sensor.color}]`
                : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
            }`}
            style={{
              borderColor:
                activeSensor === sensor.key ? sensor.color : "transparent",
              color: activeSensor === sensor.key ? sensor.color : undefined,
            }}
          >
            {sensor.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 w-full">
        <div className="flex-1 flex flex-col gap-6">
          {/* Dynamic Highlight Card */}
          <div className="w-full sm:w-48 border border-[#e2e8f0] rounded-xl p-4 shadow-sm bg-white flex flex-col relative transition-all duration-300">
            <MdOutlineFileDownload className="absolute top-4 right-4 text-gray-400 text-xl cursor-pointer hover:text-[#1F8F22]" />
            <span className="text-xs font-semibold text-gray-400 mb-1">
              {currentSensorConfig.label} ({currentSensorConfig.unit})
            </span>
            <span className="text-3xl font-bold text-[#1e293b]">
              {currentVal !== undefined && currentVal !== null
                ? Number(currentVal).toFixed(2)
                : "--"}
            </span>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-bold text-[#1F8F22] bg-green-50 px-2 py-0.5 rounded-md">
                Live
              </span>
              <span className="text-xs text-[#6366f1] hover:underline cursor-pointer font-medium">
                View Report
              </span>
            </div>
          </div>

          {/* Dynamic Chart */}
          <div className="w-full border border-[#e2e8f0] rounded-xl p-4 sm:p-6 shadow-sm bg-white min-h-75 sm:min-h-87.5 transition-all duration-300">
            <h3 className="font-bold text-sm text-gray-700 mb-4">
              {currentSensorConfig.label} History (24h)
            </h3>
            <div className="h-62.5 sm:h-75 w-full">
              {validData.length > 0 ? (
                <LineChart
                  xAxis={[
                    {
                      data: xData,
                      scaleType: "point", // <-- REQUIRED when using string labels (Time) on the X-Axis
                    },
                  ]}
                  series={[
                    {
                      data: yData,
                      color: currentSensorConfig.color,
                      area: true,
                      showMark: true,
                      // <-- NEW: Formats the hover tooltip to show the correct unit!
                      valueFormatter: (value) =>
                        value !== null
                          ? `${value} ${currentSensorConfig.unit}`
                          : "--",
                    },
                  ]}
                  // <-- NEW: Increased the 'left' margin to 50 so big Y-Axis numbers don't get cut off
                  margin={{ top: 10, bottom: 30, left: 50, right: 20 }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Panel */}
        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 gap-4 sm:gap-6">
          <span className="text-sm font-semibold text-gray-700 text-center">
            Export AQI Data (PDF/CSV)
          </span>
          <button className="bg-[#1F8F22] hover:bg-[#1a7a1d] text-white px-6 py-3 rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg active:scale-95 duration-150 w-full sm:w-auto">
            Add Air Quality Analyzer
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

function Home() {
  const { overviewData, isLoading } = useDashboardSocket();
  const { deleteLocation } = useLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col min-h-screen">
      {/* --- Action Row --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
          Overview
        </h1>
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

      {/* --- Location Cards List --- */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-12">
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

            return (
              <div
                key={location.id}
                className={`flex flex-col w-full rounded-2xl p-4 sm:p-5 transition-colors duration-300 ${
                  isExpanded
                    ? "bg-white border-2 border-[#1F8F22]/40 shadow-xl"
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
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                      ></span>
                      <span
                        className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${isExpanded ? "text-gray-500" : "text-white"}`}
                      >
                        {location.status}
                      </span>
                    </div>
                    <h2
                      className={`text-base sm:text-lg font-bold tracking-wide transition-colors duration-300 ${isExpanded ? "text-gray-900" : "text-white"}`}
                    >
                      {location.name}
                    </h2>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 sm:gap-4 w-full lg:w-auto">
                    <div
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-colors duration-300 ${isExpanded ? "bg-[#1F8F22] text-white" : "bg-transparent border border-white text-white"}`}
                    >
                      {location.latestAQI} AQI
                    </div>

                    <div
                      className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-md font-medium border transition-colors duration-300 ${isExpanded ? "bg-white border-gray-300 text-gray-700" : "bg-white border-transparent text-gray-600"}`}
                    >
                      {isExpanded
                        ? "Live Updates"
                        : `Last updated: ${new Date(location.lastUpdated).toLocaleTimeString()}`}
                      {isExpanded && (
                        <MdArrowDropDown className="inline ml-1" />
                      )}
                    </div>

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
                        className={`p-2 rounded transition-colors duration-300 ${isExpanded ? "text-red-500 hover:bg-red-50" : "text-white hover:text-red-400 hover:bg-black/10"}`}
                      >
                        <FaTrash className="text-sm" />
                      </button>

                      <button
                        className={`p-1 rounded transition-colors duration-300 ${isExpanded ? "text-gray-500 hover:bg-gray-100" : "text-white hover:bg-black/10"}`}
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
                      className="overflow-hidden"
                    >
                      <ExpandedLocationDetails locationId={location.id} />
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
