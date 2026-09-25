import React, { useEffect, useState } from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket";
import { MdShowChart, MdOutlineHistory } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { FiTrendingUp, FiClock, FiMapPin } from "react-icons/fi";
import { HiArrowSmRight } from "react-icons/hi";

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
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 px-4 py-3 bg-slate-900/95 hover:bg-slate-900 text-white rounded-full shadow-lg hover:shadow-xl border border-slate-700/60 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        title="View AQI Spike History"
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
          <MdShowChart className="text-base" />
          {spikes.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-slate-900"></span>
            </span>
          )}
        </div>
        <span className="font-semibold text-sm tracking-tight text-slate-100 hidden sm:inline">
          Spike History
        </span>
        {spikes.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {spikes.length}
          </span>
        )}
      </button>

      {/* Overlay Background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Drawer Header */}
        <div className="bg-white border-b border-slate-200/80 p-5 flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 shadow-xs">
              <MdShowChart className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  AQI Spike History
                </h2>
                {spikes.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {spikes.length} {spikes.length === 1 ? "event" : "events"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sudden surges and anomaly events detected by sensors
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Drawer Content (Scrollable list of spikes) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {spikes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                <MdOutlineHistory className="text-2xl" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Spikes Recorded</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Air quality across all monitored locations has remained within normal limits.
              </p>
            </div>
          ) : (
            spikes.map((spike) => {
              const isHazardous = spike.level === "HAZARDOUS";
              const isVeryUnhealthy = spike.level === "VERY_UNHEALTHY";

              const badgeClass = isHazardous
                ? "bg-rose-50 text-rose-700 border-rose-200/80"
                : isVeryUnhealthy
                ? "bg-purple-50 text-purple-700 border-purple-200/80"
                : "bg-amber-50 text-amber-700 border-amber-200/80";

              const accentBorder = isHazardous
                ? "border-l-rose-500"
                : isVeryUnhealthy
                ? "border-l-purple-500"
                : "border-l-amber-500";

              const jumpColor = isHazardous
                ? "text-rose-600 bg-rose-50 border-rose-200/80"
                : isVeryUnhealthy
                ? "text-purple-600 bg-purple-50 border-purple-200/80"
                : "text-amber-600 bg-amber-50 border-amber-200/80";

              return (
                <div
                  key={spike.id}
                  className={`bg-white rounded-xl border border-slate-200/80 border-l-4 ${accentBorder} shadow-xs hover:shadow-md transition-all p-4 flex flex-col gap-3`}
                >
                  {/* Top Row: Location & Severity Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                        <FiMapPin className="text-slate-400 text-xs shrink-0" />
                        <span>
                          {spike.location?.name ||
                            `Location ${spike.locationId || ""}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                        <FiClock className="text-[10px] text-slate-400 shrink-0" />
                        <span>{formatDate(spike.timestamp)}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider shrink-0 ${badgeClass}`}
                    >
                      {spike.level?.replace("_", " ")}
                    </span>
                  </div>

                  {/* Message / Advisory */}
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 leading-relaxed">
                    {spike.message}
                  </p>

                  {/* Surge Metrics */}
                  <div className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100/60 border border-slate-200/70 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          From
                        </span>
                        <span className="font-bold text-slate-700">
                          {Math.round(spike.previousAqi)}{" "}
                          <span className="text-[10px] font-normal text-slate-400">
                            AQI
                          </span>
                        </span>
                      </div>

                      <HiArrowSmRight className="text-slate-400 text-base shrink-0" />

                      <div>
                        <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Spike To
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {Math.round(spike.newAqi)}{" "}
                          <span className="text-[10px] font-normal text-slate-400">
                            AQI
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Surge
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold border px-2 py-0.5 rounded-md text-xs ${jumpColor}`}
                      >
                        <FiTrendingUp className="text-[11px]" />+
                        {Math.round(spike.jump)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
