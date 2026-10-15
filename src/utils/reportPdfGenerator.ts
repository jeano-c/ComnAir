import { jsPDF } from "jspdf";
import {
  calculatePM25AQI,
  calculateSO2AQI,
  calculateCOAQI,
  calculateO3AQI,
  calculateNO2AQI,
  calculateOverallAQI,
  getAqiCategory,
} from "./aqiCalculations";
import {
  getGenericFallbackTip,
  type GenericAiTipResult,
} from "../services/genericAiTipService";

export interface SensorMetricItem {
  key: "pm25" | "so2" | "co" | "o3" | "no2";
  label: string;
  fullName: string;
  unit: string;
  decimals: number;
}

export const REPORT_SENSOR_METRICS: readonly SensorMetricItem[] = [
  { key: "pm25", label: "PM 2.5", fullName: "Fine Particulate Matter", unit: "µg/m³", decimals: 1 },
  { key: "so2", label: "SO2", fullName: "Sulfur Dioxide", unit: "ppb", decimals: 2 },
  { key: "co", label: "CO", fullName: "Carbon Monoxide", unit: "ppm", decimals: 3 },
  { key: "o3", label: "O3", fullName: "Ozone", unit: "ppm", decimals: 4 },
  { key: "no2", label: "NO2", fullName: "Nitrogen Dioxide", unit: "ppb", decimals: 2 },
] as const;

export interface StationReportExportOptions {
  stationName: string;
  station: any;
  dateLabel: string;
  selectedRange: string;
  filteredReadings: any[];
  pollutantStats: Record<string, { avg: number | null; min: number | null; max: number | null }> | null;
  effectivePollutantData: {
    isAverage: boolean;
    modeLabel: string;
    values: Record<string, any>;
  };
  overallAQI: number;
}

// Convert hex color string to RGB tuple
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Map health conditions to descriptive metadata for report cards
const HEALTH_CONDITION_META = [
  {
    key: "asthma" as const,
    name: "Asthma",
    group: "Respiratory Health",
    borderHex: "#0284c7", // Sky blue
    bgHex: "#f0f9ff",
    note: "Keep rescue inhalers accessible; guard against bronchospasm & drafts.",
  },
  {
    key: "copd" as const,
    name: "COPD & Chronic Lung",
    group: "Chronic Pulmonary",
    borderHex: "#6366f1", // Indigo
    bgHex: "#eef2ff",
    note: "Minimize airway resistance; remain in HEPA-filtered indoor areas.",
  },
  {
    key: "heartDisease" as const,
    name: "Heart Disease & Cardio",
    group: "Cardiovascular Reserve",
    borderHex: "#e11d48", // Rose
    bgHex: "#fff1f2",
    note: "Elevated particulates raise arterial stress; avoid heavy cardiac exertion.",
  },
  {
    key: "pregnancyOrDiabetes" as const,
    name: "Pregnancy & Diabetes",
    group: "Prenatal & Metabolic",
    borderHex: "#d97706", // Amber
    bgHex: "#fffbeb",
    note: "Guards maternal blood oxygenation and prevents metabolic inflammation.",
  },
  {
    key: "elderly" as const,
    name: "Older Adults (65+)",
    group: "Cardiopulmonary Reserve",
    borderHex: "#2563eb", // Blue
    bgHex: "#eff6ff",
    note: "Seniors have higher particulate fatigue; keep home windows sealed.",
  },
  {
    key: "children" as const,
    name: "Children & Youth (<18)",
    group: "Developing Lungs",
    borderHex: "#0d9488", // Teal
    bgHex: "#f0fdfa",
    note: "Higher respiratory rate per pound; adjust school athletic and recess drills.",
  },
];

/**
 * Generates an executive 2-page ComnAir Environmental Monitoring Report PDF
 * complete with telemetry metrics, dominant pollutant analysis, generic public AQI tips,
 * and comprehensive health condition advisories matching the AQI Guide.
 */
export function generateStationPdfReport(options: StationReportExportOptions): void {
  const {
    stationName,
    station,
    dateLabel,
    selectedRange,
    filteredReadings,
    pollutantStats,
    effectivePollutantData,
    overallAQI,
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const leftMargin = 14;
  const rightMargin = 14;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 182mm

  // Handle empty readings gracefully
  if (!filteredReadings || filteredReadings.length === 0) {
    // Header
    doc.setFillColor(31, 143, 34);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ComnAir Environmental Monitoring Report", leftMargin, 14);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text(`Station: ${stationName}`, leftMargin, 36);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Reporting Period: ${dateLabel} (${selectedRange})`, leftMargin, 44);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, leftMargin, 50);

    doc.setDrawColor(226, 232, 240);
    doc.line(leftMargin, 56, pageWidth - rightMargin, 56);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("No Telemetry Records Available", leftMargin, 70);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const notice = doc.splitTextToSize(
      `No air quality telemetry data was recorded by hardware gateways during the selected period (${dateLabel} - ${selectedRange}). Health advisories and sensor pollutant breakdowns cannot be computed without verified reading packets.`,
      contentWidth
    );
    doc.text(notice, leftMargin, 78);

    const safeFilename = `${stationName.replace(/\s+/g, "_")}_Air_Report_${selectedRange.replace(/\s+/g, "_")}.pdf`;
    doc.save(safeFilename);
    return;
  }

  // --- Calculate Dominant Pollutant & Peak Exposure across the range ---
  let dominantPollutantKey = "PM2.5";
  let maxSubAqi = -1;
  let peakAqi = overallAQI;

  REPORT_SENSOR_METRICS.forEach((sensor) => {
    const pStat = pollutantStats?.[sensor.key];
    const avgVal =
      pStat?.avg ??
      (typeof effectivePollutantData.values[sensor.key] === "number"
        ? effectivePollutantData.values[sensor.key]
        : null);

    let subAQI = 0;
    if (avgVal !== null) {
      if (sensor.key === "pm25") subAQI = calculatePM25AQI(avgVal);
      else if (sensor.key === "so2") subAQI = calculateSO2AQI(avgVal);
      else if (sensor.key === "co") subAQI = calculateCOAQI(avgVal);
      else if (sensor.key === "o3") subAQI = calculateO3AQI(avgVal);
      else if (sensor.key === "no2") subAQI = calculateNO2AQI(avgVal);
    }

    if (subAQI > maxSubAqi) {
      maxSubAqi = subAQI;
      dominantPollutantKey = sensor.label;
    }

    // Peak check from max value
    const maxVal = pStat?.max;
    if (maxVal !== null && maxVal !== undefined) {
      let maxSensorAqi = 0;
      if (sensor.key === "pm25") maxSensorAqi = calculatePM25AQI(maxVal);
      else if (sensor.key === "so2") maxSensorAqi = calculateSO2AQI(maxVal);
      else if (sensor.key === "co") maxSensorAqi = calculateCOAQI(maxVal);
      else if (sensor.key === "o3") maxSensorAqi = calculateO3AQI(maxVal);
      else if (sensor.key === "no2") maxSensorAqi = calculateNO2AQI(maxVal);
      if (maxSensorAqi > peakAqi) {
        peakAqi = maxSensorAqi;
      }
    }
  });

  // Fetch deterministic EPA public health tips calibrated to this exact AQI & culprit pollutant
  const tipData: GenericAiTipResult = getGenericFallbackTip(
    overallAQI,
    dominantPollutantKey,
    peakAqi > 150 && overallAQI <= 100,
    stationName
  );

  const overallCat = getAqiCategory(overallAQI);
  const [catR, catG, catB] = hexToRgb(overallCat.color);
  const isAvg = effectivePollutantData.isAverage;

  // ==========================================
  // PAGE 1: TELEMETRY & GENERIC PUBLIC AQI TIP
  // ==========================================

  // 1. Top Header Banner
  doc.setFillColor(31, 143, 34);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("ComnAir Environmental Monitoring Report", leftMargin, 14);

  // 2. Station Metadata Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Station: ${stationName}`, leftMargin, 32);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Reporting Period: ${dateLabel} (${selectedRange})`, leftMargin, 39);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, leftMargin, 45);
  doc.text(
    `Hardware Gateway ID: ${station?.gateway?.id || "esp_32"} | Station Status: ${station?.status || "ACTIVE"}`,
    leftMargin,
    51
  );
  doc.text(
    `Telemetry Mode: ${
      isAvg
        ? `Period Aggregate Summary (Mean of ${filteredReadings.length} telemetry readings)`
        : `Live Telemetry Snapshot (${filteredReadings.length} total reading packet)`
    }`,
    leftMargin,
    57
  );

  doc.setDrawColor(226, 232, 240);
  doc.line(leftMargin, 61, pageWidth - rightMargin, 61);

  // 3. Pollutant Table Header
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Pollutant", leftMargin, 68);
  doc.text(isAvg ? "Avg Conc" : "Concentration", 46, 68);
  doc.text("Min", 78, 68);
  doc.text("Peak / Max", 100, 68);
  doc.text("Sub-AQI", 130, 68);
  doc.text("EPA Category", 152, 68);
  doc.text("Data Source", 176, 68);

  doc.setDrawColor(203, 213, 225);
  doc.line(leftMargin, 71, pageWidth - rightMargin, 71);

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  let y = 78;
  REPORT_SENSOR_METRICS.forEach((sensor) => {
    const pStat = pollutantStats?.[sensor.key];
    const avgVal =
      pStat?.avg ??
      (typeof effectivePollutantData.values[sensor.key] === "number"
        ? effectivePollutantData.values[sensor.key]
        : null);
    const minVal = pStat?.min ?? avgVal;
    const maxVal = pStat?.max ?? avgVal;

    let subAQI = 0;
    if (avgVal !== null) {
      if (sensor.key === "pm25") subAQI = calculatePM25AQI(avgVal);
      else if (sensor.key === "so2") subAQI = calculateSO2AQI(avgVal);
      else if (sensor.key === "co") subAQI = calculateCOAQI(avgVal);
      else if (sensor.key === "o3") subAQI = calculateO3AQI(avgVal);
      else if (sensor.key === "no2") subAQI = calculateNO2AQI(avgVal);
    }

    const cat = getAqiCategory(subAQI);
    const isFallback =
      station?.sensorHealth?.[sensor.key]?.source === "OPEN_METEO_FALLBACK" ||
      station?.fallbackSensors?.includes(sensor.key);

    const sourceStr =
      avgVal === null ? "Offline" : isFallback ? "Satellite" : "Hardware";

    doc.setTextColor(30, 41, 59);
    doc.text(sensor.label, leftMargin, y);
    doc.text(
      avgVal !== null ? `${avgVal.toFixed(sensor.decimals)} ${sensor.unit}` : "--",
      46,
      y
    );
    doc.text(minVal !== null ? `${minVal.toFixed(sensor.decimals)}` : "--", 78, y);
    doc.text(maxVal !== null ? `${maxVal.toFixed(sensor.decimals)}` : "--", 100, y);
    doc.text(avgVal !== null ? `${subAQI}` : "--", 130, y);

    const [r, g, b] = hexToRgb(cat.color);
    doc.setTextColor(r, g, b);
    doc.text(cat.label, 152, y);

    doc.setTextColor(100, 116, 139);
    doc.text(sourceStr, 176, y);

    y += 8;
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 7;

  // 4. Overall AQI Severity Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y, contentWidth, 26, 2, 2, "FD");

  // Left Color Accent Pill
  doc.setFillColor(catR, catG, catB);
  doc.roundedRect(leftMargin + 3, y + 3, 4, 20, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Overall Station Air Quality Index: ${overallAQI} AQI`, leftMargin + 11, y + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(catR, catG, catB);
  doc.text(`Condition Status: ${overallCat.fullName}`, leftMargin + 11, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Primary Driving Pollutant: ${dominantPollutantKey} (Sub-AQI: ${maxSubAqi >= 0 ? maxSubAqi : overallAQI})`,
    leftMargin + 11,
    y + 21
  );

  y += 33;

  // 5. Section: Generic AQI Public Guidance (General Population)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("General Public Air Quality Guidance", leftMargin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isAvg
      ? `Applicable public health guidance reflecting average conditions across this reporting period.`
      : `Real-time public health guidance for immediate outdoor activity planning.`,
    leftMargin,
    y + 5
  );

  y += 10;

  // Generic Guidance Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftMargin, y, contentWidth, 36, 2, 2, "FD");

  // Subtitle / Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52); // Dark green
  doc.text("Activity, Outdoor Exercise & Ventilation Recommendations:", leftMargin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const genericLines = doc.splitTextToSize(
    tipData.withoutHealthProblems ||
      "Air quality is satisfactory. Conditions are suitable for normal outdoor recreation and regular indoor ventilation.",
    contentWidth - 8
  );
  doc.text(genericLines, leftMargin + 4, y + 13);

  // Dominant pollutant caution inside the card
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // Amber
  doc.text(`Pollutant Precaution (${dominantPollutantKey}):`, leftMargin + 4, y + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const pollutantLines = doc.splitTextToSize(
    tipData.dominantPollutantAdvisory ||
      "Monitor air sensor trends and reduce strenuous outdoor workouts if haze or odor develops.",
    contentWidth - 8
  );
  doc.text(pollutantLines, leftMargin + 4, y + 30);

  y += 42;

  // 6. Peak Spike Alert Note (if multi-day custom range had a higher peak)
  if (isAvg && peakAqi > overallAQI && peakAqi > 100) {
    const peakCat = getAqiCategory(peakAqi);
    const [pR, pG, pB] = hexToRgb(peakCat.color);

    doc.setFillColor(254, 242, 242); // Red tint
    doc.setDrawColor(pR, pG, pB);
    doc.roundedRect(leftMargin, y, contentWidth, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(pR, pG, pB);
    doc.text(`Notice on Acute Exposure Spikes During Range:`, leftMargin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const peakNotice = doc.splitTextToSize(
      `While the period average was ${overallAQI} AQI (${overallCat.label}), peak concentrations reached ${peakAqi} AQI (${peakCat.fullName}). Individuals with cardiopulmonary sensitivities should review acute flare-ups during peak exposure intervals.`,
      contentWidth - 8
    );
    doc.text(peakNotice, leftMargin + 4, y + 11);

    y += 24;
  }

  // Page 1 Footer
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Telemetry verified against US EPA piece-wise linear air quality standards • Continued on Page 2 for Condition Advisories",
    leftMargin,
    pageHeight - 8
  );
  doc.text("Page 1 of 2", pageWidth - rightMargin - 15, pageHeight - 8);

  // =======================================================
  // PAGE 2: ADVISORIES BY HEALTH PROBLEM & SENSITIVE GROUPS
  // =======================================================
  doc.addPage();

  // Top Green Banner
  doc.setFillColor(31, 143, 34);
  doc.rect(0, 0, pageWidth, 16, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ComnAir Environmental Monitoring Report • Health Problem Advisories", leftMargin, 11);

  let y2 = 25;

  // Sensitive Groups Executive Overview
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y2, contentWidth, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Vulnerable Populations & Sensitive Groups Assessment (${overallCat.label})`,
    leftMargin + 4,
    y2 + 7
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const sensitiveOverview = doc.splitTextToSize(
    tipData.withHealthProblems ||
      "People with respiratory or cardiac conditions should monitor air quality changes and pace strenuous exertion accordingly.",
    contentWidth - 8
  );
  doc.text(sensitiveOverview, leftMargin + 4, y2 + 13);

  y2 += 29;

  // Section Header: 6 Health Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Advisories by Medical & Vulnerable Condition", leftMargin, y2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Tailored recommendations for specific chronic conditions matching the ComnAir AQI Guide.",
    leftMargin,
    y2 + 5
  );

  y2 += 10;

  // 2-Column Grid for the 6 Health Conditions (3 rows x 2 columns)
  const colWidth = 88;
  const colGap = 6;
  const cardHeight = 44;

  HEALTH_CONDITION_META.forEach((condition, index) => {
    const colIndex = index % 2;
    const rowIndex = Math.floor(index / 2);

    const cardX = leftMargin + colIndex * (colWidth + colGap);
    const cardY = y2 + rowIndex * (cardHeight + 4);

    const [bR, bG, bB] = hexToRgb(condition.borderHex);
    const [bgR, bgG, bgB] = hexToRgb(condition.bgHex);

    // Card background & border
    doc.setFillColor(bgR, bgG, bgB);
    doc.setDrawColor(bR, bG, bB);
    doc.roundedRect(cardX, cardY, colWidth, cardHeight, 1.5, 1.5, "FD");

    // Left accent strip
    doc.setFillColor(bR, bG, bB);
    doc.rect(cardX, cardY, 2.5, cardHeight, "F");

    // Condition Title & Group Tag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(condition.name, cardX + 5, cardY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(bR, bG, bB);
    doc.text(condition.group.toUpperCase(), cardX + 5, cardY + 10);

    // Specific Condition Tip extracted from tipData
    const tipText =
      tipData.conditionTips?.[condition.key] ||
      tipData.withHealthProblems ||
      "Maintain normal precautions and ensure prescription medications are readily accessible.";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const cardTipLines = doc.splitTextToSize(tipText, colWidth - 8);
    doc.text(cardTipLines, cardX + 5, cardY + 16);

    // Bottom Key Precaution Note
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const noteLines = doc.splitTextToSize(`Precaution: ${condition.note}`, colWidth - 8);
    doc.text(noteLines, cardX + 5, cardY + 37);
  });

  const bottomY = y2 + 3 * (cardHeight + 4) + 3;

  // Medical Disclaimer Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, bottomY, contentWidth, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Clinical Advisory & Medical Disclaimer:", leftMargin + 4, bottomY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const disclaimer = doc.splitTextToSize(
    "These public health tips are generated automatically based on US EPA Air Quality Index breakpoints and clinical cardiopulmonary guidelines. They provide general atmospheric risk mitigation and do not replace personalized medical advice from a licensed physician.",
    contentWidth - 8
  );
  doc.text(disclaimer, leftMargin + 4, bottomY + 10);

  // Page 2 Footer
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Station: ${stationName} • Telemetry Period: ${selectedRange}`,
    leftMargin,
    pageHeight - 8
  );
  doc.text("Page 2 of 2", pageWidth - rightMargin - 15, pageHeight - 8);

  // Save the PDF
  const safeFilename = `${stationName.replace(/\s+/g, "_")}_Air_Report_${selectedRange.replace(/\s+/g, "_")}.pdf`;
  doc.save(safeFilename);
}
