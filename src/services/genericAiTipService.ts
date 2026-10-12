import { getAqiCategory } from "../utils/aqiCalculations";

export interface HealthConditionTips {
  asthma: string;
  copd: string;
  heartDisease: string;
  pregnancyOrDiabetes: string;
  elderly: string;
  children: string;
}

export interface GenericAiTipResult {
  headline: string;
  summary: string;
  withoutHealthProblems: string; // Generic tip for the general, healthy public
  withHealthProblems: string;    // Sensitive groups aggregate summary
  conditionTips: HealthConditionTips; // Specific tips for each health problem listed in the app
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

  const conditionTips: HealthConditionTips = {
    asthma: "",
    copd: "",
    heartDisease: "",
    pregnancyOrDiabetes: "",
    elderly: "",
    children: "",
  };

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
    // Good (0 - 50)
    summary = `Air quality is satisfactory with little to no risk (${cleanAqi} AQI).`;
    withoutHealthProblems =
      "Conditions are ideal for all outdoor activities, running, sports, and natural home ventilation.";
    withHealthProblems =
      "Air is clean and poses no restrictions. Safe for individuals with asthma, heart conditions, elderly, and children.";

    conditionTips.asthma =
      "Clean air poses no bronchospasm risk. Great conditions for outdoor exercise; keep maintenance medications on regular schedule.";
    conditionTips.copd =
      "Optimal atmospheric conditions. Enjoy outdoor walks and open-air breathing exercises without airway irritation.";
    conditionTips.heartDisease =
      "Minimal cardiovascular stress. Safe for regular outdoor physical activities and cardio routines.";
    conditionTips.pregnancyOrDiabetes =
      "Excellent conditions for prenatal walks and outdoor recreation with fresh, uncontaminated airflow.";
    conditionTips.elderly =
      "Great time for morning walks, gardening, and opening windows to refresh indoor home ventilation.";
    conditionTips.children =
      "Completely safe for outdoor playground play, sports training, and active school recreation.";
  } else if (cleanAqi <= 100) {
    // Moderate (51 - 100)
    summary = `Air quality is acceptable (${cleanAqi} AQI). Pollutant levels are safe for most people.`;
    withoutHealthProblems =
      "Normal outdoor recreation and work can continue without precautions.";
    withHealthProblems =
      "Unusually sensitive individuals with pre-existing respiratory or cardiac conditions should monitor for mild cough or breathing changes.";

    conditionTips.asthma =
      "Generally safe, but highly sensitive asthmatics should keep a rescue inhaler handy during intense outdoor workouts.";
    conditionTips.copd =
      "Air is acceptable; take occasional breaks during prolonged outdoor exertion and watch for mild chest heaviness.";
    conditionTips.heartDisease =
      "Normal activities are safe; individuals with advanced cardiac disease should pace themselves during heavy exertion.";
    conditionTips.pregnancyOrDiabetes =
      "Safe for daily errands and moderate walking; stay well-hydrated and avoid congested roads during rush hour.";
    conditionTips.elderly =
      "Safe for typical outdoor routines; take shaded rests if feeling unusual fatigue during prolonged walking.";
    conditionTips.children =
      "Outdoor recess and sports are safe; observe children with diagnosed allergies for any mild coughing.";
  } else if (cleanAqi <= 150) {
    // Unhealthy for Sensitive Groups (101 - 150)
    summary = `Air quality has degraded to ${cleanAqi} AQI. Members of sensitive groups may experience health effects.`;
    withoutHealthProblems =
      "General healthy individuals are less likely to be affected. Take occasional rest breaks during prolonged or heavy outdoor workouts.";
    withHealthProblems =
      "People with asthma, COPD, cardiovascular conditions, older adults, and children should reduce heavy outdoor exertion and keep rescue inhalers accessible.";

    conditionTips.asthma =
      "Reduce prolonged outdoor cardio. Keep quick-relief bronchodilator inhalers immediately accessible at all times.";
    conditionTips.copd =
      "Limit extended outdoor exposure. Move strenuous physical activity indoors to avoid particulate airway resistance.";
    conditionTips.heartDisease =
      "Reduce strenuous outdoor activities to prevent elevated cardiac workload and blood pressure spikes from fine particulates.";
    conditionTips.pregnancyOrDiabetes =
      "Limit prolonged outdoor walking near heavy traffic; prefer clean, air-conditioned indoor spaces for daily exercise.";
    conditionTips.elderly =
      "Reduce heavy outdoor exertion; keep indoor windows closed and spend more time in filtered indoor areas.";
    conditionTips.children =
      "Reduce prolonged high-intensity outdoor playground play; shift energetic sports drills to indoor gymnasiums.";
  } else if (cleanAqi <= 200) {
    // Unhealthy (151 - 200)
    summary = `Unhealthy air quality detected (${cleanAqi} AQI). Everyone may begin to experience adverse health effects.`;
    withoutHealthProblems =
      "Move strenuous workouts indoors. If spending extended time outside, consider wearing a snug-fitting N95/KN95 mask and keep windows closed.";
    withHealthProblems =
      "High health risk: Sensitive groups should avoid all outdoor physical activity, remain in clean indoor air, and consult a physician if chest tightness or wheezing occurs.";

    conditionTips.asthma =
      "High risk of acute asthma flare-ups: avoid outdoor exertion entirely, run indoor air filtration, and track peak flow closely.";
    conditionTips.copd =
      "Avoid all outdoor exertion. Stay in rooms with HEPA air purifiers running and adhere closely to maintenance medication schedules.";
    conditionTips.heartDisease =
      "Avoid outdoor exertion. Inhaled particulates increase arterial inflammation and myocardial strain; consult your doctor if chest pressure develops.";
    conditionTips.pregnancyOrDiabetes =
      "Remain strictly indoors with doors and windows closed. Wear a certified N95 respirator if stepping outdoors is unavoidable.";
    conditionTips.elderly =
      "Remain indoors in air-purified rooms. Minimize physical effort and avoid opening windows to the outside air.";
    conditionTips.children =
      "Cancel all outdoor physical activities and playground time; keep children inside with air filters running.";
  } else if (cleanAqi <= 300) {
    // Very Unhealthy (201 - 300)
    summary = `Health alert: Serious air degradation (${cleanAqi} AQI). Increased risk of adverse effects for everyone.`;
    withoutHealthProblems =
      "Avoid prolonged outdoor exertion. Keep indoor air filtered and wear N95/KN95 respirators if traveling outdoors is necessary.";
    withHealthProblems =
      "Critical warning: People with heart or lung disease, elderly, and children should remain strictly indoors in air-purified rooms. Minimize physical effort.";

    conditionTips.asthma =
      "Severe asthma alert: remain in sealed indoor rooms with HEPA filters. Have rescue inhalers by your side and monitor for bronchospasm.";
    conditionTips.copd =
      "Critical lung hazard: avoid all ambient air exposure. Keep supplemental oxygen or rescue medication ready and seek help if dyspnea worsens.";
    conditionTips.heartDisease =
      "Dangerous cardiac stress: avoid all physical exertion. Stay in clean air and seek prompt medical attention if palpitations occur.";
    conditionTips.pregnancyOrDiabetes =
      "High vulnerability: stay in tightly sealed, air-purified rooms. Avoid any non-essential outdoor travel.";
    conditionTips.elderly =
      "Serious danger: remain completely indoors with active air filtration. Avoid housework or physical strain.";
    conditionTips.children =
      "Dangerous air levels: keep children strictly indoors with closed windows and clean filtration.";
  } else {
    // Hazardous (301+)
    summary = `Emergency health warning: Hazardous air conditions (${cleanAqi} AQI). Everyone is seriously affected.`;
    withoutHealthProblems =
      "Avoid all outdoor physical activity. Keep windows and doors sealed with indoor air purifiers running on high.";
    withHealthProblems =
      "Severe emergency: Vulnerable individuals must remain in tightly sealed, filtered environments. Strictly avoid outdoor exposure.";

    conditionTips.asthma =
      "Emergency conditions: stay inside a sealed safe room with HEPA filtration. Seek emergency care immediately if severe wheezing occurs.";
    conditionTips.copd =
      "Extreme respiratory danger: strictly avoid ambient outdoor air. Keep rescue medication ready and consult healthcare providers.";
    conditionTips.heartDisease =
      "Critical cardiovascular threat: stay in filtered indoor shelter. Minimize all physical exertion to prevent acute cardiac strain.";
    conditionTips.pregnancyOrDiabetes =
      "Emergency warning: strict indoor shelter in sealed, air-conditioned rooms. Avoid all outdoor air exposure.";
    conditionTips.elderly =
      "Critical emergency: remain completely confined to filtered indoor spaces. Monitor vitals and avoid exertion.";
    conditionTips.children =
      "Emergency alert: children must remain indoors in sealed, air-purified spaces at all times.";
  }

  return {
    headline,
    summary,
    withoutHealthProblems,
    withHealthProblems,
    conditionTips,
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
Produce an immediate, comprehensive public health advisory covering:
1. "withoutHealthProblems": Guidance for healthy individuals / general public (exercise, ventilation, outdoor work, mask advice if elevated).
2. "withHealthProblems": Concise summary for sensitive / vulnerable groups generally.
3. "conditionTips": Specific, actionable 1-2 sentence advice for EACH of these distinct health conditions:
   - "asthma": Inhaler readiness, airway bronchospasm prevention, outdoor cardio limits.
   - "copd": Chronic lung disease guidance, breath resistance, indoor HEPA filtration.
   - "heartDisease": Cardiovascular precautions, avoiding arterial stress / high blood pressure strain from ${dominantPollutant}.
   - "pregnancyOrDiabetes": Prenatal health, blood oxygenation, metabolic vulnerability precautions.
   - "elderly": Seniors (65+) cardiopulmonary reserve protection, indoor movement advice.
   - "children": Infants & children (<18) developing lung protection, school play/recess adjustments.
4. "dominantPollutantAdvisory": 1 concise sentence addressing the specific harm of ${dominantPollutant} and how to mitigate it.

CRITICAL GUIDELINES:
- Contextualize the headline and summary specifically for the location "${locationName}".
- Tone: Clear, calm, authoritative, and actionable.
- Length: 1 to 2 punchy, helpful sentences per field.
- No markdown formatting (no asterisks, bolding, backticks, or bullet points).

OUTPUT FORMAT:
Return ONLY a valid, raw JSON object with these exact keys:
{
  "headline": "Short 4-8 word alert headline",
  "summary": "1 sentence summarizing the current reading and condition",
  "withoutHealthProblems": "Clear advice for people without pre-existing health conditions",
  "withHealthProblems": "Summary advice for vulnerable groups generally",
  "conditionTips": {
    "asthma": "Specific advice for individuals with asthma",
    "copd": "Specific advice for COPD and chronic lung diseases",
    "heartDisease": "Specific advice for cardiovascular and heart disease",
    "pregnancyOrDiabetes": "Specific advice for pregnant women and diabetes",
    "elderly": "Specific advice for seniors and older adults (65+)",
    "children": "Specific advice for children and youth under 18"
  },
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
            maxOutputTokens: 800,
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

      if (parsed.withoutHealthProblems) {
        const cleanConditionTips: HealthConditionTips = {
          asthma:
            parsed.conditionTips?.asthma?.replace(/\*/g, "").trim() ||
            fallback.conditionTips.asthma,
          copd:
            parsed.conditionTips?.copd?.replace(/\*/g, "").trim() ||
            fallback.conditionTips.copd,
          heartDisease:
            parsed.conditionTips?.heartDisease?.replace(/\*/g, "").trim() ||
            fallback.conditionTips.heartDisease,
          pregnancyOrDiabetes:
            parsed.conditionTips?.pregnancyOrDiabetes?.replace(/\*/g, "").trim() ||
            fallback.conditionTips.pregnancyOrDiabetes,
          elderly:
            parsed.conditionTips?.elderly?.replace(/\*/g, "").trim() ||
            fallback.conditionTips.elderly,
          children:
            parsed.conditionTips?.children?.replace(/\*/g, "").trim() ||
            fallback.conditionTips.children,
        };

        return {
          headline:
            parsed.headline?.replace(/\*/g, "").trim() || fallback.headline,
          summary:
            parsed.summary?.replace(/\*/g, "").trim() || fallback.summary,
          withoutHealthProblems: parsed.withoutHealthProblems
            .replace(/\*/g, "")
            .trim(),
          withHealthProblems:
            parsed.withHealthProblems?.replace(/\*/g, "").trim() ||
            fallback.withHealthProblems,
          conditionTips: cleanConditionTips,
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
