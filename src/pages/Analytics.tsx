import React, { useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { useLocations, useLocationHistory } from "../hooks/useLocation";

const chartMargin = { top: 10, bottom: 20, left: 30, right: 10 };

type PeriodType = "day" | "week" | "month" | "year";

const AQIChartCard = React.memo(({ location }: { location: any }) => {
  const [timeRange, setTimeRange] = useState<PeriodType>("week");

  const ranges: { label: string; value: PeriodType }[] = [
    { label: "1D", value: "day" },
    { label: "1W", value: "week" },
    { label: "1M", value: "month" },
    { label: "1Y", value: "year" },
  ];

  const { historyData, isHistoryLoading } = useLocationHistory(
    location.id,
    timeRange,
  );

  const { xAxisData, seriesData } = useMemo(() => {
    if (!historyData || !historyData.data || !historyData.data.history) {
      return { xAxisData: [], seriesData: [] };
    }

    const rawHistory = historyData.data.history;

    // Format timestamp based on the period
    const formattedXAxis = rawHistory.map((pt: any) => {
      const date = new Date(pt.timestamp);
      if (timeRange === "day") {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (timeRange === "year") {
        return date.toLocaleDateString([], { month: "short" });
      }
      return date.toLocaleDateString([], { month: "2-digit", day: "2-digit" });
    });

    const aqiData = rawHistory.map((pt: any) => pt.aqi);

    return { xAxisData: formattedXAxis, seriesData: aqiData };
  }, [historyData, timeRange]);

  const chartXAxis = [
    {
      scaleType: "point" as const,
      data: xAxisData.length ? xAxisData : ["No Data"],
      tickLabelStyle: { fill: "#9ca3af", fontSize: 10 },
    },
  ];

  const SERIES_DATA = [
    {
      data: seriesData.length ? seriesData : [0],
      color: "#6366f1",
      curve: "natural" as const,
      showMark: true,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 pb-20 sm:p-6 shadow-sm flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h3 className="font-bold text-sm text-gray-800">
          {location.name} - Air Quality Index
        </h3>
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100 self-start sm:self-auto">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 ${
                timeRange === range.value
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-50 sm:h-62.5 w-full">
        {isHistoryLoading ? (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <LineChart
            xAxis={chartXAxis}
            series={SERIES_DATA}
            margin={chartMargin}
            hideLegend
          />
        )}
      </div>
    </div>
  );
});

function Analytics() {
  const { locations, isLocationsLoading } = useLocations();

  return (
    <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
          Overview
        </h1>
      </div>

      {isLocationsLoading ? (
        <div className="text-gray-500">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 pb-20">
          {locations?.data?.map((loc: any) => (
            <AQIChartCard key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Analytics;
