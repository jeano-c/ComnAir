import React, { useEffect, useState } from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket";
import { MdOutlineAutoAwesome } from "react-icons/md";

export default function AiAutomationToggle() {
  const { getAiSetting, toggleAiSetting, socket } = useReadingsSocket();
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      const data: any = await getAiSetting();
      if (data) setIsAiEnabled(data.isEnabled);
      setIsLoading(false);
    };
    loadSetting();

    socket.on("aiSettingUpdated", (newStatus: boolean) => {
      setIsAiEnabled(newStatus);
    });

    return () => {
      socket.off("aiSettingUpdated");
    };
  }, [socket]);

  const handleToggle = async () => {
    const newStatus = !isAiEnabled;
    setIsAiEnabled(newStatus);
    await toggleAiSetting(newStatus);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 mb-6 animate-pulse flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-7 w-12 bg-slate-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 transition-all">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
          <MdOutlineAutoAwesome className="text-xl" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Automated AI Broadcasts
            </h3>
            {isAiEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Manual Approval
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            When enabled, Gemini AI automatically synthesizes real-time sensor
            spikes and pushes safety warnings directly to mobile users without
            manual intervention.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-checked={isAiEnabled}
          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            isAiEnabled ? "bg-[#1F8F22]" : "bg-slate-300"
          }`}
        >
          <span className="sr-only">Toggle AI Automation</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isAiEnabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
