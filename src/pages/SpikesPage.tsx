import React, { useEffect, useState } from "react";
import { useReadingsSocket } from "../hooks/useReadingsSocket";
import AiAutomationToggle from "../components/AiAutomationToggle"; // Adjust this path!

export default function AnnouncementsPage() {
  const [spikes, setSpikes] = useState<any[]>([]);

  const { fetchAqiSpikes, latestSpike, broadcastAnnouncement } =
    useReadingsSocket();

  // Form State
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [selectedSpikeId, setSelectedSpikeId] = useState<number | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    loadSpikes();
  }, [latestSpike]);

  const loadSpikes = async () => {
    const data: any = await fetchAqiSpikes();
    if (data && !data.error) {
      setSpikes(data);
    }
  };

  const handleAlertClick = (spike: any) => {
    setAnnouncementTitle(
      `Alert: ${spike.location?.name || `Location ${spike.locationId}`}`,
    );
    setAnnouncementMessage(
      `Automated advisory for ${spike.location?.name || `Location ${spike.locationId}`}. ${spike.message}`,
    );
    setSelectedSpikeId(spike.id || null);
  };

  const handleBroadcast = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      alert("Please enter a title and message before broadcasting.");
      return;
    }

    setIsBroadcasting(true);

    const payload = {
      title: announcementTitle,
      message: announcementMessage,
      priority: "High", // Hardcoded to high since we removed the buttons
      aqiSpikeId: selectedSpikeId,
    };

    try {
      const response: any = await broadcastAnnouncement(payload);

      if (response?.error) {
        alert("Failed to broadcast: " + response.error);
      } else {
        alert("Success! Announcement saved and pushed to mobile devices.");
        setAnnouncementTitle("");
        setAnnouncementMessage("");
        setSelectedSpikeId(null);
      }
    } catch (error) {
      alert("An unexpected error occurred while broadcasting.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfa] flex font-sans text-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="p-10 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Alerts & Announcements
            </h1>
            <p className="text-gray-500 text-sm">
              Manage and broadcast critical air quality updates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Active Alerts */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Active Alerts</h3>
                {/* View All removed */}
              </div>

              {spikes.length === 0 ? (
                <p className="text-sm text-gray-500">No active alerts.</p>
              ) : (
                spikes.map((spike, idx) => (
                  <div
                    key={spike.id || idx}
                    onClick={() => handleAlertClick(spike)}
                    className={`bg-white p-5 rounded-2xl shadow-sm border cursor-pointer transition-colors ${
                      selectedSpikeId === spike.id
                        ? "border-[#1a9347] ring-1 ring-[#1a9347]"
                        : "border-gray-100 hover:border-[#1a9347]/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-gray-400">
                        {new Date(spike.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {spike.location?.name || `Location ${spike.locationId}`}
                    </h4>
                    <p className="text-sm text-gray-500">{spike.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Forms & Recent */}
            <div className="lg:col-span-8 flex flex-col mt-9">  
              {/* 🛑 THE NEW AI TOGGLE COMPONENT 🛑 */}
              <AiAutomationToggle />

              {/* Create Announcement Form */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6">Create Announcement</h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="e.g., Weekend Air Quality Advisory"
                      className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1a9347]/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      placeholder="Enter details..."
                      className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1a9347]/20 outline-none resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    {/* Priority buttons removed */}
                    <button
                      onClick={handleBroadcast}
                      disabled={isBroadcasting}
                      className={`px-8 py-3 text-white text-sm font-semibold rounded-full shadow-sm transition-colors ${
                        isBroadcasting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#1a9347] hover:bg-[#157a3b]"
                      }`}
                    >
                      {isBroadcasting ? "Broadcasting..." : "Broadcast"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
