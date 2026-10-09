import React, { useState } from "react";
import {
  IoBookOutline,
  IoHardwareChipOutline,
  IoDocumentTextOutline,
  IoMegaphoneOutline,
  IoOpenOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoListOutline,
} from "react-icons/io5";

export default function AdminManual() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState(false);

  const modbusCode = `const devices = {
  o3: createModbusDevice("192.168.1.80", 32783, "O3 (.80)"),
  no: createModbusDevice("192.168.1.40", 32783, "NO (.40)"),
  so2: createModbusDevice("192.168.1.10", 32783, "SO2 (.10)"),
};`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(modbusCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const tabs = [
    { id: "all", label: "All Content", icon: <IoListOutline className="text-base" /> },
    { id: "sensors", label: "Setting up Sensors", icon: <IoHardwareChipOutline className="text-base" /> },
    { id: "reports", label: "Report/Complaint Set up", icon: <IoDocumentTextOutline className="text-base" /> },
    { id: "broadcast", label: "Broadcast Announcement", icon: <IoMegaphoneOutline className="text-base" /> },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-12 min-h-screen bg-[#fafafa] font-sans">
      {/* Title Header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <IoBookOutline className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              ADMIN MANUAL
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              A guide in using ComnAir, an Air Quality Monitoring Web App · October 2026
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap shadow-2xs ${
                activeTab === tab.id
                  ? "bg-[#1F8F22] text-white shadow-md shadow-[#1F8F22]/20 font-bold"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12 max-w-5xl mx-auto">
        {/* ======================================================== */}
        {/* TABLE OF CONTENTS CARD                                   */}
        {/* ======================================================== */}
        {activeTab === "all" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <IoListOutline className="text-emerald-600" />
              TABLE OF CONTENTS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2.5">
                <div className="font-bold text-gray-900 border-b border-gray-100 pb-1">
                  Setting up Sensors
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("sensors")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Sensor's Set up Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sensors")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Add a Location of Sensor</span>
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-gray-900 border-b border-gray-100 pb-1">
                  Report/Complaint Set up
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Add a Category of Complaint</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Edit Category of Complaint</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Delete a Category of Complaint</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Reply to a Report</span>
                </button>

                <div className="font-bold text-gray-900 border-b border-gray-100 pb-1 pt-2">
                  Broadcast Announcement
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("broadcast")}
                  className="w-full text-left pl-3 text-gray-600 hover:text-emerald-700 hover:underline flex justify-between py-1 cursor-pointer"
                >
                  <span>Broadcast Announcement Setup</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: SETTING UP SENSORS                            */}
        {/* ======================================================== */}
        {(activeTab === "all" || activeTab === "sensors") && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-gray-200/80 shadow-xs space-y-10">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Section 1
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-3">Setting up Sensors</h2>
            </div>

            {/* Sub-section: Sensor's Set up Guide */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Sensor's Set up Guide
              </h3>

              {/* Step 1 */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Download and review the provided sensor manuals for instructions on operating and configuring the sensor.
                  </p>
                </div>

                {/* 5 QR Codes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
                  {/* PM2.5 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    <img
                      src="/manual-images/page_3_img_3.png"
                      alt="PM2.5 Manual QR Code"
                      className="w-24 h-24 object-contain mb-3 bg-white p-1 rounded-lg border border-gray-100"
                    />
                    <span className="font-extrabold text-xs text-gray-900 mb-1">PM2.5</span>
                    <a
                      href="https://metone.com/wp-content/uploads/2020/02/E-FRM-DC-9800-Rev-B.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline break-all inline-flex items-center gap-1 font-semibold"
                    >
                      <span>PDF Manual</span>
                      <IoOpenOutline />
                    </a>
                  </div>

                  {/* Serinus 50 (SO2) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    <img
                      src="/manual-images/page_3_img_4.png"
                      alt="Serinus 50 (SO2) QR Code"
                      className="w-24 h-24 object-contain mb-3 bg-white p-1 rounded-lg border border-gray-100"
                    />
                    <span className="font-extrabold text-xs text-gray-900 mb-1">Serinus 50 (SO₂)</span>
                    <a
                      href="https://fixturlaser.com/wp-content/uploads/2023/05/M010029-Serinus-50-SO2-User-Manual-2.2.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline break-all inline-flex items-center gap-1 font-semibold"
                    >
                      <span>PDF Manual</span>
                      <IoOpenOutline />
                    </a>
                  </div>

                  {/* Serinus 40 (Ox) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    <img
                      src="/manual-images/page_3_img_5.png"
                      alt="Serinus 40 (Ox) QR Code"
                      className="w-24 h-24 object-contain mb-3 bg-white p-1 rounded-lg border border-gray-100"
                    />
                    <span className="font-extrabold text-xs text-gray-900 mb-1">Serinus 40 (Ox)</span>
                    <a
                      href="https://fixturlaser.com/wp-content/uploads/2023/05/ECOTECH-Serinus-40-NOx-User-Manual-3.3-M010028.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline break-all inline-flex items-center gap-1 font-semibold"
                    >
                      <span>PDF Manual</span>
                      <IoOpenOutline />
                    </a>
                  </div>

                  {/* Serinus 30 (CO) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    <img
                      src="/manual-images/page_3_img_6.png"
                      alt="Serinus 30 (CO) QR Code"
                      className="w-24 h-24 object-contain mb-3 bg-white p-1 rounded-lg border border-gray-100"
                    />
                    <span className="font-extrabold text-xs text-gray-900 mb-1">Serinus 30 (CO)</span>
                    <a
                      href="https://cdn.bfldr.com/Q3Z2TZY7/as/7kmx8h2nxjbbpvcp5qm469xk/Serinus_30"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline break-all inline-flex items-center gap-1 font-semibold"
                    >
                      <span>PDF Manual</span>
                      <IoOpenOutline />
                    </a>
                  </div>

                  {/* Serinus 10 (O3) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    <img
                      src="/manual-images/page_3_img_7.png"
                      alt="Serinus 10 (O3) QR Code"
                      className="w-24 h-24 object-contain mb-3 bg-white p-1 rounded-lg border border-gray-100"
                    />
                    <span className="font-extrabold text-xs text-gray-900 mb-1">Serinus 10 (O₃)</span>
                    <a
                      href="https://fixturlaser.com/wp-content/uploads/2023/05/M010026-Serinus-10-O3-User-Manual-2.2.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline break-all inline-flex items-center gap-1 font-semibold"
                    >
                      <span>PDF Manual</span>
                      <IoOpenOutline />
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p className="font-medium leading-relaxed">
                      Before connecting the sensor to the system, configure the sensor's network settings using the provided sensor manual.
                    </p>
                    <ul className="list-none space-y-1.5 pl-4 text-gray-700">
                      <li className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 text-xs">i.</span>
                        <span>Open the Network Adaptor Menu.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 text-xs">ii.</span>
                        <span>Set the instrument to Read IP.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 text-xs">iii.</span>
                        <span>Configure the IP Address, Netmask, and Gateway according to your network configuration.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Place the sensor near the router and make sure the Ethernet cable is long enough to reach the router.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_4_img_3.jpg"
                    alt="Place sensor near the router"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-72 object-contain"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Connect one end of the Ethernet cable to the sensor and the other to the router.
                  </p>
                </div>
                <div className="pl-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <img
                    src="/manual-images/page_4_img_4.jpg"
                    alt="Connect Ethernet cable to sensor"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-60 w-full object-cover"
                  />
                  <img
                    src="/manual-images/page_4_img_5.jpg"
                    alt="Connect Ethernet cable to router"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-60 w-full object-cover"
                  />
                </div>
              </div>

              {/* Step 5 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    5
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Connect the laptop to the same router as the sensor.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_4_img_6.jpg"
                    alt="Connect laptop to same router"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-72 object-contain"
                  />
                </div>
              </div>

              {/* Step 6 */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    6
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    On the laptop, open Command Prompt and ping the sensor using the IP address configured in Step 2. Verify that the sensor responds to the ping to confirm that it is properly connected to the network.
                  </p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    7
                  </span>
                  <div className="space-y-3 text-sm text-gray-800 w-full">
                    <p className="font-medium leading-relaxed">
                      If the sensor connection is successful, clone the server code from the provided repository:{" "}
                      <a
                        href="https://github.com/jeano-c/server-code"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        https://github.com/jeano-c/server-code
                        <IoOpenOutline />
                      </a>
                    </p>
                    <ul className="list-none space-y-2 pl-4 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 text-xs mt-0.5">i.</span>
                        <span>Follow the instructions provided in the repository's README to install and configure the server.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 text-xs mt-0.5">ii.</span>
                        <span>When configuring the server, make sure the sensor IP addresses match the IP addresses configured in Step 2.</span>
                      </li>
                      <li className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-emerald-600 text-xs mt-0.5">iii.</span>
                          <span>In the server code, update the device configuration with the corresponding IP addresses of the sensors. For example:</span>
                        </div>
                        {/* Code Block */}
                        <div className="relative bg-[#0f172a] text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto shadow-inner ml-5">
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-sans font-semibold text-slate-300 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCode ? <IoCheckmarkOutline className="text-emerald-400" /> : <IoCopyOutline />}
                            <span>{copiedCode ? "Copied" : "Copy"}</span>
                          </button>
                          <pre>{modbusCode}</pre>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 text-xs mt-0.5">iv.</span>
                        <span>Replace the example IP addresses with the actual IP addresses assigned to your sensors during the network configuration in Step 2.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 8 */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    8
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    If all setup and configuration steps are completed successfully, the server should begin receiving and sending sensor readings continuously, as shown in the example below.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-section: Add a Location of Sensor */}
            <div className="space-y-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Add a Location of Sensor
              </h3>

              {/* Add Location Step 1 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Click the Add Location button at the top right of the screen
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_5_img_3.jpg"
                    alt="Click Add Location button"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Add Location Step 2 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Enter the location name you want to add and pinpoint the location on the map by clicking the desired location or adjusting the map pin to correct position. Click the Add Location when done.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_6_img_3.jpg"
                    alt="Pinpoint location on map"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Add Location Step 3 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Verify the added location. The newly added location should now be displayed on the Home Page.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_6_img_4.jpg"
                    alt="Verify newly added location on Home Page"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: REPORT / COMPLAINT SET UP                     */}
        {/* ======================================================== */}
        {(activeTab === "all" || activeTab === "reports") && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-gray-200/80 shadow-xs space-y-10">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Section 2
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-3">Report/Complaint Set up</h2>
            </div>

            {/* Sub-section: Add a Category of Complaint */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Add a Category of Complaint
              </h3>

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Categories help organize and identify the type of issue or concern being reported. To add a category that users can select when submitting a report, click the Add New Category.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_7_img_3.jpg"
                    alt="Click Add New Category"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Enter the category you want and click Create.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_7_img_4.jpg"
                    alt="Enter category and click Create"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Edit Category of Complaint */}
            <div className="space-y-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Edit Category of Complaint
              </h3>

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Changes made to the category will be reflected when users select a category while submitting a report. To edit category, find the category you want to edit and click the pencil icon located on top right of it.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_8_img_3.jpg"
                    alt="Click pencil icon to edit category"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-60 object-contain"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Update the category name as needed. And click the save changes
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_8_img_4.jpg"
                    alt="Update category name and click save changes"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Verify the changes. The updated category should be displayed in the category list and available for users when submitting a report.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_8_img_5.jpg"
                    alt="Verify updated category in list"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Delete a Category of Complaint */}
            <div className="space-y-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Delete a Category of Complaint
              </h3>

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Delete an existing category that is no longer needed. To delete a category, find the category you want to delete and click the trash icon located on top right of it.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_9_img_3.jpg"
                    alt="Click trash icon to delete category"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-60 object-contain"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Confirm it by clicking “Yes, Delete”
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_9_img_4.jpg"
                    alt="Confirm delete modal"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Reply to a Report */}
            <div className="space-y-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Reply to a Report
              </h3>

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Respond to a user's report by providing an explanation, resolution, or additional information regarding the reported concern. Read the report details and understand the concern.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_10_img_3.jpg"
                    alt="Read report details and understand concern"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Select the appropriate status for the report, such as Pending, Resolved, or other available statuses
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_10_img_4.png"
                    alt="Select status dropdown"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    In the Reply to User text box, enter the appropriate response or explanation regarding the report, and click the Submit Resolution to submit the reply to the report.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_11_img_3.jpg"
                    alt="Enter response and click Submit Resolution"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    Check the Activity History section to confirm that the response and status update have been recorded.
                  </p>
                </div>
                <div className="pl-9">
                  <img
                    src="/manual-images/page_11_img_4.jpg"
                    alt="Confirm activity history recorded"
                    className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: BROADCAST ANNOUNCEMENT                        */}
        {/* ======================================================== */}
        {(activeTab === "all" || activeTab === "broadcast") && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-gray-200/80 shadow-xs space-y-10">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Section 3
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-3">Broadcast Announcement</h2>
            </div>

            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  This creates and sends announcements to notify citizens about air quality conditions, sensor alerts, emergencies, and other important advisories. Select the New Broadcast located at the top right corner.
                </p>
              </div>
              <div className="pl-9">
                <img
                  src="/manual-images/page_12_img_3.jpg"
                  alt="Select New Broadcast button"
                  className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-2 text-sm text-gray-800">
                  <p className="font-medium leading-relaxed">
                    Select the advisory priority and the quick advisory template if applicable, such as AQI Spike Warning, High Ozone Alert, Hazardous Emergency, or All Clear Notice.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 mt-2">
                    <p className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                      Choose the appropriate priority level:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs sm:text-sm">
                      <li>
                        <strong className="text-gray-900">Standard</strong> – for general announcements or normal air-quality updates.
                      </li>
                      <li>
                        <strong className="text-gray-900">High</strong> – for important air-quality warnings that require attention.
                      </li>
                      <li>
                        <strong className="text-gray-900">Emergency</strong> – for urgent situations that require immediate attention.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="pl-9">
                <img
                  src="/manual-images/page_12_img_4.jpg"
                  alt="Compose New Broadcast priority and templates"
                  className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  Enter the advisory title. Provide a short and descriptive title for the announcement.
                </p>
              </div>
              <div className="pl-9">
                <img
                  src="/manual-images/page_13_img_3.jpg"
                  alt="Enter advisory title and message"
                  className="rounded-2xl border border-gray-200 shadow-xs max-h-80 object-contain"
                />
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  Check the Live Mobile Lock-Screen Preview to see how the announcement will appear on users' mobile devices. Then click the Send Broadcast to successfully send notification or announcement on users.
                </p>
              </div>
              <div className="pl-9">
                <img
                  src="/manual-images/page_13_img_4.png"
                  alt="Live mobile lock-screen preview"
                  className="rounded-2xl border border-gray-200 shadow-xs max-h-60 object-contain"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
