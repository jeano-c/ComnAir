import { useEffect, useState } from "react";
import { socket } from "../api/socket"; // Adjust this path if necessary

export function useDashboardSocket() {
  const [overviewData, setOverviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // 1. Fetch initial dashboard data as soon as the component mounts
    // Because we return the data directly from the gateway method,
    // Socket.io lets us handle it via a callback here.
    socket.emit("getDashboardData", (response: any) => {
      setOverviewData(response);
      setIsLoading(false);
    });

    // 2. Listen for real-time broadcasts whenever ANY device pushes a reading
    socket.on("dashboardUpdated", (updatedData) => {
      console.log("Dashboard overview updated in real-time");
      setOverviewData(updatedData);
    });

    // Cleanup: Remove the listener when the component unmounts
    return () => {
      socket.off("dashboardUpdated");
      // Note: We don't call socket.disconnect() here because you likely
      // want the socket to stay alive as the user navigates your app.
    };
  }, []);

  return {
    overviewData,
    isLoading,
  };
}
