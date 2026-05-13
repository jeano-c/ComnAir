import React, { useEffect, useState } from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket";

export default function SpikeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [spikes, setSpikes] = useState<any[]>([]);
  const { fetchAqiSpikes, latestSpike } = useReadingsSocket();

  // Fetch history when the drawer opens
  useEffect(() => {
    if (isOpen) {
      loadSpikes();
    }
  }, [isOpen]);

  // If a new live spike comes in, fetch the updated list so the drawer is fresh
  useEffect(() => {
    if (latestSpike) {
      loadSpikes();
    }
  }, [latestSpike]);

  const loadSpikes = async () => {
    const data: any = await fetchAqiSpikes();
    if (data && !data.error) {
      setSpikes(data);
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Button to open Drawer */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-xl z-40 transition-transform hover:scale-105 flex items-center justify-center"
      >
        <span className="text-xl">⚠️</span>
        <span className="ml-2 font-bold hidden sm:block">Spike History</span>
      </button>

      {/* Overlay Background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Drawer Header */}
        <div className="bg-gray-900 text-white p-5 flex justify-between items-center shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🚨 AQI Spike History
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content (Scrollable list of spikes) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {spikes.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">
              No sudden spikes recorded yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {spikes.map((spike) => (
                <div
                  key={spike.id}
                  className={`bg-white border rounded-lg shadow-sm p-4 ${
                    spike.level === "HAZARDOUS"
                      ? "border-red-500"
                      : spike.level === "VERY_UNHEALTHY"
                        ? "border-purple-500"
                        : "border-orange-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-500">
                      {formatDate(spike.timestamp)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-white ${
                        spike.level === "HAZARDOUS"
                          ? "bg-red-600"
                          : spike.level === "VERY_UNHEALTHY"
                            ? "bg-purple-600"
                            : "bg-orange-500"
                      }`}
                    >
                      {spike.level.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-800 mb-1">
                    {spike.location.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{spike.message}</p>

                  {/* The Jump Metrics */}
                  <div className="bg-gray-100 rounded flex justify-between items-center p-2 text-sm">
                    <div className="text-center flex-1 border-r border-gray-300">
                      <span className="block text-xs text-gray-500 uppercase">
                        From
                      </span>
                      <span className="font-bold text-gray-700">
                        {Math.round(spike.previousAqi)}
                      </span>
                    </div>
                    <div className="text-center flex-1 border-r border-gray-300">
                      <span className="block text-xs text-gray-500 uppercase">
                        To
                      </span>
                      <span className="font-bold text-red-600">
                        {Math.round(spike.newAqi)}
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <span className="block text-xs text-gray-500 uppercase">
                        Jump
                      </span>
                      <span className="font-bold text-gray-900">
                        +{Math.round(spike.jump)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
