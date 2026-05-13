import React, { useEffect, useState } from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket"; // Make sure path is correct!

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

  if (isLoading)
    return (
      <div className="text-sm text-gray-500 mb-8">Loading AI status...</div>
    );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between mb-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          Automated AI Advisories
          {isAiEnabled && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          When enabled, AI will automatically draft and broadcast push
          notifications when severe AQI spikes are detected.
        </p>
      </div>

      <button
        onClick={handleToggle}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors duration-200 ease-in-out ${
          isAiEnabled ? "bg-[#1a9347]" : "bg-gray-200"
        }`}
      >
        <span className="sr-only">Toggle AI Automation</span>
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isAiEnabled ? "translate-x-3" : "-translate-x-3"
          }`}
        />
      </button>
    </div>
  );
}
