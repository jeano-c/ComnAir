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
  const [latestSensorStatusAlert, setLatestSensorStatusAlert] = useState<any>(null);
  const [latestDeviceAlert, setLatestDeviceAlert] = useState<any>(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);

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

    socket.on("sensorStatusAlert", (statusAlert) => {
      console.warn(
        `[${statusAlert.level}] SENSOR STATUS ALERT:`,
        statusAlert.message,
      );
      setLatestSensorStatusAlert(statusAlert);
    });

    socket.on("deviceStatusChanged", (deviceAlert) => {
      console.warn(
        `[${deviceAlert.status}] GATEWAY DEVICE ALERT:`,
        deviceAlert.message,
      );
      setLatestDeviceAlert(deviceAlert);
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    });

    socket.on("aqiSpikeAlert", (spikeData) => {
      console.warn("Sudden AQI Spike Detected:", spikeData);
      setLatestSpike(spikeData);
    });

    socket.on("systemNotification", (notification) => {
      console.log("System Notification Received:", notification);
      setSystemNotification(notification);
    });

    socket.on("announcementCreated", (announcement) => {
      setLatestAnnouncement(announcement);
    });

    return () => {
      socket.off("onNewReading");
      socket.off("sensorAlert");
      socket.off("sensorStatusAlert");
      socket.off("deviceStatusChanged");
      socket.off("aqiSpikeAlert");
      socket.off("systemNotification");
      socket.off("announcementCreated");
      // Keep socket alive across component navigations
    };
  }, [queryClient]);

  const createReading = (data: any) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve({ error: "Request timed out" });
      }, 5000);
      if (!socket.connected) socket.connect();
      socket.emit("createReading", data, (response: any) => {
        clearTimeout(timer);
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
      const timer = setTimeout(() => resolve([]), 3000);
      if (!socket.connected) socket.connect();
      socket.emit("findAllReadings", (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  const removeReading = (id: number) => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ error: "Timed out" }), 3000);
      if (!socket.connected) socket.connect();
      socket.emit("removeReading", id, (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  const fetchAqiSpikes = () => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve([]), 2500);
      if (!socket.connected) socket.connect();
      socket.emit("getAqiSpikes", (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  const fetchAnnouncements = () => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve([]), 2500);
      if (!socket.connected) socket.connect();
      socket.emit("getAnnouncements", (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  const broadcastAnnouncement = (payload: {
    title: string;
    message: string;
    priority: string;
    aqiSpikeId?: number | null;
  }) => {
    return new Promise((resolve) => {
      const timer = setTimeout(
        () => resolve({ error: "Broadcast request timed out" }),
        5000,
      );
      if (!socket.connected) socket.connect();
      socket.emit("broadcastAnnouncement", payload, (response: any) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  };

  // --- 🛑 NEW: AI TOGGLE FUNCTIONS ---
  const getAiSetting = () => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ isEnabled: false }), 2500);
      if (!socket.connected) socket.connect();
      socket.emit("getAiSetting", (response: any) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  };

  const toggleAiSetting = (enable: boolean) => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ success: false }), 3500);
      if (!socket.connected) socket.connect();
      socket.emit("toggleAiSetting", enable, (response: any) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  };

  const clearSystemNotification = () => setSystemNotification(null);
  const clearLatestSpike = () => setLatestSpike(null);
  const clearLatestSensorStatusAlert = () => setLatestSensorStatusAlert(null);
  const clearLatestDeviceAlert = () => setLatestDeviceAlert(null);

  return {
    socket,
    createReading,
    findAllReadings,
    removeReading,
    fetchAqiSpikes,
    fetchAnnouncements,
    broadcastAnnouncement,
    getAiSetting, // <-- Exported
    toggleAiSetting, // <-- Exported
    clearSystemNotification,
    clearLatestSpike,
    clearLatestSensorStatusAlert,
    clearLatestDeviceAlert,
    latestReading,
    latestAlert,
    latestSpike,
    latestSensorStatusAlert,
    latestDeviceAlert,
    latestAnnouncement,
    systemNotification,
  };
}
