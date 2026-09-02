import { HiOutlineX } from "react-icons/hi";
import { FaCheckCircle, FaExclamationTriangle, FaEthernet, FaLaptop, FaGlobeAmericas } from "react-icons/fa";
import { MdSensors, MdOutlineSensorsOff } from "react-icons/md";

interface SensorStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  locationId: number;
  gateway?: {
    id?: string;
    isOnline?: boolean;
    isSocketConnected?: boolean;
    lastSeen?: string | Date | null;
  };
  sensorHealth?: Record<string, { connected: boolean; value: number | null; source?: string }>;
  disconnectedSensors?: string[];
  fallbackSensors?: string[];
  hasFallback?: boolean;
  lastUpdated?: string | null;
}

const SENSOR_META = [
  {
    key: "pm25",
    label: "PM2.5",
    fullName: "Fine Particulate Matter",
    unit: "µg/m³",
    color: "#6366f1",
    disconnectBehavior: "Sends null / no packet when disconnected",
  },
  {
    key: "co",
    label: "CO",
    fullName: "Carbon Monoxide",
    unit: "ppm",
    color: "#f59e0b",
    disconnectBehavior: "Sends 0.0 ppm when disconnected",
  },
  {
    key: "o3",
    label: "O3",
    fullName: "Ozone",
    unit: "ppm",
    color: "#10b981",
    disconnectBehavior: "Sends 0.0 ppm when disconnected",
  },
  {
    key: "so2",
    label: "SO2",
    fullName: "Sulfur Dioxide",
    unit: "ppb",
    color: "#ef4444",
    disconnectBehavior: "Sends 0.0 ppb when disconnected",
  },
  {
    key: "no2",
    label: "NO2",
    fullName: "Nitrogen Dioxide",
    unit: "ppb",
    color: "#8b5cf6",
    disconnectBehavior: "Sends 0.0 ppb when disconnected",
  },
];

export default function SensorStatusDrawer({
  isOpen,
  onClose,
  locationName,
  locationId,
  gateway,
  sensorHealth = {},
  disconnectedSensors = [],
  fallbackSensors = [],
  hasFallback = false,
  lastUpdated,
}: SensorStatusDrawerProps) {
  if (!isOpen) return null;

  const totalCount = SENSOR_META.length;
  const fallbackCount = fallbackSensors.length;
  const disconnectedCount = disconnectedSensors.length;
  const hardwareOnlineCount = totalCount - disconnectedCount - fallbackCount;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col font-sans">
        {/* Header */}
        <div className="bg-[#1F8F22] text-white p-5 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MdSensors className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Hardware Sensor Diagnostics</h2>
              <p className="text-xs text-white/80 font-medium">{locationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
          >
            <HiOutlineX className="text-2xl" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc] space-y-5">
          {/* Status Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex flex-col">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Hardware
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-[#1F8F22]">{hardwareOnlineCount}</span>
                <span className="text-[10px] font-medium text-gray-400">/ {totalCount}</span>
              </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-2xs flex flex-col">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                API Fallback
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-xl font-black ${
                    fallbackCount > 0 ? "text-purple-600" : "text-gray-400"
                  }`}
                >
                  {fallbackCount}
                </span>
                <span className="text-[10px] font-medium text-gray-400">active</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex flex-col">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Disconnected
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-xl font-black ${
                    disconnectedCount > 0 ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {disconnectedCount}
                </span>
                <span className="text-[10px] font-medium text-gray-400">offline</span>
              </div>
            </div>
          </div>

          {/* Gateway Laptop Status Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <FaLaptop className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Station Laptop (Ethernet Gateway)
                  </h4>
                  <p className="text-xs text-gray-500">
                    Device ID: <span className="font-mono font-bold text-gray-700">{gateway?.id || "eps_32"}</span>
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  gateway?.isSocketConnected
                    ? "bg-green-100 text-green-800"
                    : gateway?.isOnline
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800 animate-pulse"
                }`}
              >
                {gateway?.isSocketConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> Live Socket
                  </>
                ) : gateway?.isOnline ? (
                  <>
                    <FaCheckCircle className="text-xs text-blue-600" /> Active (15m sync)
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="text-xs text-red-600" /> Disconnected
                  </>
                )}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Bridge Mode: Modbus TCP & USB Serial</span>
              <span>
                {gateway?.lastSeen
                  ? `Last Seen: ${new Date(gateway.lastSeen).toLocaleTimeString()}`
                  : "No recent heartbeat"}
              </span>
            </div>
          </div>

          {/* Ethernet Connection Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
            <FaEthernet className="text-blue-600 text-lg mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Gateway Device Interface: </span>
              Readings are collected by the Ethernet laptop bridge and streamed via WebSocket.
              {lastUpdated && (
                <span className="block mt-0.5 text-blue-700">
                  Last Reading Received: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Sensor List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Connected Hardware Probes
            </h3>

            {SENSOR_META.map((sensor) => {
              const info = sensorHealth[sensor.key];
              const isFallback =
                info?.source === "OPEN_METEO_FALLBACK" ||
                fallbackSensors.includes(sensor.key);
              const isConnected = info
                ? info.connected
                : !disconnectedSensors.includes(sensor.key);
              const isHardware = isConnected && !isFallback;
              const val = info?.value;

              return (
                <div
                  key={sensor.key}
                  className={`bg-white rounded-xl p-4 border transition-all duration-200 ${
                    isFallback
                      ? "border-purple-300 bg-purple-50/30 shadow-xs"
                      : isHardware
                      ? "border-gray-200 shadow-2xs"
                      : "border-red-300 bg-red-50/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: sensor.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">
                            {sensor.label}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            ({sensor.fullName})
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Unit: {sensor.unit}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isFallback
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : isHardware
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800 animate-pulse"
                      }`}
                    >
                      {isFallback ? (
                        <>
                          <FaGlobeAmericas className="text-xs text-purple-600" /> API Fallback
                        </>
                      ) : isHardware ? (
                        <>
                          <FaCheckCircle className="text-xs text-green-600" /> Hardware Online
                        </>
                      ) : (
                        <>
                          <MdOutlineSensorsOff className="text-xs text-red-600" /> Disconnected
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-500">Current Reading: </span>
                      <span className="font-bold text-gray-900">
                        {val !== null && val !== undefined
                          ? `${Number(val).toFixed(4)} ${sensor.unit}`
                          : "No Signal (0 / Null)"}
                      </span>
                      {isFallback && (
                        <span className="ml-1.5 text-[10px] text-purple-600 font-semibold">
                          (Open-Meteo Satellite)
                        </span>
                      )}
                    </div>

                    {isFallback ? (
                      <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                        <FaGlobeAmericas className="text-[10px]" /> Probe Offline · Satellite Active
                      </span>
                    ) : !isHardware ? (
                      <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                        <FaExclamationTriangle className="text-[10px]" /> Check Wire / Cable
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </>
  );
}
