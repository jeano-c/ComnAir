import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { socket } from "../api/socket";
import { useReadingsSocket } from "../hooks/useReadingsSocket";
import {
  calculatePM25AQI,
  calculateO3AQI,
  calculateCOAQI,
  calculateSO2AQI,
  calculateNO2AQI,
  calculateOverallAQI,
  getAqiCategory,
} from "../utils/aqiCalculations";
import {
  generateGenericAiTip,
  getGenericFallbackTip,
  type GenericAiTipResult,
} from "../services/genericAiTipService";
import {
  MdOutlineAutoAwesome,
  MdOutlineHealthAndSafety,
  MdOutlineDirectionsRun,
  MdRefresh,
  MdAir,
  MdLocationOn,
} from "react-icons/md";
import { FaHeartbeat, FaExclamationTriangle } from "react-icons/fa";
import { IoShieldCheckmarkOutline, IoSparkles } from "react-icons/io5";

// Fallback monitoring stations matching Dashboard mockup
const DEFAULT_LOCATIONS = [
  {
    id: 1,
    name: "Valenzuela City",
    status: "ACTIVE",
    latestAQI: 23,
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
    latestAQI: 45,
    sensorHealth: {
      pm25: { connected: true, value: 25 },
      so2: { connected: true, value: 18, source: "OPEN_METEO_FALLBACK" },
      co: { connected: false, value: 10 },
      o3: { connected: false, value: 20 },
      no2: { connected: true, value: 15, source: "OPEN_METEO_FALLBACK" },
    },
  },
  {
    id: 3,
    name: "Manila",
    status: "ACTIVE",
    latestAQI: 164,
    sensorHealth: {
      pm25: { connected: true, value: 82 },
      so2: { connected: true, value: 22, source: "OPEN_METEO_FALLBACK" },
      co: { connected: true, value: 8 },
      o3: { connected: true, value: 30 },
      no2: { connected: true, value: 25, source: "OPEN_METEO_FALLBACK" },
    },
  },
];

// Helper to reliably extract sensor value across all backend data formats
function extractSensorValue(station: any, key: string): number {
  if (!station) return 0;
  if (station.sensorHealth?.[key]?.value !== undefined && station.sensorHealth?.[key]?.value !== null) {
    return Number(station.sensorHealth[key].value);
  }
  if (station.latestReading?.[key] !== undefined && station.latestReading?.[key] !== null) {
    return Number(station.latestReading[key]);
  }
  if (station.readings?.[0]?.[key] !== undefined && station.readings?.[0]?.[key] !== null) {
    return Number(station.readings[0][key]);
  }
  if (station[key] !== undefined && station[key] !== null) {
    return Number(station[key]);
  }
  return 0;
}

export default function GenericAqiAiTipCard() {
  const { latestSpike } = useReadingsSocket();

  // 1. Dashboard stations state
  const [dashboardStations, setDashboardStations] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | string>(1);

  const [tipResult, setTipResult] = useState<GenericAiTipResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(socket.connected);
  const [justUpdatedPulse, setJustUpdatedPulse] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Generation sequence ref to prevent race conditions during rapid sensor pushes
  const genSeqRef = useRef<number>(0);

  // --- Real-time Socket Subscriptions ---
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Initial fetch of dashboard monitoring stations
    socket.emit("getDashboardData", (response: any) => {
      if (response && !response.error && Array.isArray(response) && response.length > 0) {
        setDashboardStations(response);
      }
    });

    // 1. Full dashboard overview cycle update
    const handleDashboardUpdated = (updatedData: any) => {
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        setDashboardStations(updatedData);
        setJustUpdatedPulse(true);
        setTimeout(() => setJustUpdatedPulse(false), 1500);
      }
    };

    // 2. ⚡ LIVE IMMEDIATE SENSOR PACKET: Triggers real-time update per reading!
    const handleNewReading = (newReading: any) => {
      if (!newReading) return;
      const targetLocationId = Number(newReading.locationId || newReading.location?.id);

      setDashboardStations((prev) => {
        const list = prev.length > 0 ? prev : DEFAULT_LOCATIONS;
        return list.map((st) => {
          if (Number(st.id) === targetLocationId || (targetLocationId === 0 && Number(st.id) === 1)) {
            const calculatedAqi = calculateOverallAQI(newReading) || newReading.overallAQI || newReading.aqi;
            return {
              ...st,
              latestAQI: calculatedAqi || st.latestAQI,
              latestReading: newReading,
              sensorHealth: {
                ...st.sensorHealth,
                pm25: { connected: true, value: newReading.pm25 ?? st.sensorHealth?.pm25?.value },
                co: { connected: true, value: newReading.co ?? st.sensorHealth?.co?.value },
                o3: { connected: true, value: newReading.o3 ?? st.sensorHealth?.o3?.value },
                so2: { connected: true, value: newReading.so2 ?? st.sensorHealth?.so2?.value },
                no2: { connected: true, value: newReading.no2 ?? st.sensorHealth?.no2?.value },
              },
              lastUpdated: new Date().toISOString(),
            };
          }
          return st;
        });
      });

      setJustUpdatedPulse(true);
      setTimeout(() => setJustUpdatedPulse(false), 1500);
    };

    socket.on("dashboardUpdated", handleDashboardUpdated);
    socket.on("onNewReading", handleNewReading);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("dashboardUpdated", handleDashboardUpdated);
      socket.off("onNewReading", handleNewReading);
    };
  }, []);

  // Use dashboard stations or mock fallback
  const stations = useMemo(() => {
    if (dashboardStations && dashboardStations.length > 0) {
      return dashboardStations;
    }
    return DEFAULT_LOCATIONS;
  }, [dashboardStations]);

  // Ensure selected station remains valid
  useEffect(() => {
    if (stations.length > 0) {
      const exists = stations.some((s) => String(s.id) === String(selectedStationId));
      if (!exists) {
        setSelectedStationId(stations[0].id);
      }
    }
  }, [stations, selectedStationId]);

  // Auto-switch to station experiencing a live spike
  useEffect(() => {
    if (latestSpike?.location?.id) {
      const spikeStationId = latestSpike.location.id;
      const found = stations.find(
        (s) =>
          String(s.id) === String(spikeStationId) ||
          s.name?.toLowerCase() === latestSpike.location?.name?.toLowerCase()
      );
      if (found) {
        setSelectedStationId(found.id);
      }
    }
  }, [latestSpike, stations]);

  // Currently selected station object
  const activeStation = useMemo(() => {
    const found = stations.find((s) => String(s.id) === String(selectedStationId));
    return found || stations[0] || DEFAULT_LOCATIONS[0];
  }, [stations, selectedStationId]);

  // Extract pollutants and compute dominant pollutant for the selected station
  const stationMetrics = useMemo(() => {
    const pm25Val = extractSensorValue(activeStation, "pm25");
    const coVal = extractSensorValue(activeStation, "co");
    const o3Val = extractSensorValue(activeStation, "o3");
    const so2Val = extractSensorValue(activeStation, "so2");
    const no2Val = extractSensorValue(activeStation, "no2");

    const pm25AQI = calculatePM25AQI(pm25Val);
    const coAQI = calculateCOAQI(coVal);
    const o3AQI = calculateO3AQI(o3Val);
    const so2AQI = calculateSO2AQI(so2Val);
    const no2AQI = calculateNO2AQI(no2Val);

    const subAqis = [
      { key: "PM2.5", val: pm25AQI, raw: pm25Val, unit: "µg/m³" },
      { key: "CO", val: coAQI, raw: coVal, unit: "ppm" },
      { key: "Ozone", val: o3AQI, raw: o3Val, unit: "ppm" },
      { key: "SO2", val: so2AQI, raw: so2Val, unit: "ppb" },
      { key: "NO2", val: no2AQI, raw: no2Val, unit: "ppb" },
    ];
    subAqis.sort((a, b) => b.val - a.val);
    const leading = subAqis[0];

    const currentAqi = Number(
      activeStation?.latestAQI ??
      activeStation?.latestReading?.overallAQI ??
      leading.val ??
      25
    );

    const hasSpike = Boolean(
      (latestSpike &&
        (String(latestSpike.location?.id) === String(activeStation.id) ||
          latestSpike.location?.name === activeStation.name)) ||
        currentAqi > 100
    );

    return {
      stationId: activeStation.id,
      stationName: activeStation.name,
      aqi: currentAqi,
      oldAqi: latestSpike?.oldAqi,
      dominantPollutant: leading.key,
      dominantValue: leading.raw,
      dominantUnit: leading.unit,
      isSpike: hasSpike,
    };
  }, [activeStation, latestSpike]);

  // --- Real-Time Two-Tier Tip Updater ---
  // Tier 1: Instant (0ms) EPA deterministic update so the tip changes immediately
  // Tier 2: Background Gemini LLM update with tailored phrasing
  const fetchAiTip = useCallback(async () => {
    const seq = ++genSeqRef.current;

    // ⚡ Tier 1: Instant Update (0ms delay)
    const instantTip = getGenericFallbackTip(
      stationMetrics.aqi,
      stationMetrics.dominantPollutant,
      stationMetrics.isSpike,
      stationMetrics.stationName
    );
    setTipResult(instantTip);
    setLastRefreshed(new Date());

    // 🤖 Tier 2: Background Gemini AI Call
    setIsLoading(true);
    try {
      const result = await generateGenericAiTip({
        aqi: stationMetrics.aqi,
        dominantPollutant: stationMetrics.dominantPollutant,
        dominantValue: stationMetrics.dominantValue,
        oldAqi: stationMetrics.oldAqi,
        isSpike: stationMetrics.isSpike,
        locationName: stationMetrics.stationName,
      });

      // Avoid race conditions if a newer reading arrived while Gemini was thinking
      if (seq === genSeqRef.current) {
        setTipResult(result);
        setLastRefreshed(new Date());
      }
    } catch {
      // Retain instant EPA tip on error
    } finally {
      if (seq === genSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [stationMetrics]);

  // Automatically execute whenever stationMetrics changes in real-time
  useEffect(() => {
    fetchAiTip();
  }, [fetchAiTip]);

  const category = getAqiCategory(stationMetrics.aqi);

  return (
    <div className="mb-10 w-full font-sans">
      <div
        className={`bg-white rounded-3xl shadow-md border overflow-hidden transition-all duration-300 ${
          stationMetrics.isSpike
            ? "border-amber-300 shadow-amber-500/10 ring-4 ring-amber-500/10"
            : "border-slate-200/90"
        }`}
      >
        {/* --- Top Control & Status Ribbon --- */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MdOutlineAutoAwesome className="text-2xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  AI Real-Time Advisory
                </span>
                {stationMetrics.isSpike && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-400/30 animate-pulse">
                    <FaExclamationTriangle className="text-[10px]" />
                    Spike Detected
                  </span>
                )}
                {justUpdatedPulse && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 animate-bounce">
                    ⚡ Live Packet
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {tipResult?.headline || `Advisory: ${stationMetrics.stationName}`}
              </h2>
            </div>
          </div>

          {/* --- Dropdown: Dashboard Monitoring Stations & Their AQI --- */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
              <MdLocationOn className="text-emerald-400 text-base shrink-0" />
              <label htmlFor="station-select" className="sr-only">
                Select Monitoring Station
              </label>
              <select
                id="station-select"
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="text-xs bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer pr-1"
                title="Select a Dashboard Monitoring Station"
              >
                {stations.map((st) => {
                  const stCategory = getAqiCategory(st.latestAQI);
                  const isSpiking =
                    latestSpike &&
                    (String(latestSpike.location?.id) === String(st.id) ||
                      latestSpike.location?.name === st.name);

                  return (
                    <option
                      key={st.id}
                      value={st.id}
                      className="bg-slate-900 text-slate-100 py-1"
                    >
                      {st.name} — {st.latestAQI} AQI ({stCategory.label})
                      {isSpiking ? " 🚨 Spike" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={fetchAiTip}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3 disabled:opacity-50"
              title="Regenerate AI Tip"
            >
              <MdRefresh
                className={`text-base ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isLoading ? "Synthesizing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {/* --- Main Banner Body --- */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-white to-slate-50/50 flex flex-col gap-6">
          {/* Status summary banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-sm transition-transform duration-300 ${
                  justUpdatedPulse ? "scale-110 ring-4 ring-emerald-400" : ""
                }`}
                style={{ backgroundColor: category.color }}
              >
                <span className="text-base leading-none">
                  {stationMetrics.aqi}
                </span>
                <span className="text-[9px] uppercase tracking-tighter opacity-90">
                  AQI
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Station:
                  </span>
                  <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {stationMetrics.stationName}
                  </span>
                  <span
                    className="text-xs font-extrabold px-2 py-0.5 rounded-md ml-1"
                    style={{
                      backgroundColor: category.bgColor,
                      color: category.textColor,
                    }}
                  >
                    {category.fullName}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {tipResult?.summary ||
                    `Live air quality measured at ${stationMetrics.stationName}`}
                </p>
              </div>
            </div>

            {/* Dominant Pollutant Badge */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 self-start sm:self-auto shrink-0 shadow-2xs">
              <MdAir className="text-lg text-emerald-600" />
              <div className="text-xs">
                <span className="text-slate-400 block font-medium text-[10px] uppercase">
                  Primary Pollutant
                </span>
                <span className="font-extrabold text-slate-800">
                  {stationMetrics.dominantPollutant}
                </span>
              </div>
            </div>
          </div>

          {/* --- Dual Generic Health Advice Cards --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. WITHOUT Health Problems (General Public) */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 text-base">
                      <MdOutlineDirectionsRun />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold leading-tight">
                        Without Health Problems
                      </h3>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        General Population
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60">
                    Standard Guidance
                  </span>
                </div>

                <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/60">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {tipResult?.withoutHealthProblems}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <IoShieldCheckmarkOutline className="text-emerald-500 text-sm shrink-0" />
                <span>
                  Applies to daily activities, commuting, and regular outdoor fitness in {stationMetrics.stationName}.
                </span>
              </div>
            </div>

            {/* 2. WITH Health Problems (Sensitive Groups) */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-rose-500" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-amber-900">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 text-base">
                      <FaHeartbeat />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold leading-tight">
                        With Health Problems
                      </h3>
                      <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                        Sensitive & At-Risk Groups
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200/60">
                    Special Precautions
                  </span>
                </div>

                <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100/70">
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {tipResult?.withHealthProblems}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <MdOutlineHealthAndSafety className="text-amber-500 text-sm shrink-0" />
                <span>
                  Crucial for asthma, COPD, heart disease, elderly, and children in {stationMetrics.stationName}.
                </span>
              </div>
            </div>
          </div>

          {/* --- Specific Pollutant Countermeasure Pill --- */}
          {tipResult?.dominantPollutantAdvisory && (
            <div className="bg-slate-100/80 rounded-xl p-3.5 border border-slate-200/70 flex items-start sm:items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 text-xs font-bold">
                💡
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium flex-1">
                <strong className="text-slate-900 font-bold mr-1">
                  {stationMetrics.dominantPollutant} Action Item:
                </strong>
                {tipResult.dominantPollutantAdvisory}
              </p>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <IoSparkles className="text-emerald-500" />
              {isLoading ? (
                <span className="text-emerald-600 font-bold animate-pulse">
                  Gemini AI refining insights...
                </span>
              ) : tipResult?.isFallback ? (
                "Standard EPA Real-Time Guidance"
              ) : (
                "Dynamic Gemini AI Analysis"
              )}
            </span>
            <span>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
