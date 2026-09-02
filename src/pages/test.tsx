import AqiNotifications from "../components/AqiNotifications";
import SpikeDrawer from "../components/SpikeDrawer";
import { useReadingsSocket } from "../hooks/useReadingsSocket";

export function Dashboard() {
  const { createReading, latestReading, latestAlert } = useReadingsSocket();

  // 1. Button to set a baseline of GOOD air (All sensors connected)
  const sendGoodAir = async () => {
    try {
      await createReading({
        pm25: 12.5,
        co: 1.2,
        o3: 0.035,
        so2: 15.0,
        no2: 22.0,
        deviceId: "dev-laptop-01",
        locationId: 1,
      });
      console.log("Sent all sensors online reading.");
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Button to simulate PM2.5 disconnected (gives out nothing)
  const sendDisconnectedPM25 = async () => {
    try {
      await createReading({
        pm25: null as any, // Gives nothing
        co: 2.1,
        o3: 0.04,
        so2: 12.0,
        no2: 18.0,
        deviceId: "dev-laptop-01",
        locationId: 1,
      });
      console.log("Sent PM2.5 disconnected reading.");
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Button to simulate CO & SO2 disconnected (gives out 0)
  const sendDisconnectedCOandSO2 = async () => {
    try {
      await createReading({
        pm25: 14.0,
        co: 0, // Gives 0
        o3: 0.045,
        so2: 0, // Gives 0
        no2: 25.0,
        deviceId: "dev-laptop-01",
        locationId: 1,
      });
      console.log("Sent CO & SO2 disconnected reading.");
    } catch (error) {
      console.error(error);
    }
  };

  // 4. Button to simulate a sudden HAZARDOUS spike
  const sendBadAir = async () => {
    try {
      await createReading({
        pm25: 250, // PM2.5 of 250 = AQI of 400 (Hazardous)
        co: 15,
        o3: 0.15,
        so2: 350,
        no2: 600,
        deviceId: "dev-laptop-01",
        locationId: 1,
      });
      console.log("Sent Bad Air reading.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Air Quality & Sensor Diagnostics Test Panel</h1>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={sendGoodAir}
          style={{ padding: "10px 14px", cursor: "pointer", backgroundColor: "#e8f5e9", border: "1px solid green", borderRadius: "6px", fontWeight: "bold" }}
        >
          🟢 1. All Sensors Online
        </button>

        <button
          onClick={sendDisconnectedPM25}
          style={{ padding: "10px 14px", cursor: "pointer", backgroundColor: "#fff3e0", border: "1px solid #f57c00", borderRadius: "6px", fontWeight: "bold" }}
        >
          ⚠️ 2. PM2.5 Disconnected (Null)
        </button>

        <button
          onClick={sendDisconnectedCOandSO2}
          style={{ padding: "10px 14px", cursor: "pointer", backgroundColor: "#fce4ec", border: "1px solid #c2185b", borderRadius: "6px", fontWeight: "bold" }}
        >
          🔴 3. CO & SO2 Disconnected (Value: 0)
        </button>

        <button
          onClick={sendBadAir}
          style={{ padding: "10px 14px", cursor: "pointer", backgroundColor: "#ffebee", border: "1px solid red", borderRadius: "6px", fontWeight: "bold" }}
        >
          🚨 4. Send Spike (Hazardous)
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
