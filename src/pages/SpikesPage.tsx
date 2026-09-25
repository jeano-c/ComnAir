import React, { useEffect, useState, useMemo } from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket";
import AiAutomationToggle from "../components/AiAutomationToggle";
import {
  IoMegaphoneOutline,
  IoClose,
  IoSparklesOutline,
  IoSearchOutline,
} from "react-icons/io5";
import {
  FiSend,
  FiClock,
  FiMapPin,
  FiEdit3,
  FiMessageSquare,
  FiPlus,
  FiEye,
} from "react-icons/fi";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaBell,
} from "react-icons/fa";
import { MdOutlineAutoAwesome, MdOutlineHistory, MdShowChart } from "react-icons/md";

const TEMPLATES = [
  {
    label: "AQI Spike Warning",
    title: "Elevated AQI Warning: Unhealthy Air Detected",
    message:
      "Air quality levels have surged to unhealthy thresholds. Sensitive groups, children, and the elderly should avoid prolonged outdoor exposure.",
    priority: "High",
  },
  {
    label: "High Ozone Alert",
    title: "Ground-Level Ozone Advisory",
    message:
      "High concentrations of ozone measured by local sensor nodes. Limit strenuous outdoor activities during peak afternoon hours.",
    priority: "High",
  },
  {
    label: "Hazardous Emergency",
    title: "CRITICAL: Hazardous Air Quality Alert",
    message:
      "Extremely hazardous particulate matter concentrations detected. Stay indoors, seal doors and windows, and wear N95/KN95 masks if travel is necessary.",
    priority: "Emergency",
  },
  {
    label: "All Clear Notice",
    title: "Air Quality Normal: Safe Outdoors",
    message:
      "Air quality measurements have returned to standard baseline levels across all monitored zones.",
    priority: "Standard",
  },
];

const PRIORITIES = [
  {
    id: "Standard",
    label: "Standard",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    activeClass: "bg-blue-600 text-white border-blue-600 shadow-xs",
  },
  {
    id: "High",
    label: "High",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    activeClass: "bg-amber-500 text-white border-amber-500 shadow-xs",
  },
  {
    id: "Emergency",
    label: "Emergency",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    activeClass: "bg-rose-600 text-white border-rose-600 shadow-xs",
  },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [spikes, setSpikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    fetchAnnouncements,
    fetchAqiSpikes,
    latestAnnouncement,
    latestSpike,
    broadcastAnnouncement,
  } = useReadingsSocket();

  // Modal State for New Broadcast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailBroadcast, setDetailBroadcast] = useState<any | null>(null);

  // Form State inside Modal
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [selectedSpikeId, setSelectedSpikeId] = useState<number | null>(null);
  const [priority, setPriority] = useState<string>("High");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Filter State for History
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Initial fetch for announcements history and active spikes
  useEffect(() => {
    loadAnnouncements();
    loadSpikes();
  }, []);

  // Listen for live announcements from socket
  useEffect(() => {
    if (latestAnnouncement) {
      setAnnouncements((prev) => [
        latestAnnouncement,
        ...prev.filter((a) => a.id !== latestAnnouncement.id),
      ]);
    }
  }, [latestAnnouncement]);

  useEffect(() => {
    if (latestSpike) {
      loadSpikes();
    }
  }, [latestSpike]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadAnnouncements = async () => {
    // 1. Immediately read from localStorage cache so the UI renders right away
    const saved = localStorage.getItem("comnair_broadcast_history");
    let hasCache = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAnnouncements(parsed);
          hasCache = true;
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error reading cached broadcast history:", e);
      }
    }

    try {
      if (typeof fetchAnnouncements === "function") {
        const data: any = await fetchAnnouncements();
        if (data && Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
          localStorage.setItem(
            "comnair_broadcast_history",
            JSON.stringify(data),
          );
        } else if (!hasCache && Array.isArray(data)) {
          setAnnouncements([]);
        }
      }
    } catch (err) {
      console.error("Failed to load announcements from server:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpikes = async () => {
    const data: any = await fetchAqiSpikes();
    if (data && !data.error && Array.isArray(data)) {
      setSpikes(data);
    }
  };

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
    setAnnouncementTitle(template.title);
    setAnnouncementMessage(template.message);
    setPriority(template.priority);
  };

  const handleOpenModalWithSpike = (spike: any) => {
    setAnnouncementTitle(
      `Alert: ${spike.location?.name || `Location ${spike.locationId}`}`,
    );
    setAnnouncementMessage(
      `Automated advisory for ${spike.location?.name || `Location ${spike.locationId}`}. ${spike.message}`,
    );
    setSelectedSpikeId(spike.id);
    setPriority(
      spike.level === "HAZARDOUS"
        ? "Emergency"
        : spike.level === "VERY_UNHEALTHY"
        ? "High"
        : "Standard",
    );
    setIsModalOpen(true);
  };

  const handleClearForm = () => {
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setSelectedSpikeId(null);
    setPriority("High");
  };

  const handleBroadcast = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setToast({
        type: "error",
        message: "Please enter both a title and message before broadcasting.",
      });
      return;
    }

    setIsBroadcasting(true);

    const payload = {
      title: announcementTitle.trim(),
      message: announcementMessage.trim(),
      priority: priority,
      aqiSpikeId: selectedSpikeId || undefined,
    };

    try {
      const response: any = await broadcastAnnouncement(payload);

      if (response?.error) {
        setToast({
          type: "error",
          message: "Failed to broadcast: " + response.error,
        });
      } else {
        const createdAnnouncement = response?.announcement || {
          id: Date.now(),
          title: payload.title,
          message: payload.message,
          priority: payload.priority,
          createdAt: new Date().toISOString(),
          aqiSpikeId: payload.aqiSpikeId,
          aqiSpike: selectedSpikeId
            ? spikes.find((s) => s.id === selectedSpikeId)
            : null,
        };

        setAnnouncements((prev) => {
          const updated = [
            createdAnnouncement,
            ...prev.filter((a) => a.id !== createdAnnouncement.id),
          ];
          localStorage.setItem(
            "comnair_broadcast_history",
            JSON.stringify(updated),
          );
          return updated;
        });

        setToast({
          type: "success",
          message: "Success! New notification broadcasted to all citizens.",
        });

        handleClearForm();
        setIsModalOpen(false);
      }
    } catch (error: any) {
      setToast({
        type: "error",
        message:
          error?.message || "An unexpected error occurred while broadcasting.",
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filtered broadcast history
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.aqiSpike?.location?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === "All" ||
        item.priority?.toLowerCase() === priorityFilter.toLowerCase() ||
        (priorityFilter === "AI" && Boolean(item.aqiSpikeId));

      return matchesSearch && matchesPriority;
    });
  }, [announcements, searchQuery, priorityFilter]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <div className="p-4 sm:p-6 md:p-10 flex-1 overflow-y-auto">
        {/* --- Top Notification Toast --- */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="text-emerald-600 text-lg shrink-0 mt-0.5" />
            ) : (
              <FaExclamationTriangle className="text-rose-600 text-lg shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
              aria-label="Dismiss toast"
            >
              <IoClose className="text-lg" />
            </button>
          </div>
        )}

        {/* --- Header Section with Primary "+ New Broadcast" CTA --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#1F8F22] shadow-2xs">
              <IoMegaphoneOutline className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Broadcast Announcements
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Audit log of all public notifications & emergency advisories sent to citizens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                handleClearForm();
                setIsModalOpen(true);
              }}
              className="bg-[#1F8F22] hover:bg-[#176e19] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>New Broadcast</span>
            </button>
          </div>
        </div>

        {/* --- AI Automation Control Banner --- */}
        <AiAutomationToggle />

        {/* --- Active Spikes Quick Bar (if any ongoing spikes exist) --- */}
        {spikes.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <MdShowChart className="text-lg" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  {spikes.length} Active Sensor Spike Events Detected
                </h4>
                <p className="text-[11px] text-amber-700">
                  Need to send an alert for an ongoing surge? You can launch a targeted broadcast directly.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {spikes.slice(0, 3).map((spike) => (
                <button
                  key={spike.id}
                  type="button"
                  onClick={() => handleOpenModalWithSpike(spike)}
                  className="text-xs font-semibold bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-200/90 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FiMapPin className="text-[10px] text-amber-600" />
                  <span>{spike.location?.name || `Spike #${spike.id}`}</span>
                  <span className="text-[10px] font-bold text-amber-700">
                    (+{Math.round(spike.jump)} AQI)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Filter & Search Toolbar --- */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search broadcast title or message..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#1F8F22] focus:ring-2 focus:ring-[#1F8F22]/20 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {["All", "Emergency", "High", "Standard", "AI"].map((filter) => {
              const isActive = priorityFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPriorityFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {filter === "AI" ? "AI Automated" : filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Broadcast History List --- */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium animate-pulse">
              Loading broadcast history...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                <MdOutlineHistory className="text-3xl" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No Broadcasts Found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                {searchQuery || priorityFilter !== "All"
                  ? "No broadcasts match your search filters. Try clearing the filter."
                  : "No public notifications have been sent yet. Click 'New Broadcast' to dispatch an official alert to mobile users."}
              </p>
              <button
                type="button"
                onClick={() => {
                  handleClearForm();
                  setIsModalOpen(true);
                }}
                className="mt-5 bg-[#1F8F22] hover:bg-[#176e19] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <FiPlus className="text-sm" />
                <span>Send New Broadcast</span>
              </button>
            </div>
          ) : (
            filteredAnnouncements.map((item) => {
              const isEmergency =
                item.priority === "Emergency" || item.priority === "Critical";
              const isHigh = item.priority === "High";

              const badgeClass = isEmergency
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : isHigh
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200";

              const accentBorder = isEmergency
                ? "border-l-rose-500"
                : isHigh
                ? "border-l-amber-500"
                : "border-l-blue-500";

              const isAiTriggered = Boolean(item.aqiSpikeId);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-slate-200/80 border-l-4 ${accentBorder} p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col gap-3.5`}
                >
                  {/* Top Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}
                      >
                        {item.priority || "Standard"}
                      </span>

                      {isAiTriggered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <MdOutlineAutoAwesome className="text-xs text-emerald-600" />
                          AI Auto-Advisory
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                          <IoMegaphoneOutline className="text-xs text-slate-500" />
                          Manual Broadcast
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <FiClock className="text-[11px] text-slate-400" />
                      <span>{formatDate(item.createdAt || item.timestamp)}</span>
                    </div>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-[11px]">
                        <FaCheckCircle className="text-[10px] text-emerald-600" />
                        Delivered to Registered Mobile Users
                      </span>

                      {item.aqiSpike?.location?.name && (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                          <FiMapPin className="text-slate-400 text-xs" />
                          <span>Location: {item.aqiSpike.location.name}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailBroadcast(item)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <FiEye className="text-xs" />
                      <span>View Push Mockup</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================= */}
        {/* MODAL: Compose New Broadcast                               */}
        {/* ========================================================= */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1F8F22] flex items-center justify-center shrink-0">
                    <IoMegaphoneOutline className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Compose New Broadcast
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send an official emergency advisory to citizen mobile apps
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Advisory Priority
                  </label>
                  <div className="flex items-center gap-2">
                    {PRIORITIES.map((p) => {
                      const isActive = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? p.activeClass
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Templates */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <IoSparklesOutline className="text-emerald-600" />
                    Quick Advisory Templates
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((tmpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyTemplate(tmpl)}
                        className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input: Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FiEdit3 className="text-slate-400" />
                      Advisory Title
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {announcementTitle.length}/80
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="e.g., Weekend Air Quality Advisory"
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#1F8F22] focus:ring-2 focus:ring-[#1F8F22]/20 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Input: Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FiMessageSquare className="text-slate-400" />
                      Broadcast Message Body
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {announcementMessage.length}/300
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={300}
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Enter detailed safety precautions and guidance for citizens..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#1F8F22] focus:ring-2 focus:ring-[#1F8F22]/20 outline-none resize-none transition-all placeholder:text-slate-400 leading-relaxed"
                  ></textarea>
                </div>

                {/* Live Mobile Push Preview inside Modal */}
                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FaBell className="text-slate-400 text-xs" />
                    Live Mobile Lock-Screen Preview
                  </span>
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-lg border border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#1F8F22] flex items-center justify-center text-white text-[9px] font-black">
                          CA
                        </div>
                        <span className="text-xs font-semibold text-slate-300">
                          ComnAir Safety Alert
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            priority === "Emergency"
                              ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                              : priority === "High"
                              ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                              : "bg-blue-500/30 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {priority}
                        </span>
                        <span className="text-[10px] text-slate-400">Now</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mb-1">
                      {announcementTitle.trim() ||
                        "Weekend Air Quality Advisory"}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {announcementMessage.trim() ||
                        "Preview message text will be displayed here for citizens on their mobile devices."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleBroadcast}
                  disabled={isBroadcasting}
                  className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 ${
                    isBroadcasting
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-[#1F8F22] hover:bg-[#176e19] shadow-[#1F8F22]/20"
                  }`}
                >
                  <FiSend className="text-sm" />
                  <span>
                    {isBroadcasting ? "Sending Broadcast..." : "Send Broadcast"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: View Sent Broadcast Push Mockup                    */}
        {/* ========================================================= */}
        {detailBroadcast && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Delivered Mobile Notification
                </h3>
                <button
                  type="button"
                  onClick={() => setDetailBroadcast(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-4.5 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#1F8F22] flex items-center justify-center text-white text-[9px] font-black">
                        CA
                      </div>
                      <span className="text-xs font-semibold text-slate-300">
                        ComnAir Safety Alert
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(
                        detailBroadcast.createdAt || detailBroadcast.timestamp,
                      )}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mb-1.5">
                    {detailBroadcast.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {detailBroadcast.message}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Priority: {detailBroadcast.priority || "High"}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <FaCheckCircle className="text-[9px]" /> Delivered
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailBroadcast(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


