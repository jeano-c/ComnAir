import React from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket"; // adjust path
import { FaExclamationTriangle, FaLaptop } from "react-icons/fa";
import { MdOutlineSensorsOff, MdShowChart } from "react-icons/md";
import { IoClose } from "react-icons/io5";

// Pass an `isAdmin` prop based on your auth context to determine if they
// should see the "Spike Detection & Broadcast" prompt.
export default function AqiNotifications({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const {
    systemNotification,
    latestSpike,
    latestSensorStatusAlert,
    latestDeviceAlert,
    clearSystemNotification,
    clearLatestSpike,
    clearLatestSensorStatusAlert,
    clearLatestDeviceAlert,
    broadcastAdminAlert,
  } = useReadingsSocket() as any;

  // Handler for admin to click "Broadcast Warning" when a spike is detected
  const handleBroadcastSpike = async () => {
    if (!latestSpike) return;

    const isOzone =
      latestSpike.message?.includes("O3") ||
      latestSpike.message?.includes("Ozone");
    const isCO =
      latestSpike.message?.includes("CO") ||
      latestSpike.message?.includes("Carbon Monoxide");
    const isPM25 = latestSpike.message?.includes("PM2.5");
    const isSO2 = latestSpike.message?.includes("SO2");
    const isNO2 = latestSpike.message?.includes("NO2");

    const dynamicTitle = isOzone
      ? "Elevated Ozone Warning"
      : isCO
      ? "Elevated Carbon Monoxide Warning"
      : isPM25
      ? "Elevated PM2.5 Warning"
      : isSO2
      ? "Elevated Sulfur Dioxide Warning"
      : isNO2
      ? "Elevated Nitrogen Dioxide Warning"
      : "Air Quality Alert";

    await broadcastAdminAlert({
      title: dynamicTitle,
      message:
        latestSpike.message ||
        `Air quality alert at ${latestSpike.location.name}. Please take precautions.`,
      level:
        latestSpike.level === "HAZARDOUS" ||
        latestSpike.level === "VERY_UNHEALTHY"
          ? "DANGER"
          : "WARNING",
      locationId: latestSpike.location.id,
      aqi: latestSpike.newAqi,
    });

    clearLatestSpike();
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-4 w-full max-w-md pointer-events-none">
      {/* 1. PUBLIC NOTIFICATION (Seen by everyone) */}
      {systemNotification && (
        <div
          className={`pointer-events-auto shadow-lg rounded-lg border-l-4 p-4 ${
            systemNotification.level === "DANGER"
              ? "bg-red-50 border-red-500"
              : systemNotification.level === "WARNING"
                ? "bg-orange-50 border-orange-500"
                : "bg-blue-50 border-blue-500"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3
                className={`font-bold text-lg flex items-center gap-2 ${
                  systemNotification.level === "DANGER"
                    ? "text-red-800"
                    : systemNotification.level === "WARNING"
                      ? "text-orange-800"
                      : "text-blue-800"
                }`}
              >
                <FaExclamationTriangle className="text-base shrink-0" />
                <span>{systemNotification.title}</span>
              </h3>
              <p className="mt-1 text-sm text-gray-700 font-medium">
                {systemNotification.message}
              </p>
              {systemNotification.aqi && (
                <span className="inline-block mt-2 px-2 py-1 bg-white rounded-md text-xs font-bold border">
                  Current AQI: {systemNotification.aqi}
                </span>
              )}
            </div>
            <button
              onClick={clearSystemNotification}
              className="text-gray-400 hover:text-gray-800 transition p-1 rounded-md hover:bg-black/5 cursor-pointer"
              aria-label="Close notification"
            >
              <IoClose className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* 2. SENSOR DISCONNECTION ALERT (Seen when hardware probe drops) */}
      {latestSensorStatusAlert && (
        <div className="pointer-events-auto shadow-xl rounded-xl border-l-4 border-red-500 bg-red-50 p-4 font-sans animate-bounce-short">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <MdOutlineSensorsOff className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-900">
                  Hardware Sensor Disconnected
                </h3>
                <p className="mt-1 text-xs text-red-800 font-medium">
                  {latestSensorStatusAlert.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-red-200 text-red-900 px-2 py-0.5 rounded">
                    Ethernet Node: {latestSensorStatusAlert.deviceId || "Gateway"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(latestSensorStatusAlert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={clearLatestSensorStatusAlert}
              className="text-gray-400 hover:text-gray-800 transition cursor-pointer p-1 rounded-md hover:bg-black/5"
              aria-label="Close alert"
            >
              <IoClose className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* 3. GATEWAY DEVICE ALERT (Seen when laptop connects or disconnects) */}
      {latestDeviceAlert && (
        <div
          className={`pointer-events-auto shadow-xl rounded-xl border-l-4 p-4 font-sans animate-bounce-short ${
            latestDeviceAlert.status === "ONLINE"
              ? "border-green-500 bg-green-50"
              : "border-orange-500 bg-orange-50"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  latestDeviceAlert.status === "ONLINE"
                    ? "bg-green-100 border-green-200 text-green-700"
                    : "bg-orange-100 border-orange-200 text-orange-700"
                }`}
              >
                <FaLaptop className="text-lg" />
              </div>
              <div>
                <h3
                  className={`font-bold text-sm ${
                    latestDeviceAlert.status === "ONLINE"
                      ? "text-green-900"
                      : "text-orange-900"
                  }`}
                >
                  Gateway Laptop {latestDeviceAlert.status === "ONLINE" ? "Connected" : "Disconnected"}
                </h3>
                <p
                  className={`mt-1 text-xs font-medium ${
                    latestDeviceAlert.status === "ONLINE"
                      ? "text-green-800"
                      : "text-orange-800"
                  }`}
                >
                  {latestDeviceAlert.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-white/80 px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                    Device: {latestDeviceAlert.deviceId}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(latestDeviceAlert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={clearLatestDeviceAlert}
              className="text-gray-400 hover:text-gray-800 transition cursor-pointer p-1 rounded-md hover:bg-black/5"
              aria-label="Close alert"
            >
              <IoClose className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* 4. ADMIN SPIKE PROMPT (Seen only by admins to trigger the broadcast) */}
      {isAdmin && latestSpike && (
        <div className="pointer-events-auto shadow-2xl rounded-lg bg-gray-900 border border-gray-700 p-4 text-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-rose-400 flex items-center gap-2">
              <MdShowChart className="text-lg shrink-0" />
              <span>System Alert: Sudden Spike</span>
            </h3>
            <button
              onClick={clearLatestSpike}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition cursor-pointer"
              aria-label="Dismiss alert"
            >
              <IoClose className="text-lg" />
            </button>
          </div>

          <p className="text-sm text-gray-300 mb-3">{latestSpike.message}</p>

          <div className="flex gap-2">
            <button
              onClick={handleBroadcastSpike}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded transition cursor-pointer"
            >
              Broadcast Warning to Users
            </button>
            <button
              onClick={clearLatestSpike}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold py-2 px-3 rounded transition border border-gray-600 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
