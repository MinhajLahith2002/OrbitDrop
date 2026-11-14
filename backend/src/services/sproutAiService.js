/**
 * Sprout AI - Intelligent Agronomic Copilot (Inspired by WaterWise)
 * Provides instant agronomic advice, irrigation schedules, and drought/flood mitigation.
 */

export function generateSproutAdvice(question, context = {}) {
  const {
    cropName = "Rice / Paddy",
    growthStage = "Mid-Season",
    areaHectares = 1.0,
    areaAcres = 2.47,
    et0_mm = 3.5,
    cropDeficit_mm = 4.2,
    waterDemandLiters = 42000,
    pumpRuntime = "1h 45m",
    forecastRain48h_mm = 0,
    isLockoutActive = false,
    avgMoisture = 22.5,
    region = "Polonnaruwa",
  } = context;

  const q = (question || "").toLowerCase();

  // 1. Watering / Pump schedule questions
  if (q.includes("when") || q.includes("time") || q.includes("water") || q.includes("irrigate") || q.includes("how much") || q.includes("schedule")) {
    if (isLockoutActive) {
      return {
        topic: "Irrigation Schedule & Rain Lockout",
        summary: `Do NOT irrigate today! An incoming monsoon storm with ${forecastRain48h_mm} mm of rain is predicted in the next 48 hours.`,
        details: [
          `Your ${areaHectares} ha ${cropName} field will receive natural hydration from rainfall.`,
          `Keeping your pump off today will save an estimated ${Math.round(areaHectares * 350)} kWh of electricity and prevent crop root asphyxiation / waterlogging.`,
          `Re-evaluate soil moisture 24 hours after the rain stops.`
        ],
        actionItem: "Keep sluice gates and pumps locked shut.",
        recommendedWindow: "Irrigation suspended until storm clears",
      };
    }

    return {
      topic: "Optimal Watering Window",
      summary: `Deliver approximately ${waterDemandLiters.toLocaleString()} Liters of water to your ${areaHectares} ha ${cropName} parcel.`,
      details: [
        `Recommended Pump Runtime: ${pumpRuntime} based on your pump flow rate.`,
        `Current daily crop thirst (ETc) is ${cropDeficit_mm} mm/day, with sun evaporation at ${et0_mm} mm/day.`,
        `Best Time Window: 06:00 AM – 08:30 AM or 05:30 PM – 07:00 PM. Avoid watering between 11:30 AM and 03:00 PM when solar radiation is highest to eliminate up to 35% evaporative loss.`
      ],
      actionItem: `Start your pump for ${pumpRuntime} during the cool morning window.`,
      recommendedWindow: "06:00 AM – 08:30 AM (Lowest Evaporation)",
    };
  }

  // 2. Soil Moisture & Stress questions
  if (q.includes("moisture") || q.includes("dry") || q.includes("stress") || q.includes("soil")) {
    const status = avgMoisture < 16 ? "Critical Drought Stress" : avgMoisture < 24 ? "Moderate Deficit" : "Optimal / Saturated";
    return {
      topic: "Soil Moisture & Plant Health",
      summary: `Your field parcel currently shows an average soil moisture of ${avgMoisture}% (${status}).`,
      details: [
        `Target optimal root-zone moisture for ${cropName} (${growthStage}) is 22% – 28%.`,
        avgMoisture < 18 
          ? `Topographic ridges and elevated bunds are experiencing rapid dry-down. Prioritize targeted variable-rate spray on red stress zones.`
          : `Soil water retention is currently healthy. Avoid over-saturating root zones to promote aerobic microbial activity.`
      ],
      actionItem: "Run 30m Micro-Stress Scan to pinpoint dry patches.",
      recommendedWindow: "Target 3x volume on critical red cells",
    };
  }

  // 3. Crop-specific disease / stage advice
  if (q.includes("disease") || q.includes("pest") || q.includes("fertilizer") || q.includes("fungus") || q.includes("leaf")) {
    return {
      topic: `${cropName} Agronomic Protection`,
      summary: `Best practices for ${cropName} in the ${region} agro-climatic zone:`,
      details: [
        `Growth Stage: ${growthStage}. Ensure adequate water availability during panicle/flowering initiation to prevent spikelet sterility.`,
        `Foliar disease prevention: Use drip or furrow methods where possible to keep foliage dry and deter blast fungus (Pyricularia oryzae) or leaf blight.`,
        `Split fertilizer application: Never broadcast urea immediately before heavy irrigation or rain to prevent nitrogen leaching into waterways.`
      ],
      actionItem: "Apply nutrients in early morning before irrigation cycle.",
      recommendedWindow: "Morning hours under calm wind conditions (< 2.5 m/s)",
    };
  }

  // 4. General / Default farming advice
  return {
    topic: "Smart Farm Advisory",
    summary: `OrbitDrop Sprout AI analysis for ${cropName} (${growthStage}) in ${region}:`,
    details: [
      `Field Size: ${areaHectares} ha (${areaAcres} acres).`,
      `Baseline Atmospheric Evaporation (ET₀): ${et0_mm} mm/day.`,
      `Estimated Daily Irrigation Requirement: ${waterDemandLiters.toLocaleString()} Liters.`,
      isLockoutActive 
        ? `Monsoon Warning: Rain Lockout is active (${forecastRain48h_mm} mm rain coming).`
        : `Weather: Dry spell conditions active — precision irrigation recommended.`
    ],
    actionItem: isLockoutActive ? "Pause pumps — harvest incoming rain" : `Run pump for ${pumpRuntime} in the morning`,
    recommendedWindow: "06:00 AM – 08:30 AM",
  };
}
