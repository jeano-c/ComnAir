import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowDropDown, MdOutlineFileDownload } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { LineChart } from "@mui/x-charts/LineChart";

const locations = [
  {
    id: 1,
    name: "PLV MAIN CAMPUS",
    status: "Active",
    isOnline: true,
    aqiScore: 45,
    lastUpdated: "1 hour ago",
  },
  {
    id: 2,
    name: "PLV ANNEX CAMPUS",
    status: "Offline",
    isOnline: false,
    aqiScore: "--",
    lastUpdated: "5 hours ago",
  },
];

function Home() {
  const [expandedId, setExpandedId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expandedLocationId");
      if (saved !== null) {
        return saved === "null" ? null : parseInt(saved, 10);
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem("expandedLocationId", expandedId === null ? "null" : expandedId.toString());
  }, [expandedId]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col min-h-screen">
      
      {/* --- Action Row --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">Overview</h1>

        <button className="bg-[#1F8F22] cursor-pointer hover:bg-[#1a7a1d] text-white px-4 py-2 rounded-md font-medium text-sm transition flex items-center gap-2 shadow-sm active:scale-95 duration-150 w-full sm:w-auto justify-center">
          <FaPlus /> Add Location
        </button>
      </div>

      {/* --- Location Cards List --- */}
      <div className="flex flex-col gap-4">
        {locations.map((location) => {
          const isExpanded = expandedId === location.id;

          return (
            <div
              key={location.id}
              className={`flex flex-col w-full rounded-2xl p-4 sm:p-5 transition-colors duration-300 ${
                isExpanded
                  ? "bg-white border-2 border-[#1F8F22]/40 shadow-xl"
                  : "bg-[linear-gradient(270deg,rgba(146,146,146,0.7)_0%,rgba(31,143,34,0.7)_64%,rgba(9,70,10,0.7)_100%)] backdrop-blur-sm border-2 border-white/90 shadow-lg shadow-[#1F8F22]/40 hover:shadow-[#1F8F22]/60"
              }`}
            >
              <div
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full cursor-pointer gap-4 lg:gap-0"
                onClick={() => toggleExpand(location.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${location.isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></span>
                    <span className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${isExpanded ? "text-gray-500" : "text-white"}`}>
                      {location.status}
                    </span>
                  </div>
                  <h2 className={`text-base sm:text-lg font-bold tracking-wide transition-colors duration-300 ${isExpanded ? "text-gray-900" : "text-white"}`}>
                    {location.name}
                  </h2>
                </div>

                <div className="flex items-center flex-wrap gap-2 sm:gap-4 w-full lg:w-auto">
                  <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-colors duration-300 ${isExpanded ? "bg-[#1F8F22] text-white" : "bg-transparent border border-white text-white"}`}>
                    {location.aqiScore} AQI
                  </div>

                  <div className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-md font-medium border transition-colors duration-300 ${isExpanded ? "bg-white border-gray-300 text-gray-700" : "bg-white border-transparent text-gray-600"}`}>
                    {isExpanded ? "1 hour ago" : `Last updated: ${location.lastUpdated}`}
                    {isExpanded && <MdArrowDropDown className="inline ml-1" />}
                  </div>

                  <div className="flex gap-1 ml-auto">
                    <button className={`p-1 rounded transition-colors duration-300 ${isExpanded ? "text-gray-500 hover:bg-gray-100" : "text-white hover:bg-black/10"}`}>
                      <span className="text-xl">⋮</span>
                    </button>

                    <button className={`p-1 rounded transition-colors duration-300 ${isExpanded ? "text-gray-500 hover:bg-gray-100" : "text-white hover:bg-black/10"}`}>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-center">
                        <IoIosArrowForward className="text-xl" />
                      </motion.div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content Area */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="w-full mt-4 flex flex-col pt-2">
                      <hr className="w-full h-px bg-gray-200 border-none mb-6" />

                      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 w-full">
                        <div className="flex-1 flex flex-col gap-6">
                          <div className="w-full sm:w-48 border border-[#e2e8f0] rounded-xl p-4 shadow-sm bg-white flex flex-col relative">
                            <MdOutlineFileDownload className="absolute top-4 right-4 text-gray-400 text-xl cursor-pointer hover:text-[#1F8F22]" />
                            <span className="text-xs font-semibold text-gray-400 mb-1">PM10</span>
                            <span className="text-3xl font-bold text-[#1e293b]">55</span>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs font-bold text-[#1F8F22] bg-green-50 px-2 py-0.5 rounded-md">↗ +15%</span>
                              <span className="text-xs text-[#6366f1] hover:underline cursor-pointer font-medium">View Report</span>
                            </div>
                          </div>

                          <div className="w-full border border-[#e2e8f0] rounded-xl p-4 sm:p-6 shadow-sm bg-white min-h-75 sm:min-h-87.5">
                            <h3 className="font-bold text-sm text-gray-700 mb-4">Air Quality Index</h3>
                            <div className="h-62.5 sm:h-75 w-full">
                              <LineChart
                                xAxis={[{ data: [1, 2, 3, 5, 8, 10, 12, 14] }]}
                                series={[{ data: [20, 55, 30, 80, 150, 60, 40, 90], color: "#6366f1", area: false, showMark: true }]}
                                margin={{ top: 10, bottom: 30, left: 30, right: 10 }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 gap-4 sm:gap-6">
                          <span className="text-sm font-semibold text-gray-700 text-center">Export AQI Data (PDF/CSV)</span>
                          <button className="bg-[#1F8F22] hover:bg-[#1a7a1d] text-white px-6 py-3 rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg active:scale-95 duration-150 w-full sm:w-auto">
                            Add Air Quality Analyzer
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Home;