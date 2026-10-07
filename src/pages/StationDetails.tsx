import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  IoChevronBack,
  IoCalendarOutline,
  IoChevronDown,
} from "react-icons/io5";
import { MdMoreVert } from "react-icons/md";
import { LuDownload } from "react-icons/lu";
import { jsPDF } from "jspdf";
import { socket } from "../api/socket";
import { location as locationApi } from "../api/location";
import {
  calculatePM25AQI,
  calculateSO2AQI,
  calculateCOAQI,
  calculateO3AQI,
  calculateNO2AQI,
  calculateOverallAQI,
  getAqiCategory,
} from "../utils/aqiCalculations";

// Pollutants configuration
const SENSOR_METRICS = [
  { key: "pm25", label: "PM 2.5", fullName: "Fine Particulate Matter", unit: "µg/m³", decimals: 1 },
  { key: "so2", label: "SO2", fullName: "Sulfur Dioxide", unit: "ppb", decimals: 2 },
  { key: "co", label: "CO", fullName: "Carbon Monoxide", unit: "ppm", decimals: 3 },
  { key: "o3", label: "O3", fullName: "Ozone", unit: "ppm", decimals: 4 },
  { key: "no2", label: "NO2", fullName: "Nitrogen Dioxide", unit: "ppb", decimals: 2 },
] as const;

type PollutantKey = (typeof SENSOR_METRICS)[number]["key"];

// Chart metric options
const CHART_METRICS = [
  { key: "aqi", label: "Overall AQI", unit: "AQI" },
  { key: "pm25", label: "PM 2.5", unit: "µg/m³" },
  { key: "so2", label: "SO2", unit: "ppb" },
  { key: "co", label: "CO", unit: "ppm" },
  { key: "o3", label: "O3", unit: "ppm" },
  { key: "no2", label: "NO2", unit: "ppb" },
] as const;

type ChartMetricKey = (typeof CHART_METRICS)[number]["key"];

// Date format helper
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Smooth and resample sparkline values to avoid crowded, messy spikes when data is dense
function processSparklineData(rawValues: number[], targetPoints = 32): number[] {
  if (rawValues.length <= targetPoints) return rawValues;

  const bucketSize = rawValues.length / targetPoints;
  const result: number[] = [];

  for (let i = 0; i < targetPoints; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.min(rawValues.length, Math.floor((i + 1) * bucketSize));
    const slice = rawValues.slice(start, end);

    if (slice.length === 0) {
      result.push(rawValues[Math.min(start, rawValues.length - 1)]);
    } else {
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const max = Math.max(...slice);
      // Blend average and peak so trends and spikes remain visible without jitter
      result.push(avg * 0.75 + max * 0.25);
    }
  }

  // 3-point weighted smoothing filter
  return result.map((val, idx, arr) => {
    if (idx === 0) return (val * 2 + (arr[1] ?? val)) / 3;
    if (idx === arr.length - 1) return ((arr[idx - 1] ?? val) + val * 2) / 3;
    return (arr[idx - 1] + val * 2 + arr[idx + 1]) / 4;
  });
}

// Generate smooth SVG sparkline path that stretches across the card
function generateSparkline(
  rawValues: number[],
  width = 300,
  height = 50
): { pathD: string; areaD: string } {
  const baseMid = height / 2;
  if (!rawValues.length) {
    return {
      pathD: `M 0 ${baseMid} L ${width} ${baseMid}`,
      areaD: `M 0 ${baseMid} L ${width} ${baseMid} L ${width} ${height} L 0 ${height} Z`,
    };
  }

  // Cleanly downsample if many data points are present
  const values = processSparklineData(rawValues, 30);

  if (values.length === 1) {
    return {
      pathD: `M 0 ${baseMid} L ${width} ${baseMid}`,
      areaD: `M 0 ${baseMid} L ${width} ${baseMid} L ${width} ${height} L 0 ${height} Z`,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const paddingY = 6;
  const usableHeight = height - paddingY * 2;

  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = ((prev.x + curr.x) / 2).toFixed(1);
    d += ` C ${cx} ${prev.y.toFixed(1)}, ${cx} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const areaD = `${d} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;

  return { pathD: d, areaD };
}

export default function StationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routeLocation = useLocation();

  // Parse station ID from route (or fallback)
  const stationId = useMemo(() => {
    const parsed = id ? parseInt(id, 10) : NaN;
    return !isNaN(parsed) ? parsed : 5;
  }, [id]);

  // Real data states from database/socket
  const [dashboardOverview, setDashboardOverview] = useState<any[]>([]);
  const [rawReadings, setRawReadings] = useState<any[]>([]);
  const [stationInfo, setStationInfo] = useState<any>(routeLocation.state?.location || null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected chart metric (AQI or specific pollutant)
  const [selectedChartMetric, setSelectedChartMetric] = useState<ChartMetricKey>("aqi");

  // Date and Range Dropdown State (Real current date)
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedRange, setSelectedRange] = useState<string>("Today");
  const [dateLabel, setDateLabel] = useState<string>(formatDate(today));

  // Dropdown visibility
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  // Calendar month view initialized to current month
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const calendarRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  // 1. Fetch live data from backend socket & API
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // Get live dashboard overview (has live sensorHealth, fallbackSensors, gateway)
    socket.emit("getDashboardData", (overview: any) => {
      if (Array.isArray(overview)) {
        setDashboardOverview(overview);
      }
    });

    // Get all historical readings from database
    socket.emit("findAllReadings", (readings: any) => {
      if (Array.isArray(readings)) {
        setRawReadings(readings);
      }
      setIsLoading(false);
    });

    // Listen for live readings streamed by hardware or fallback
    const handleNewReading = (newReading: any) => {
      setRawReadings((prev) => [newReading, ...prev]);
    };

    // Listen for dashboard overview updates
    const handleDashboardUpdated = (updatedOverview: any) => {
      if (Array.isArray(updatedOverview)) {
        setDashboardOverview(updatedOverview);
      }
    };

    socket.on("onNewReading", handleNewReading);
    socket.on("dashboardUpdated", handleDashboardUpdated);

    // Fetch station metadata via HTTP as fallback
    locationApi
      .getLocationById(stationId)
      .then((data: any) => {
        if (data?.data) {
          setStationInfo((prev: any) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});

    return () => {
      socket.off("onNewReading", handleNewReading);
      socket.off("dashboardUpdated", handleDashboardUpdated);
    };
  }, [stationId]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (calendarRef.current && !calendarRef.current.contains(target)) {
        setIsCalendarOpen(false);
      }
      if (rangeRef.current && !rangeRef.current.contains(target)) {
        setIsRangeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Identify the active station
  const activeStation = useMemo(() => {
    // Match in overview data
    const found = dashboardOverview.find((loc) => loc.id === stationId);
    if (found) return found;

    // Route state fallback
    if (stationInfo && stationInfo.id === stationId) return stationInfo;

    // Fallback to first station in overview if ID not found
    if (dashboardOverview.length > 0) return dashboardOverview[0];

    return {
      id: stationId,
      name: stationInfo?.name || "Valenzuela City",
      gateway: { id: "esp_32", isOnline: false },
    };
  }, [dashboardOverview, stationId, stationInfo]);

  const resolvedStationId = activeStation.id || stationId;
  const stationName = activeStation.name || "Monitoring Station";

  // 3. Filter readings for this specific station, sorted chronologically
  const stationReadings = useMemo(() => {
    const filtered = rawReadings.filter(
      (r) => Number(r.locationId) === Number(resolvedStationId)
    );
    return filtered.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [rawReadings, resolvedStationId]);

  // 4. Identify all unique dates that have recordings in the database
  const datesWithData = useMemo(() => {
    const dateSet = new Set<string>();
    stationReadings.forEach((r) => {
      if (r.timestamp) {
        const d = new Date(r.timestamp);
        if (!isNaN(d.getTime())) {
          dateSet.add(d.toDateString());
        }
      }
    });
    return dateSet;
  }, [stationReadings]);

  // 5. Filter readings based on active date / range selection
  const filteredReadings = useMemo(() => {
    if (!stationReadings.length) return [];

    if (selectedRange === "Today") {
      const todayString = today.toDateString();
      const todayMatches = stationReadings.filter(
        (r) => new Date(r.timestamp).toDateString() === todayString
      );
      if (todayMatches.length > 0) {
        return todayMatches;
      }
      // If no telemetry today, take the most recent day's readings
      const lastReading = stationReadings[stationReadings.length - 1];
      const lastDayString = new Date(lastReading.timestamp).toDateString();
      return stationReadings.filter(
        (r) => new Date(r.timestamp).toDateString() === lastDayString
      );
    }

    if (selectedRange === "Last 7 Days") {
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
      return stationReadings.filter((r) => new Date(r.timestamp) >= cutoff);
    }

    if (selectedRange === "Last 30 Days") {
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - 30);
      cutoff.setHours(0, 0, 0, 0);
      return stationReadings.filter((r) => new Date(r.timestamp) >= cutoff);
    }

    if (selectedRange === "All Time") {
      return stationReadings;
    }

    // Custom single date selected
    const selectedString = selectedDate.toDateString();
    return stationReadings.filter(
      (r) => new Date(r.timestamp).toDateString() === selectedString
    );
  }, [stationReadings, selectedRange, selectedDate, today]);

  // Check if active view is "Today" (real-time mode)
  const isTodayActive = useMemo(() => {
    if (selectedRange === "Today") return true;
    if (
      selectedRange === "Custom" &&
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    ) {
      return true;
    }
    return false;
  }, [selectedRange, selectedDate, today]);

  // Compute daily / period averages for each pollutant on past dates
  const pollutantAverages = useMemo(() => {
    const source = filteredReadings.length > 0 ? filteredReadings : stationReadings;
    if (!source.length) return null;

    const sums: Record<string, { sum: number; count: number }> = {
      pm25: { sum: 0, count: 0 },
      so2: { sum: 0, count: 0 },
      co: { sum: 0, count: 0 },
      o3: { sum: 0, count: 0 },
      no2: { sum: 0, count: 0 },
    };

    source.forEach((r) => {
      SENSOR_METRICS.forEach((sensor) => {
        const val = r[sensor.key];
        if (typeof val === "number" && !isNaN(val)) {
          sums[sensor.key].sum += val;
          sums[sensor.key].count += 1;
        }
      });
    });

    const avgs: Record<string, number | null> = {};
    SENSOR_METRICS.forEach((sensor) => {
      avgs[sensor.key] = sums[sensor.key].count > 0 ? sums[sensor.key].sum / sums[sensor.key].count : null;
    });

    return avgs;
  }, [filteredReadings, stationReadings]);

  // Latest snapshot reading
  const latestSnapshotReading = useMemo(() => {
    if (filteredReadings.length > 0) {
      return filteredReadings[filteredReadings.length - 1];
    }
    if (stationReadings.length > 0) {
      return stationReadings[stationReadings.length - 1];
    }
    return null;
  }, [filteredReadings, stationReadings]);

  // Active pollutant data: For Today = Latest Reading; For Past Date / Range = Daily Average
  const effectivePollutantData = useMemo(() => {
    if (isTodayActive) {
      return {
        isAverage: false,
        modeLabel: "Current",
        values: latestSnapshotReading || {},
      };
    } else {
      return {
        isAverage: true,
        modeLabel: selectedRange === "Custom" ? "Daily Avg" : `${selectedRange} Avg`,
        values: pollutantAverages || {},
      };
    }
  }, [isTodayActive, latestSnapshotReading, pollutantAverages, selectedRange]);

  // Overall AQI for the effective reading or daily average
  const overallAQI = useMemo(() => {
    if (!effectivePollutantData.values) return 0;
    return calculateOverallAQI(effectivePollutantData.values);
  }, [effectivePollutantData]);

  // Handle Range Selection
  const handleSelectRange = (range: string) => {
    setSelectedRange(range);
    setIsRangeOpen(false);

    if (range === "Today") {
      setDateLabel(formatDate(today));
      setSelectedDate(today);
    } else if (range === "Last 7 Days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setDateLabel(`${formatDate(past)} - ${formatDate(today)}`);
    } else if (range === "Last 30 Days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setDateLabel(`${formatDate(past)} - ${formatDate(today)}`);
    } else if (range === "All Time") {
      if (stationReadings.length > 0) {
        const earliest = new Date(stationReadings[0].timestamp);
        setDateLabel(`${formatDate(earliest)} - ${formatDate(today)}`);
      } else {
        setDateLabel(`All Time`);
      }
    }
  };

  // Handle Single Date Click in Calendar
  const handleSelectCalendarDate = (date: Date) => {
    setSelectedDate(date);
    setDateLabel(formatDate(date));
    setIsCalendarOpen(false);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      setSelectedRange("Today");
    } else {
      setSelectedRange("Custom");
    }
  };

  // Generate Calendar Days for popup
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [calendarMonth]);

  // Export to PDF with real database values
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header banner
    doc.setFillColor(31, 143, 34);
    doc.rect(0, 0, 210, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ComnAir Environmental Monitoring Report", 14, 14);

    // Station & Meta details
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text(`Station: ${stationName}`, 14, 34);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const isAvg = effectivePollutantData.isAverage;
    doc.text(`Reporting Period: ${dateLabel} (${selectedRange})`, 14, 42);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 48);
    doc.text(
      `Hardware Gateway ID: ${activeStation.gateway?.id || "esp_32"} | Status: ${
        activeStation.status || "OFFLINE"
      }`,
      14,
      54
    );
    doc.text(
      `Metric Mode: ${isAvg ? "Daily Average (24h Mean Concentration)" : "Live Telemetry Snapshot (Latest)"} | Points: ${filteredReadings.length}`,
      14,
      60
    );

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 64, 196, 64);

    // Pollutant Metrics Table Header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Pollutant", 14, 73);
    doc.text(isAvg ? "Daily Avg Concentration" : "Real Concentration", 60, 73);
    doc.text("Sub-AQI", 115, 73);
    doc.text("EPA Category", 140, 73);
    doc.text("Data Source", 170, 73);

    doc.line(14, 76, 196, 76);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = 84;
    SENSOR_METRICS.forEach((sensor) => {
      const val = effectivePollutantData.values[sensor.key];
      const numVal = typeof val === "number" ? val : null;

      let subAQI = 0;
      if (numVal !== null) {
        if (sensor.key === "pm25") subAQI = calculatePM25AQI(numVal);
        else if (sensor.key === "so2") subAQI = calculateSO2AQI(numVal);
        else if (sensor.key === "co") subAQI = calculateCOAQI(numVal);
        else if (sensor.key === "o3") subAQI = calculateO3AQI(numVal);
        else if (sensor.key === "no2") subAQI = calculateNO2AQI(numVal);
      }

      const cat = getAqiCategory(subAQI);
      const isFallback =
        activeStation.sensorHealth?.[sensor.key]?.source === "OPEN_METEO_FALLBACK" ||
        activeStation.fallbackSensors?.includes(sensor.key);

      const sourceStr =
        numVal === null
          ? "Offline"
          : isFallback
          ? "Satellite Fallback"
          : "Hardware Sensor";

      doc.setTextColor(30, 41, 59);
      doc.text(sensor.label, 14, y);
      doc.text(
        numVal !== null ? `${numVal.toFixed(sensor.decimals)} ${sensor.unit}` : "--",
        60,
        y
      );
      doc.text(numVal !== null ? `${subAQI}` : "--", 115, y);

      if (cat.label === "Hazardous" || cat.label === "Very Unhealthy") {
        doc.setTextColor(159, 18, 57);
      } else if (cat.label.includes("Unhealthy")) {
        doc.setTextColor(234, 88, 12);
      } else {
        doc.setTextColor(22, 163, 74);
      }
      doc.text(cat.label, 140, y);

      doc.setTextColor(100, 116, 139);
      doc.text(sourceStr, 170, y);

      y += 10;
    });

    doc.line(14, y, 196, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Overall Station Air Quality Index: ${overallAQI} AQI`, 14, y);
    y += 6;

    const overallCat = getAqiCategory(overallAQI);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Status: ${overallCat.fullName}`, 14, y);
    y += 6;
    doc.text(
      "Telemetry streamed from physical IoT gateway and verified against US EPA piece-wise linear air standards.",
      14,
      y
    );

    doc.save(`${stationName.replace(/\s+/g, "_")}_Real_Air_Report_${selectedRange}.pdf`);
  };

  // 6. Build real chart data points for the Analytics Area Line Chart (Strictly reflects active date or date range)
  const chartPoints = useMemo(() => {
    const source = filteredReadings;
    if (!source.length) return [];

    // If source is very large, sample up to 50 evenly distributed points for optimal SVG rendering
    let sampled = source;
    if (source.length > 50) {
      const step = Math.ceil(source.length / 50);
      sampled = source.filter((_, idx) => idx % step === 0 || idx === source.length - 1);
    }

    return sampled.map((r) => {
      const date = new Date(r.timestamp);
      const isMultiDay = selectedRange === "Last 7 Days" || selectedRange === "Last 30 Days" || selectedRange === "All Time";
      const timeStr = isMultiDay
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      let val = 0;
      if (selectedChartMetric === "aqi") {
        val = calculateOverallAQI(r);
      } else if (selectedChartMetric === "pm25") {
        val = Number(r.pm25) || 0;
      } else if (selectedChartMetric === "so2") {
        val = Number(r.so2) || 0;
      } else if (selectedChartMetric === "co") {
        val = Number(r.co) || 0;
      } else if (selectedChartMetric === "o3") {
        val = Number(r.o3) || 0;
      } else if (selectedChartMetric === "no2") {
        val = Number(r.no2) || 0;
      }

      return {
        timestamp: date,
        time: timeStr,
        fullTime: date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        value: Number(val),
        rawReading: r,
      };
    });
  }, [filteredReadings, stationReadings, selectedRange, selectedChartMetric]);

  // Hover state for interactive chart
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // SVG Chart Geometry
  const svgWidth = 850;
  const svgHeight = 250;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Dynamic Min & Max with clean headroom
  const { minVal, maxVal, yTicks } = useMemo(() => {
    if (!chartPoints.length) {
      return { minVal: 0, maxVal: 100, yTicks: [0, 50, 100] };
    }
    const vals = chartPoints.map((p) => p.value);
    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);

    let min = Math.max(0, Math.floor(rawMin * 0.85));
    let max = Math.ceil(rawMax * 1.2) || 10;
    if (min === max) {
      min = Math.max(0, min - 10);
      max = max + 10;
    }

    const mid = Math.round((min + max) / 2);
    return { minVal: min, maxVal: max, yTicks: [max, mid, min] };
  }, [chartPoints]);

  const pointsCoordinates = useMemo(() => {
    if (!chartPoints.length) return [];
    const count = chartPoints.length;
    return chartPoints.map((pt, i) => {
      const x = count === 1 ? paddingLeft + chartW / 2 : paddingLeft + (i / (count - 1)) * chartW;
      const y = paddingTop + chartH - ((pt.value - minVal) / (maxVal - minVal || 1)) * chartH;
      return { x, y, pt };
    });
  }, [chartPoints, chartW, chartH, minVal, maxVal]);

  const pathD = useMemo(() => {
    if (!pointsCoordinates.length) return "";
    if (pointsCoordinates.length === 1) {
      return `M ${paddingLeft} ${pointsCoordinates[0].y} L ${paddingLeft + chartW} ${pointsCoordinates[0].y}`;
    }
    let d = `M ${pointsCoordinates[0].x} ${pointsCoordinates[0].y}`;
    for (let i = 1; i < pointsCoordinates.length; i++) {
      const prev = pointsCoordinates[i - 1];
      const curr = pointsCoordinates[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [pointsCoordinates, chartW]);

  const areaD = useMemo(() => {
    if (!pointsCoordinates.length) return "";
    const baseY = paddingTop + chartH;
    if (pointsCoordinates.length === 1) {
      const y = pointsCoordinates[0].y;
      return `M ${paddingLeft} ${y} L ${paddingLeft + chartW} ${y} L ${paddingLeft + chartW} ${baseY} L ${paddingLeft} ${baseY} Z`;
    }
    const first = pointsCoordinates[0];
    const last = pointsCoordinates[pointsCoordinates.length - 1];
    return `${pathD} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }, [pathD, pointsCoordinates, chartH, paddingTop, paddingLeft, chartW]);

  const latestPoint = pointsCoordinates.length ? pointsCoordinates[pointsCoordinates.length - 1] : null;
  const activePoint = hoverIndex !== null && pointsCoordinates[hoverIndex] ? pointsCoordinates[hoverIndex] : latestPoint;

  // Active chart metric object
  const activeChartMetricObj = useMemo(() => {
    return CHART_METRICS.find((m) => m.key === selectedChartMetric) || CHART_METRICS[0];
  }, [selectedChartMetric]);

  return (
    <div className="p-6 md:p-8 lg:p-10 bg-[#f8fafc] min-h-screen font-sans flex flex-col">
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-4">
        <button
          onClick={() => navigate("/")}
          className="hover:text-emerald-600 transition flex items-center gap-1 cursor-pointer"
        >
          <IoChevronBack className="text-sm" />
          <span>Dashboard</span>
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-bold">{stationName}</span>
      </div>

      {/* 2. Title Row & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {stationName}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                activeStation.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeStation.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              {activeStation.status === "ACTIVE" ? "Live Stream Online" : "Offline Bridge"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gateway: <span className="font-mono font-medium">{activeStation.gateway?.id || "esp_32"}</span> · Total Records: {stationReadings.length}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Date Picker Button & Popup */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="bg-white border border-gray-200/90 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50 shadow-xs cursor-pointer transition"
            >
              <IoCalendarOutline className="text-sm text-gray-500" />
              <span>{dateLabel}</span>
              <IoChevronDown className="text-xs text-gray-400" />
            </button>

            {/* Interactive Calendar Dropdown */}
            {isCalendarOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 select-none">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900">
                    {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                      }
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                      }
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-2">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} />;
                    const isSelected =
                      date.getDate() === selectedDate.getDate() &&
                      date.getMonth() === selectedDate.getMonth() &&
                      date.getFullYear() === selectedDate.getFullYear();

                    // Check if this date has actual recordings in the database
                    const hasData = datesWithData.has(date.toDateString());

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => handleSelectCalendarDate(date)}
                        className={`h-8 rounded-lg flex flex-col items-center justify-center text-xs font-semibold cursor-pointer transition ${
                          isSelected
                            ? "bg-[#22c55e] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="leading-none">{date.getDate()}</span>
                        {/* Small green dot indicator below date when real database data exists */}
                        {hasData && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              isSelected ? "bg-white" : "bg-emerald-500"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Dates with recorded database telemetry</span>
                </div>
              </div>
            )}
          </div>

          {/* Range Dropdown */}
          <div className="relative" ref={rangeRef}>
            <button
              type="button"
              onClick={() => setIsRangeOpen(!isRangeOpen)}
              className="bg-white border border-gray-200/90 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50 shadow-xs cursor-pointer transition"
            >
              <span>{selectedRange}</span>
              <IoChevronDown className="text-xs text-gray-400" />
            </button>

            {isRangeOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                {["Today", "Last 7 Days", "Last 30 Days", "All Time"].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => handleSelectRange(range)}
                    className={`w-full px-4 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                      selectedRange === range
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <LuDownload className="text-sm" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Notice if displaying fallback readings */}
      {filteredReadings.length === 0 && stationReadings.length > 0 && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            No readings recorded on {dateLabel}. Showing latest recorded snapshot from{" "}
            {formatDate(new Date(latestSnapshotReading?.timestamp))}.
          </span>
          <button
            onClick={() => handleSelectRange("All Time")}
            className="underline font-bold hover:text-amber-900 cursor-pointer ml-2"
          >
            View All Time
          </button>
        </div>
      )}

      {/* 3. Sensor Cards Grid - Real data per pollutant */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {SENSOR_METRICS.map((sensor) => {
          const rawVal = effectivePollutantData.values[sensor.key];
          const numVal = typeof rawVal === "number" ? rawVal : null;

          // Real Sub-AQI
          let subAQI = 0;
          if (numVal !== null) {
            if (sensor.key === "pm25") subAQI = calculatePM25AQI(numVal);
            else if (sensor.key === "so2") subAQI = calculateSO2AQI(numVal);
            else if (sensor.key === "co") subAQI = calculateCOAQI(numVal);
            else if (sensor.key === "o3") subAQI = calculateO3AQI(numVal);
            else if (sensor.key === "no2") subAQI = calculateNO2AQI(numVal);
          }

          const cat = getAqiCategory(subAQI);
          const isFallback =
            activeStation.sensorHealth?.[sensor.key]?.source === "OPEN_METEO_FALLBACK" ||
            activeStation.fallbackSensors?.includes(sensor.key);

          // Historical readings array for this pollutant to generate real sparkline
          const sparklineValues = (filteredReadings.length > 0 ? filteredReadings : stationReadings)
            .map((r) => (typeof r[sensor.key] === "number" ? r[sensor.key] : null))
            .filter((v): v is number => v !== null);

          const { pathD: sparklinePath, areaD: sparklineArea } = generateSparkline(sparklineValues, 300, 50);

          return (
            <div
              key={sensor.key}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Header: Title, Metric Type Badge, and Sub-AQI */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  {sensor.label}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      effectivePollutantData.isAverage
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {effectivePollutantData.modeLabel}
                  </span>
                  <span className="text-xs text-gray-500 font-mono font-bold">
                    {subAQI} AQI
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 mb-3 truncate flex items-center justify-between">
                <span>{sensor.fullName}</span>
                {effectivePollutantData.isAverage && filteredReadings.length > 0 && (
                  <span className="text-[10px] text-slate-400">
                    avg of {filteredReadings.length} readings
                  </span>
                )}
              </div>

              {/* Hardware / Fallback Badge */}
              <div className="flex items-center gap-1.5 mb-4">
                {numVal === null ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Offline · Sensor Disconnected
                  </span>
                ) : isFallback ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Fallback · Open-Meteo Satellite Data
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live · Physical Hardware Sensor
                  </span>
                )}
              </div>

              {/* Capsule Banner */}
              <div className="w-full bg-[#f1f5f9] rounded-full p-1.5 flex items-center justify-between my-2 overflow-hidden">
                <div
                  className="rounded-full px-4 py-2 flex items-baseline gap-1 text-white shadow-xs"
                  style={{ backgroundColor: numVal !== null ? cat.color : "#94a3b8" }}
                >
                  <span className="text-xl font-black leading-none">
                    {numVal !== null ? numVal.toFixed(sensor.decimals) : "--"}
                  </span>
                  <span className="text-[10px] font-bold uppercase opacity-95">
                    {sensor.unit}
                  </span>
                </div>
                <div className="flex-1 text-center pr-3">
                  <span
                    className="text-base sm:text-lg font-black tracking-tight"
                    style={{ color: numVal !== null ? cat.color : "#64748b" }}
                  >
                    {numVal !== null ? cat.label : "Offline"}
                  </span>
                </div>
              </div>

              {/* Real Mini Sparkline Curve - Stretched to card width with smooth gradient fill */}
              <div className="w-full h-14 mt-4 relative overflow-hidden rounded-xl">
                <svg
                  viewBox="0 0 300 50"
                  preserveAspectRatio="none"
                  className="w-full h-full block"
                >
                  <defs>
                    <linearGradient
                      id={`sparkGrad-${sensor.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={numVal !== null ? cat.color : "#94a3b8"}
                        stopOpacity="0.22"
                      />
                      <stop
                        offset="100%"
                        stopColor={numVal !== null ? cat.color : "#94a3b8"}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Soft area gradient fill */}
                  <path
                    d={sparklineArea}
                    fill={`url(#sparkGrad-${sensor.key})`}
                  />

                  {/* Clean smooth curve line */}
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke={numVal !== null ? cat.color : "#cbd5e1"}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Real Analytics Section with Metric Selector Tabs (Matching Image 2 in Green) */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Location Analytics
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {dateLabel}
              </span>
              <span className="text-xs font-bold text-gray-400">
                ({selectedRange})
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {chartPoints.length > 0
                ? `Timeline of ${chartPoints.length} recordings for ${dateLabel}`
                : `No telemetry recorded on ${dateLabel}`}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {CHART_METRICS.map((metric) => (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedChartMetric(metric.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedChartMetric === metric.key
                    ? "bg-[#22c55e] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current reading highlight banner */}
        {latestPoint && (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {latestPoint.pt.value.toFixed(
                selectedChartMetric === "aqi" ? 0 : 2
              )}{" "}
              <span className="text-sm font-semibold text-gray-500">
                {activeChartMetricObj.unit}
              </span>
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {effectivePollutantData.isAverage
                ? `Timeline across ${dateLabel} (${filteredReadings.length} recordings)`
                : `Latest reading at ${latestPoint.pt.fullTime}`}
            </span>
          </div>
        )}

        {/* SVG Green Area Chart */}
        <div className="w-full overflow-x-auto">
          <div className="relative min-w-[700px] w-full h-[270px]">
            {chartPoints.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm font-medium border border-dashed border-gray-200 rounded-2xl py-12 px-4 text-center">
                <IoCalendarOutline className="text-3xl text-gray-300 mb-2" />
                <span className="font-semibold text-gray-700">
                  No telemetry recorded on {dateLabel}
                </span>
                <span className="text-xs text-gray-400 mt-1 max-w-md">
                  There are no readings stored for this date in the database. Choose a date marked with a green dot in the calendar or select another range from the date range dropdown above.
                </span>
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible select-none"
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  {/* Vertical Gradient Fading Downwards from Green to Transparent */}
                  <linearGradient id="realGreenAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.38" />
                    <stop offset="60%" stopColor="#22c55e" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Dashed Gridlines & Dynamic Y-Axis Labels */}
                {yTicks.map((yVal) => {
                  const yPos =
                    paddingTop + chartH - ((yVal - minVal) / (maxVal - minVal || 1)) * chartH;
                  return (
                    <g key={yVal}>
                      <line
                        x1={paddingLeft}
                        y1={yPos}
                        x2={svgWidth - paddingRight}
                        y2={yPos}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 10}
                        y={yPos + 4}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="11"
                        fontFamily="monospace"
                      >
                        {yVal}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Area Fill */}
                <path d={areaD} fill="url(#realGreenAreaGradient)" />

                {/* Primary Green Trend Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* X-Axis Time Labels */}
                {pointsCoordinates.length > 0 &&
                  [0, Math.floor(pointsCoordinates.length / 3), Math.floor((2 * pointsCoordinates.length) / 3), pointsCoordinates.length - 1]
                    .filter((idx, i, arr) => arr.indexOf(idx) === i)
                    .map((idx) => {
                      const pt = pointsCoordinates[idx];
                      if (!pt) return null;
                      return (
                        <text
                          key={idx}
                          x={pt.x}
                          y={svgHeight - 12}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="11"
                          fontWeight="500"
                        >
                          {pt.pt.time}
                        </text>
                      );
                    })}

                {/* Interactive Vertical Cursor Guideline */}
                {activePoint && (
                  <line
                    x1={activePoint.x}
                    y1={paddingTop}
                    x2={activePoint.x}
                    y2={paddingTop + chartH}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                )}

                {/* Glowing Dot on Active Point */}
                {activePoint && (
                  <g>
                    {/* Outer pulse glow */}
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="9"
                      fill="#22c55e"
                      opacity="0.25"
                    />
                    {/* Inner solid circle */}
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="4.5"
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* Invisible Hover Rectangles to track mouse */}
                {pointsCoordinates.map((ptCoord, i) => {
                  const w = chartW / (pointsCoordinates.length || 1);
                  return (
                    <rect
                      key={i}
                      x={ptCoord.x - w / 2}
                      y={paddingTop}
                      width={w}
                      height={chartH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIndex(i)}
                    />
                  );
                })}
              </svg>
            )}

            {/* Floating Tooltip matching Image 2 */}
            {activePoint && (
              <div
                className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#0f172a] text-white px-3 py-1.5 rounded-lg shadow-xl text-xs font-mono font-bold flex items-center gap-2 border border-slate-700"
                style={{
                  left: `${(activePoint.x / svgWidth) * 100}%`,
                  top: `${(activePoint.y / svgHeight) * 100}%`,
                }}
              >
                <span className="text-emerald-400">
                  {activePoint.pt.value.toFixed(
                    selectedChartMetric === "aqi" ? 0 : 2
                  )}{" "}
                  {activeChartMetricObj.unit}
                </span>
                <span className="text-slate-400 font-normal">
                  {activePoint.pt.fullTime}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
