import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../api/socket"; // Adjust path to where your socket instance is

export function useReadingsSocket() {
  const queryClient = useQueryClient();

  // Existing state
  const [latestReading, setLatestReading] = useState<any>(null);
  const [latestAlert, setLatestAlert] = useState<any>(null);

  // NEW State
  const [latestSpike, setLatestSpike] = useState<any>(null);
  const [systemNotification, setSystemNotification] = useState<any>(null);

  useEffect(() => {
    socket.connect();

    socket.on("onNewReading", (newReading) => {
      console.log("Real-time reading received:", newReading);
      setLatestReading(newReading);
      queryClient.invalidateQueries({ queryKey: ["readings"] });
    });

    socket.on("sensorAlert", (alertData) => {
      console.warn(
        `[${alertData.level}] ${alertData.type} ALERT:`,
        alertData.message,
      );
      setLatestAlert(alertData);
    });

    socket.on("aqiSpikeAlert", (spikeData) => {
      console.warn("Sudden AQI Spike Detected:", spikeData);
      setLatestSpike(spikeData);
    });

    socket.on("systemNotification", (notification) => {
      console.log("System Notification Received:", notification);
      setSystemNotification(notification);
    });

    return () => {
      socket.off("onNewReading");
      socket.off("sensorAlert");
      socket.off("aqiSpikeAlert");
      socket.off("systemNotification");
      socket.disconnect();
    };
  }, [queryClient]);

  const createReading = (data: any) => {
    return new Promise((resolve, reject) => {
      socket.emit("createReading", data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  };

  const findAllReadings = () => {
    return new Promise((resolve) => {
      socket.emit("findAllReadings", (data: any) => resolve(data));
    });
  };

  const removeReading = (id: number) => {
    return new Promise((resolve) => {
      socket.emit("removeReading", id, (data: any) => resolve(data));
    });
  };

  const fetchAqiSpikes = () => {
    return new Promise((resolve) => {
      socket.emit("getAqiSpikes", (data: any) => resolve(data));
    });
  };

  const broadcastAnnouncement = (payload: {
    title: string;
    message: string;
    priority: string;
    aqiSpikeId?: number | null;
  }) => {
    return new Promise((resolve) => {
      socket.emit("broadcastAnnouncement", payload, (response: any) =>
        resolve(response),
      );
    });
  };

  // --- 🛑 NEW: AI TOGGLE FUNCTIONS ---
  const getAiSetting = () => {
    return new Promise((resolve) => {
      socket.emit("getAiSetting", (response: any) => resolve(response));
    });
  };

  const toggleAiSetting = (enable: boolean) => {
    return new Promise((resolve) => {
      socket.emit("toggleAiSetting", enable, (response: any) =>
        resolve(response),
      );
    });
  };

  const clearSystemNotification = () => setSystemNotification(null);
  const clearLatestSpike = () => setLatestSpike(null);

  return {
    socket,
    createReading,
    findAllReadings,
    removeReading,
    fetchAqiSpikes,
    broadcastAnnouncement,
    getAiSetting, // <-- Exported
    toggleAiSetting, // <-- Exported
    clearSystemNotification,
    clearLatestSpike,
    latestReading,
    latestAlert,
    latestSpike,
    systemNotification,
  };
}
