import { getAqiCategory } from "../utils/aqiCalculations";

export interface GenericAiTipResult {
  headline: string;
  summary: string;
  withoutHealthProblems: string; // Generic tip for the general, healthy public
  withHealthProblems: string;    // Generic tip for sensitive groups (asthma, COPD, heart, elderly, children)
  dominantPollutantKey: string;  // e.g., "PM2.5", "Ozone", "CO", etc.
  dominantPollutantAdvisory: string; // Specific tip for the culprit pollutant
  isFallback?: boolean;
}

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

/**
 * Built-in deterministic fallback generator based on EPA standard public health guidelines.
 * Used instantly if Gemini API is offline, loading, rate-limited, or not configured.
 */
export function getGenericFallbackTip(
  aqi: number,
  dominantPollutant: string = "PM2.5",
  isSpike: boolean = false,
  locationName: string = "All Monitored Zones"
): GenericAiTipResult {
  const category = getAqiCategory(aqi);
  const cleanAqi = Math.max(0, Math.round(aqi || 0));

  let headline = isSpike
    ? `Sudden AQI Spike at ${locationName} (${cleanAqi} AQI)`
    : `Air Quality Advisory: ${locationName} (${cleanAqi} AQI)`;

  let summary = `At ${locationName}, Air Quality Index is currently ${cleanAqi} (${category.fullName}). Primary contributor is ${dominantPollutant}.`;
  let withoutHealthProblems = "";
  let withHealthProblems = "";
  let pollutantAdvisory = "";

  // Pollutant-specific action
  switch (dominantPollutant.toUpperCase()) {
    case "PM2.5":
      pollutantAdvisory =
        "Fine particulate matter (PM2.5) penetrates deeply into lungs and enters bloodstream. Use HEPA indoor air filtration and seal drafty doors/windows.";
      break;
    case "O3":
    case "OZONE":
      pollutantAdvisory =
        "Ground-level ozone spikes during warm, sunny hours and irritates respiratory pathways. Reschedule strenuous outdoor workouts away from peak afternoon hours.";
      break;
    case "CO":
    case "CARBON MONOXIDE":
      pollutantAdvisory =
        "Carbon monoxide reduces oxygen delivery in the bloodstream. Avoid heavy traffic congestion and ensure combustion sources are well ventilated.";
      break;
    case "SO2":
    case "SULFUR DIOXIDE":
      pollutantAdvisory =
        "Sulfur dioxide constricts airways rapidly. Asthmatics and individuals with lung sensitivity should avoid outdoor exposure near industrial zones.";
      break;
    case "NO2":
    case "NITROGEN DIOXIDE":
      pollutantAdvisory =
        "Nitrogen dioxide exacerbates asthma and bronchial symptoms. Limit time spent alongside high-traffic roadways.";
      break;
    default:
      pollutantAdvisory =
        "Monitor local air sensor changes and adjust outdoor physical exertion accordingly.";
      break;
  }

  if (cleanAqi <= 50) {
    // Good
    summary = `Air quality is satisfactory with little to no risk (${cleanAqi} AQI).`;
    withoutHealthProblems =
      "Conditions are ideal for all outdoor activities, running, sports, and natural home ventilation.";
    withHealthProblems =
      "Air is clean and poses no restrictions. Safe for individuals with asthma, heart conditions, elderly, and children.";
  } else if (cleanAqi <= 100) {
    // Moderate
    summary = `Air quality is acceptable (${cleanAqi} AQI). Pollutant levels are safe for most people.`;
    withoutHealthProblems =
      "Normal outdoor recreation and work can continue without precautions.";
    withHealthProblems =
      "Unusually sensitive individuals with pre-existing respiratory or cardiac conditions should monitor for mild cough or breathing changes.";
  } else if (cleanAqi <= 150) {
    // Unhealthy for Sensitive Groups
    summary = `Air quality has degraded to ${cleanAqi} AQI. Members of sensitive groups may experience health effects.`;
    withoutHealthProblems =
      "General healthy individuals are less likely to be affected. Take occasional rest breaks during prolonged or heavy outdoor workouts.";
    withHealthProblems =
      "People with asthma, COPD, cardiovascular conditions, older adults, and children should reduce heavy outdoor exertion and keep rescue inhalers accessible.";
  } else if (cleanAqi <= 200) {
    // Unhealthy
    summary = `Unhealthy air quality detected (${cleanAqi} AQI). Everyone may begin to experience adverse health effects.`;
    withoutHealthProblems =
      "Move strenuous workouts indoors. If spending extended time outside, consider wearing a snug-fitting N95/KN95 mask and keep windows closed.";
    withHealthProblems =
      "High health risk: Sensitive groups should avoid all outdoor physical activity, remain in clean indoor air, and consult a physician if chest tightness or wheezing occurs.";
  } else if (cleanAqi <= 300) {
    // Very Unhealthy
    summary = `Health alert: Serious air degradation (${cleanAqi} AQI). Increased risk of adverse effects for everyone.`;
    withoutHealthProblems =
      "Avoid prolonged outdoor exertion. Keep indoor air filtered and wear N95/KN95 respirators if traveling outdoors is necessary.";
    withHealthProblems =
      "Critical warning: People with heart or lung disease, elderly, and children should remain strictly indoors in air-purified rooms. Minimize physical effort.";
  } else {
    // Hazardous (301+)
    summary = `Emergency health warning: Hazardous air conditions (${cleanAqi} AQI). Everyone is seriously affected.`;
    withoutHealthProblems =
      "Avoid all outdoor physical activity. Keep windows and doors sealed with indoor air purifiers running on high.";
    withHealthProblems =
      "Severe emergency: Vulnerable individuals must remain in tightly sealed, filtered environments. Strictly avoid outdoor exposure.";
  }

  return {
    headline,
    summary,
    withoutHealthProblems,
    withHealthProblems,
    dominantPollutantKey: dominantPollutant,
    dominantPollutantAdvisory: pollutantAdvisory,
    isFallback: true,
  };
}

/**
 * Calls Google Gemini REST endpoint directly to generate generic, context-aware
 * health advice tailored to both general populations and sensitive health groups.
 */
export async function generateGenericAiTip(params: {
  aqi: number;
  dominantPollutant?: string;
  dominantValue?: number;
  oldAqi?: number;
  isSpike?: boolean;
  locationName?: string;
}): Promise<GenericAiTipResult> {
  const {
    aqi,
    dominantPollutant = "PM2.5",
    dominantValue,
    oldAqi,
    isSpike = false,
    locationName = "Monitored Zone",
  } = params;

  const fallback = getGenericFallbackTip(aqi, dominantPollutant, isSpike, locationName);

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

  if (!apiKey) {
    console.info("Gemini API key not found in env, using standard EPA generic fallback.");
    return fallback;
  }

  const category = getAqiCategory(aqi);

  const prompt = `
You are an expert Air Quality & Public Health AI Communicator following EPA standards.
A real-time air quality event has been detected:
- Event: ${isSpike ? `Sudden AQI Spike from ${oldAqi ?? "baseline"} to ${aqi}` : `Current Air Quality Reading`}
- Current AQI: ${aqi} (${category.fullName})
- Primary Pollutant: ${dominantPollutant} ${dominantValue ? `(${dominantValue})` : ""}
- Location: ${locationName}

TASK:
Produce an immediate, generic public health advisory with two distinct, clear guidance sections:
1. "withoutHealthProblems": Guidance for healthy individuals / general public (exercise, ventilation, outdoor work, mask advice if elevated).
2. "withHealthProblems": Guidance for sensitive / vulnerable groups (individuals with asthma, COPD, heart disease, pregnant women, elderly, children).
3. "dominantPollutantAdvisory": 1 concise sentence addressing the specific harm of ${dominantPollutant} and how to mitigate it.

CRITICAL GUIDELINES:
- Contextualize the headline and summary specifically for the location "${locationName}".
- Generic guidance: Do NOT address a specific single user by name or assume one individual's medical history. Address the two categories clearly and generally.
- Tone: Clear, calm, authoritative, and actionable.
- Length: 1 to 2 punchy, helpful sentences per field.
- No markdown formatting (no asterisks, bolding, backticks, or bullet points).

OUTPUT FORMAT:
Return ONLY a valid, raw JSON object with these exact keys:
{
  "headline": "Short 4-8 word alert headline (e.g., Elevated PM2.5 Surge Detected)",
  "summary": "1 sentence summarizing the current reading and condition",
  "withoutHealthProblems": "Clear advice for people without pre-existing health conditions",
  "withHealthProblems": "Clear advice for people with respiratory or cardiovascular health conditions",
  "dominantPollutantAdvisory": "Actionable advice specific to ${dominantPollutant}"
}
`.trim();

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error status: ${response.status}`);
      }

      const json = await response.json();
      const rawText =
        json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!rawText) throw new Error("Empty response from Gemini");

      // Clean out markdown codeblocks if model wrapped it in ```json ... ```
      const cleanedJsonStr = rawText
        .replace(/^```[a-z]*\s*/i, "")
        .replace(/```$/g, "")
        .trim();

      const parsed = JSON.parse(cleanedJsonStr);

      if (parsed.withoutHealthProblems && parsed.withHealthProblems) {
        return {
          headline:
            parsed.headline?.replace(/\*/g, "").trim() || fallback.headline,
          summary:
            parsed.summary?.replace(/\*/g, "").trim() || fallback.summary,
          withoutHealthProblems: parsed.withoutHealthProblems
            .replace(/\*/g, "")
            .trim(),
          withHealthProblems: parsed.withHealthProblems
            .replace(/\*/g, "")
            .trim(),
          dominantPollutantKey: dominantPollutant,
          dominantPollutantAdvisory:
            parsed.dominantPollutantAdvisory?.replace(/\*/g, "").trim() ||
            fallback.dominantPollutantAdvisory,
          isFallback: false,
        };
      }
    } catch (err: any) {
      console.warn(
        `Gemini model (${model}) call failed, trying next candidate or fallback:`,
        err?.message || err
      );
    }
  }

  // Graceful fallback if all models fail or rate-limit
  return fallback;
}
