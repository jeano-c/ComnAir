import AqiNotifications from "../components/AqiNotifications";
import SpikeDrawer from "../components/SpikeDrawer";
import { useReadingsSocket } from "../hooks/useReadingsSocket";

export function Dashboard() {
  const { createReading, latestReading, latestAlert } = useReadingsSocket();

  // 1. Button to set a baseline of GOOD air
  const sendGoodAir = async () => {
    try {
      await createReading({
        pm25: 5, // PM2.5 of 5 = AQI of 50 (Good)
        co: 1,
        deviceId: "your-device-id", // ⚠️ CHANGE THIS TO A VALID ID IN YOUR DB
        locationId: 1,              // ⚠️ CHANGE THIS TO A VALID ID IN YOUR DB
      });
      console.log("Sent Good Air reading.");
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Button to simulate a sudden HAZARDOUS spike
  const sendBadAir = async () => {
    try {
      await createReading({
        pm25: 250, // PM2.5 of 250 = AQI of 400 (Hazardous)
        co: 15,
        deviceId: "your-device-id", // ⚠️ CHANGE THIS TO A VALID ID IN YOUR DB
        locationId: 1,              // ⚠️ CHANGE THIS TO A VALID ID IN YOUR DB
      });
      console.log("Sent Bad Air reading.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Air Quality Dashboard</h1>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={sendGoodAir}
          style={{ padding: "10px", cursor: "pointer", backgroundColor: "#e8f5e9", border: "1px solid green", borderRadius: "4px", fontWeight: "bold" }}
        >
          1. Send GOOD Air (AQI 50)
        </button>

        <button
          onClick={sendBadAir}
          style={{ padding: "10px", cursor: "pointer", backgroundColor: "#ffebee", border: "1px solid red", borderRadius: "4px", fontWeight: "bold" }}
        >
          2. Send BAD Air (AQI 400)
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1, padding: "10px", border: "2px solid red", borderRadius: "8px" }}>
          <h3 style={{ color: "red", marginTop: 0 }}>🚨 Latest Background Alert</h3>
          {latestAlert ? (
            <pre style={{ overflowX: "auto", fontSize: "14px" }}>
              {JSON.stringify(latestAlert, null, 2)}
            </pre>
          ) : (
            <p>No alerts triggered yet...</p>
          )}
        </div>

        <div style={{ flex: 1, padding: "10px", border: "2px solid green", borderRadius: "8px" }}>
          <h3 style={{ color: "green", marginTop: 0 }}>📊 Latest Reading</h3>
          {latestReading ? (
            <pre style={{ overflowX: "auto", fontSize: "14px" }}>
              {JSON.stringify(latestReading, null, 2)}
            </pre>
          ) : (
            <p>Waiting for sensor data...</p>
          )}
        </div>
      </div>

      {/* Make sure isAdmin is true so you can see the broadcast prompt! */}
      <AqiNotifications isAdmin={true} />
      <SpikeDrawer /> 
    </div>
  );
}
