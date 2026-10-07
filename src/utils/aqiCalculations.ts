export interface AQIBreakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// 1. PM2.5 Breakpoints (µg/m³, Revised EPA Standard)
export const PM25_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
  { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 400 },
  { cLow: 325.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

// 2. CO Breakpoints (ppm, 8-hour)
export const CO_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
  { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
  { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
  { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
  { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
  { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
  { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 },
];

// 3. O3 Breakpoints (ppm, 8-hour)
export const O3_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0.0, cHigh: 0.054, iLow: 0, iHigh: 50 },
  { cLow: 0.055, cHigh: 0.07, iLow: 51, iHigh: 100 },
  { cLow: 0.071, cHigh: 0.085, iLow: 101, iHigh: 150 },
  { cLow: 0.086, cHigh: 0.105, iLow: 151, iHigh: 200 },
  { cLow: 0.106, cHigh: 0.2, iLow: 201, iHigh: 300 },
  { cLow: 0.201, cHigh: 0.404, iLow: 301, iHigh: 400 },
  { cLow: 0.405, cHigh: 0.604, iLow: 401, iHigh: 500 },
];

// 4. SO2 Breakpoints (ppb, 1-hour)
export const SO2_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
  { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
  { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
  { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
  { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
  { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
  { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 },
];

// 5. NO2 Breakpoints (ppb, 1-hour)
export const NO2_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
  { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
  { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
  { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
  { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
  { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 },
];

export function calculateSubAQI(
  concentration: number | null | undefined,
  breakpoints: AQIBreakpoint[],
  truncateDecimals = 1
): number {
  if (
    concentration === null ||
    concentration === undefined ||
    isNaN(concentration) ||
    concentration <= 0
  ) {
    return 0;
  }
  const factor = Math.pow(10, truncateDecimals);
  const c = Math.floor(concentration * factor) / factor;
  for (const bp of breakpoints) {
    if (c <= bp.cHigh) {
      const clampedC = Math.max(c, bp.cLow);
      const aqi =
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (clampedC - bp.cLow) +
        bp.iLow;
      return Math.round(aqi);
    }
  }
  return 500;
}

export function calculatePM25AQI(val: number | null | undefined): number {
  return calculateSubAQI(val, PM25_BREAKPOINTS, 1);
}

export function calculateCOAQI(val: number | null | undefined): number {
  return calculateSubAQI(val, CO_BREAKPOINTS, 1);
}

export function calculateO3AQI(val: number | null | undefined): number {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return 0;
  const ppmVal = val >= 1 ? val / 1000 : val;
  return calculateSubAQI(ppmVal, O3_BREAKPOINTS, 3);
}

export function calculateSO2AQI(val: number | null | undefined): number {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return 0;
  const ppbVal = val < 1 ? val * 1000 : val;
  return calculateSubAQI(ppbVal, SO2_BREAKPOINTS, 0);
}

export function calculateNO2AQI(val: number | null | undefined): number {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return 0;
  const ppbVal = val < 1 ? val * 1000 : val;
  return calculateSubAQI(ppbVal, NO2_BREAKPOINTS, 0);
}

export function calculateOverallAQI(reading: {
  pm25?: number | null;
  co?: number | null;
  o3?: number | null;
  so2?: number | null;
  no2?: number | null;
}): number {
  if (!reading) return 0;
  const pm25AQI = calculatePM25AQI(reading.pm25);
  const coAQI = calculateCOAQI(reading.co);
  const o3AQI = calculateO3AQI(reading.o3);
  const so2AQI = calculateSO2AQI(reading.so2);
  const no2AQI = calculateNO2AQI(reading.no2);
  return Math.max(pm25AQI, coAQI, o3AQI, so2AQI, no2AQI) || 0;
}

export function getAqiCategory(aqi: number | null | undefined): {
  label: string;
  fullName: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (aqi === null || aqi === undefined || isNaN(aqi) || aqi <= 0) {
    return {
      label: "Good",
      fullName: "Good",
      color: "#22c55e",
      bgColor: "#f0fdf4",
      textColor: "#15803d",
    };
  }
  if (aqi <= 50)
    return {
      label: "Good",
      fullName: "Good",
      color: "#22c55e",
      bgColor: "#f0fdf4",
      textColor: "#15803d",
    };
  if (aqi <= 100)
    return {
      label: "Moderate",
      fullName: "Moderate",
      color: "#eab308",
      bgColor: "#fefce8",
      textColor: "#a16207",
    };
  if (aqi <= 150)
    return {
      label: "Unhealthy (SG)",
      fullName: "Unhealthy for Sensitive Groups",
      color: "#f97316",
      bgColor: "#fff7ed",
      textColor: "#c2410c",
    };
  if (aqi <= 200)
    return {
      label: "Unhealthy",
      fullName: "Unhealthy",
      color: "#ef4444",
      bgColor: "#fef2f2",
      textColor: "#b91c1c",
    };
  if (aqi <= 300)
    return {
      label: "Very Unhealthy",
      fullName: "Very Unhealthy",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      textColor: "#6d28d9",
    };
  return {
    label: "Hazardous",
    fullName: "Hazardous",
    color: "#881337",
    bgColor: "#fff1f2",
    textColor: "#881337",
  };
}
