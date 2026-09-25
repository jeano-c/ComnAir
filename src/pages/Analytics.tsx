import React, { useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { useLocations, useLocationHistory } from "../hooks/useLocation";

const chartMargin = { top: 20, bottom: 28, left: 48, right: 24 };

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
      tickLabelStyle: { fill: "#9ca3af", fontSize: 11 },
    },
  ];

  const chartYAxis = useMemo(() => {
    if (!seriesData.length) {
      return [
        {
          min: 0,
          max: 100,
          tickLabelStyle: { fill: "#9ca3af", fontSize: 11 },
        },
      ];
    }
    const maxVal = Math.max(...seriesData);
    // Add headroom (at least 30 AQI or 15%) rounded up to nearest 50 so peaks never clip top edge
    const calculatedMax =
      Math.ceil((maxVal + Math.max(30, maxVal * 0.15)) / 50) * 50;
    return [
      {
        min: 0,
        max: Math.max(calculatedMax, 100),
        tickLabelStyle: { fill: "#9ca3af", fontSize: 11 },
      },
    ];
  }, [seriesData]);

  const SERIES_DATA = [
    {
      data: seriesData.length ? seriesData : [0],
      color: "#6366f1",
      curve: "monotoneX" as const,
      showMark: true,
    },
  ];

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-gray-800">
            {location.name} - Air Quality Index
          </h3>
          <span className="text-xs text-gray-400">
            {xAxisData.length > 0
              ? `${xAxisData.length} records analyzed`
              : "No historical records"}
          </span>
        </div>
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100 self-start sm:self-auto">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
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

      <div className="h-[230px] sm:h-[260px] w-full">
        {isHistoryLoading ? (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <LineChart
            xAxis={chartXAxis}
            yAxis={chartYAxis}
            series={SERIES_DATA}
            margin={chartMargin}
            height={250}
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
    <div className="w-full min-h-full flex flex-col bg-[#f8fafc] p-4 sm:p-6 md:p-8 pb-28 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
          Overview
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Historical air quality index trends and sensor telemetry by location
        </p>
      </div>

      {isLocationsLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 font-medium">
          Loading locations...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {locations?.data?.map((loc: any) => (
            <AQIChartCard key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Analytics;
