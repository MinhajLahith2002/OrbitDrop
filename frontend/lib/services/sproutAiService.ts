/**
 * Sprout AI - Intelligent Agronomic Copilot (WaterWise inspired)
 */

export function generateSproutAdvice(question: string, context: any = {}) {
  const {
    cropName = "Rice / Paddy",
    growthStage = "Mid-Season",
    areaHectares = 1.0,
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
        avgMoisture < 20
          ? "The micro-stress downscaling model detects dry pockets along high-elevation or sandy boundary zones."
          : "Moisture levels are currently sufficient for crop root health.",
        "Check the on-screen micro-grid overlay to target water only on red/orange parcels."
      ],
      actionItem: avgMoisture < 20 ? "Target precision spray on stressed zones" : "Maintain normal cycle",
      recommendedWindow: "Check daily after sunrise",
    };
  }

  // 3. Rain / Weather / Storm questions
  if (q.includes("rain") || q.includes("storm") || q.includes("monsoon") || q.includes("weather")) {
    return {
      topic: "Meteorological Alert & Rain Risk",
      summary: isLockoutActive 
        ? `Monsoon Rain Alert: ${forecastRain48h_mm} mm expected. Automatic pump lockout is ACTIVE.`
        : `Clear Skies: Forecast indicates minimal precipitation (< 2 mm) over the next 48 hours.`,
      details: [
        `Region: ${region} agricultural district.`,
        `Evaporation Rate: ${et0_mm} mm/day. High solar irradiance will dry upper 5 cm soil rapidly.`,
        isLockoutActive
          ? "Lockout prevents nutrient runoff and soil salinity damage."
          : "Favorable conditions for routine scheduled irrigation."
      ],
      actionItem: isLockoutActive ? "Do not start pumps" : "Irrigate as scheduled",
      recommendedWindow: isLockoutActive ? "Standby" : "Dawn or Dusk",
    };
  }

  // 4. Default Agronomic Guidance
  return {
    topic: "Agronomic Copilot Recommendations",
    summary: `Crop profile: ${cropName} (${growthStage}) across ${areaHectares} ha.`,
    details: [
      `Gross Water Requirement: ${waterDemandLiters.toLocaleString()} L`,
      `Optimal Pump Runtime: ${pumpRuntime}`,
      `Weather Status: ${isLockoutActive ? `Rain Lockout (${forecastRain48h_mm} mm)` : "Clear / Normal Irrigation"}`,
      "OrbitDrop combines FAO-56 Penman-Monteith physics with machine learning downscaling for millimeter-accurate hydration."
    ],
    actionItem: isLockoutActive ? "Hold watering until storm passes" : `Run irrigation pump for ${pumpRuntime}`,
    recommendedWindow: "06:00 AM – 08:30 AM",
  };
}
