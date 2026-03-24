import React, { useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";

const chartMargin = { top: 10, bottom: 20, left: 30, right: 10 };
const chartXAxis = [
  {
    scaleType: "point" as const,
    data: ["8/04", "9/04", "10/04", "11/04", "12/04", "13/04", "14/04"],
    tickLabelStyle: { fill: "#9ca3af", fontSize: 10 },
  },
];

const SERIES_DATA = [
  {
    data: [20, 55, 30, 80, 150, 60, 40],
    color: "#6366f1",
    curve: "natural" as const,
    showMark: true,
  },
];
const AQIChartCard = React.memo(() => {
  const [timeRange, setTimeRange] = useState("1M");
  const ranges = ["1D", "1W", "1M", "6M", "1Y"];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h3 className="font-bold text-sm text-gray-800">Air Quality Index</h3>
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100 self-start sm:self-auto">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 ${
                timeRange === range
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-50 sm:h-62.5 w-full">
        <LineChart
          xAxis={chartXAxis}
          series={SERIES_DATA}
          margin={chartMargin}
          hideLegend
        />
      </div>

      {/* <div className="flex items-center justify-center gap-4 mt -4 text-[10px] font-medium text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
          Money Income
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-black"></span>
          Current State
        </div>
      </div> */}
    </div>
  );
});

function Analytics() {
  return (
    <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
          Overview
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AQIChartCard />
        <AQIChartCard />
        <AQIChartCard />
        <AQIChartCard />
      </div>
    </div>
  );
}

export default Analytics;
