import React from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket"; // adjust path

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
    clearSystemNotification,
    clearLatestSpike,
    broadcastAdminAlert,
  } = useReadingsSocket() as any;

  // Handler for admin to click "Broadcast Warning" when a spike is detected
  const handleBroadcastSpike = async () => {
    if (!latestSpike) return;

    await broadcastAdminAlert({
      title: "Sudden Air Quality Decline",
      message: `AQI levels have suddenly spiked to ${latestSpike.newAqi} at ${latestSpike.location.name}. Please take precautions.`,
      level:
        latestSpike.level === "HAZARDOUS" ||
        latestSpike.level === "VERY_UNHEALTHY"
          ? "DANGER"
          : "WARNING",
      locationId: latestSpike.location.id, // Broadcast only to users looking at this location (optional)
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
                className={`font-bold text-lg ${
                  systemNotification.level === "DANGER"
                    ? "text-red-800"
                    : systemNotification.level === "WARNING"
                      ? "text-orange-800"
                      : "text-blue-800"
                }`}
              >
                ⚠️ {systemNotification.title}
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
              className="text-gray-400 hover:text-gray-800 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. ADMIN SPIKE PROMPT (Seen only by admins to trigger the broadcast) */}
      {isAdmin && latestSpike && (
        <div className="pointer-events-auto shadow-2xl rounded-lg bg-gray-900 border border-gray-700 p-4 text-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-red-400 flex items-center gap-2">
              🚨 System Alert: Sudden Spike
            </h3>
            <button
              onClick={clearLatestSpike}
              className="text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-300 mb-3">{latestSpike.message}</p>

          <div className="flex gap-2">
            <button
              onClick={handleBroadcastSpike}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded transition"
            >
              Broadcast Warning to Users
            </button>
            <button
              onClick={clearLatestSpike}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold py-2 px-3 rounded transition border border-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
