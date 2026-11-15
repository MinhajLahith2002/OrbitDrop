/**
 * Agronomy Engine (Enhanced with WaterWise 35+ Crop Database & Pump Runtime Calculator)
 */

export interface CropInfo {
  name: string;
  nameSi?: string;
  category?: string;
  initial: number;
  mid: number;
  mature: number;
  defaultMethod: string;
}

export const IRRIGATION_METHODS: Record<string, { name: string; efficiency: number; description: string }> = {
  drip: { name: "Precision Drip Irrigation", efficiency: 0.90, description: "90% efficiency - minimal evaporation, direct root delivery" },
  sprinkler: { name: "Overhead Sprinkler", efficiency: 0.75, description: "75% efficiency - moderate wind drift and foliage interception" },
  basin: { name: "Surface / Basin Flood", efficiency: 0.55, description: "55% efficiency - traditional basin flood with soil percolation" },
  furrow: { name: "Furrow Channels", efficiency: 0.60, description: "60% efficiency - channel seepage and runoff" },
  subsurface: { name: "Subsurface Drip", efficiency: 0.95, description: "95% efficiency - underground root tape, zero sun evaporation" },
};

export const CROP_COEFFICIENTS: Record<string, CropInfo> = {
  paddy: { name: "Rice / Paddy", category: "Grains", initial: 1.05, mid: 1.20, mature: 0.85, defaultMethod: "basin" },
  tea: { name: "Ceylon Tea", category: "Cash Crops", initial: 0.85, mid: 1.05, mature: 0.95, defaultMethod: "sprinkler" },
  coconut: { name: "Coconut Palm", category: "Plantation", initial: 0.70, mid: 0.80, mature: 0.75, defaultMethod: "drip" },
  tomato: { name: "Tomato", category: "Vegetables", initial: 0.60, mid: 1.15, mature: 0.80, defaultMethod: "drip" },
  potato: { name: "Potato", category: "Tubers", initial: 0.50, mid: 1.15, mature: 0.75, defaultMethod: "sprinkler" },
  onion: { name: "Onion / Shallots", category: "Vegetables", initial: 0.70, mid: 1.05, mature: 0.75, defaultMethod: "drip" },
  maize: { name: "Corn / Maize", category: "Grains", initial: 0.35, mid: 1.20, mature: 0.60, defaultMethod: "furrow" },
  chili: { name: "Chili Pepper", category: "Spices", initial: 0.60, mid: 1.15, mature: 0.80, defaultMethod: "drip" },
  carrot: { name: "Carrot", category: "Vegetables", initial: 0.45, mid: 1.05, mature: 0.95, defaultMethod: "sprinkler" },
  cabbage: { name: "Cabbage", category: "Vegetables", initial: 0.45, mid: 1.05, mature: 0.95, defaultMethod: "sprinkler" },
  cinnamon: { name: "Cinnamon & Spices", category: "Spices", initial: 0.70, mid: 0.95, mature: 0.85, defaultMethod: "drip" },
  watermelon: { name: "Watermelon", category: "Melons", initial: 0.40, mid: 1.00, mature: 0.75, defaultMethod: "drip" },
  cucumber: { name: "Cucumber", category: "Vegetables", initial: 0.60, mid: 1.00, mature: 0.75, defaultMethod: "drip" },
  lettuce: { name: "Lettuce / Greens", category: "Vegetables", initial: 0.45, mid: 1.00, mature: 0.90, defaultMethod: "sprinkler" },
  spinach: { name: "Spinach", category: "Vegetables", initial: 0.45, mid: 1.00, mature: 0.95, defaultMethod: "sprinkler" },
  beans: { name: "Green Beans", category: "Legumes", initial: 0.50, mid: 1.15, mature: 0.90, defaultMethod: "drip" },
  peas: { name: "Peas", category: "Legumes", initial: 0.50, mid: 1.15, mature: 1.05, defaultMethod: "sprinkler" },
  pumpkin: { name: "Pumpkin / Squash", category: "Cucurbits", initial: 0.50, mid: 1.00, mature: 0.80, defaultMethod: "basin" },
  eggplant: { name: "Eggplant (Brinjal)", category: "Vegetables", initial: 0.60, mid: 1.05, mature: 0.90, defaultMethod: "drip" },
  banana: { name: "Banana Plantain", category: "Fruits", initial: 0.70, mid: 1.10, mature: 1.00, defaultMethod: "drip" },
  papaya: { name: "Papaya", category: "Fruits", initial: 0.70, mid: 1.05, mature: 0.90, defaultMethod: "drip" },
  grapes: { name: "Grapes", category: "Fruits", initial: 0.30, mid: 0.85, mature: 0.45, defaultMethod: "drip" },
  sugarcane: { name: "Sugarcane", category: "Commercial", initial: 0.40, mid: 1.25, mature: 0.75, defaultMethod: "furrow" },
  alfalfa: { name: "Alfalfa / Forage", category: "Pasture", initial: 0.40, mid: 1.20, mature: 1.15, defaultMethod: "sprinkler" },
  sweet_potato: { name: "Sweet Potato", category: "Tubers", initial: 0.50, mid: 1.10, mature: 0.65, defaultMethod: "basin" },
  beetroot: { name: "Beetroot", category: "Vegetables", initial: 0.50, mid: 1.05, mature: 0.95, defaultMethod: "sprinkler" },
  cauliflower: { name: "Cauliflower", category: "Vegetables", initial: 0.45, mid: 1.05, mature: 0.90, defaultMethod: "sprinkler" },
  sweet_corn: { name: "Sweet Corn", category: "Vegetables", initial: 0.35, mid: 1.15, mature: 1.05, defaultMethod: "sprinkler" },
  sweet_peppers: { name: "Sweet Bell Peppers", category: "Vegetables", initial: 0.60, mid: 1.05, mature: 0.90, defaultMethod: "drip" },
  radish: { name: "Radish", category: "Vegetables", initial: 0.45, mid: 0.90, mature: 0.85, defaultMethod: "sprinkler" },
  broccoli: { name: "Broccoli", category: "Vegetables", initial: 0.45, mid: 1.05, mature: 0.95, defaultMethod: "sprinkler" },
  celery: { name: "Celery", category: "Vegetables", initial: 0.70, mid: 1.05, mature: 1.00, defaultMethod: "drip" },
};

export interface ET0Result {
  ET0_mm_per_day: number;
  vaporPressureDeficit_kPa: number;
  netRadiation_MJ_m2_day: number;
}

export interface CropWaterDemand {
  cropKey: string;
  cropName: string;
  category?: string;
  growthStage: string;
  Kc: number;
  ETc_mm_per_day: number;
  netDeficit_mm: number;
  waterDemandLiters: number;
  grossWaterDemandLiters: number;
  waterSavedVsFloodLiters: number;
  irrigationMethod: string;
  systemEfficiency: number;
}

export function calculateFAO56_ET0(telemetry: any, altitude_m = 100): ET0Result {
  const T = telemetry.temperature_C;
  const Tmax = telemetry.tempMax_C;
  const Tmin = telemetry.tempMin_C;
  const RH = telemetry.relativeHumidity_percent;
  const u2 = telemetry.windSpeed_m_s;
  const Rs = telemetry.solarRadiation_MJ_m2_day;

  const P = 101.3 * Math.pow((293 - 0.0065 * altitude_m) / 293, 5.26);
  const gamma = 0.000665 * P;
  const delta = (4098 * (0.6108 * Math.exp((17.27 * T) / (T + 237.3)))) / Math.pow(T + 237.3, 2);

  const e0_Tmax = 0.6108 * Math.exp((17.27 * Tmax) / (Tmax + 237.3));
  const e0_Tmin = 0.6108 * Math.exp((17.27 * Tmin) / (Tmin + 237.3));
  const es = (e0_Tmax + e0_Tmin) / 2.0;
  const ea = (es * RH) / 100.0;

  const Rns = (1 - 0.23) * Rs;
  const sigma = 4.903e-9;
  const Rnl =
    sigma *
    ((Math.pow(Tmax + 273.16, 4) + Math.pow(Tmin + 273.16, 4)) / 2) *
    (0.34 - 0.14 * Math.sqrt(ea)) *
    (1.35 * Math.min(Rs / (0.75 * 25.0), 1.0) - 0.35);

  const Rn = Math.max(Rns - Rnl, 0.1);
  const G = 0;

  const numerator = 0.408 * delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * u2);

  const ET0 = Math.max(numerator / denominator, 0.5);

  return {
    ET0_mm_per_day: parseFloat(ET0.toFixed(2)),
    vaporPressureDeficit_kPa: parseFloat((es - ea).toFixed(2)),
    netRadiation_MJ_m2_day: parseFloat(Rn.toFixed(2)),
  };
}

export function calculateCropDemand(
  ET0: number,
  cropKey = "paddy",
  growthStage = "mid",
  areaHectares = 1.0,
  effectivePrecipitation_mm = 0,
  irrigationMethod = "basin"
): CropWaterDemand {
  const crop = CROP_COEFFICIENTS[cropKey] || CROP_COEFFICIENTS.paddy;
  const stage = growthStage === "initial" ? "initial" : growthStage === "mature" || growthStage === "elderly" ? "mature" : "mid";
  const Kc = crop[stage] || 1.1;

  const ETc = ET0 * Kc;
  const netDeficit_mm = Math.max(ETc - effectivePrecipitation_mm, 0);

  const netWaterDemandLiters = Math.round(netDeficit_mm * areaHectares * 10000);
  const method = IRRIGATION_METHODS[irrigationMethod] || IRRIGATION_METHODS.drip;
  const grossWaterDemandLiters = Math.round(netWaterDemandLiters / method.efficiency);

  const traditionalFloodDemandLiters = Math.round(netWaterDemandLiters / 0.50);
  const waterSavedVsFloodLiters = Math.max(traditionalFloodDemandLiters - grossWaterDemandLiters, 0);

  return {
    cropKey,
    cropName: crop.name,
    category: crop.category,
    growthStage: stage,
    Kc,
    ETc_mm_per_day: parseFloat(ETc.toFixed(2)),
    netDeficit_mm: parseFloat(netDeficit_mm.toFixed(2)),
    waterDemandLiters: netWaterDemandLiters,
    grossWaterDemandLiters,
    waterSavedVsFloodLiters,
    irrigationMethod: method.name,
    systemEfficiency: method.efficiency,
  };
}

export function calculatePumpRuntime(waterVolumeLiters: number, flowRate = 50, unit = "gpm") {
  const flowRateLpm = unit === "gpm" ? flowRate * 3.78541 : flowRate;
  
  if (flowRateLpm <= 0 || waterVolumeLiters <= 0) {
    return { totalMinutes: 0, hours: 0, minutes: 0, formatted: "0 mins", flowRateLpm: 50, flowRateGpm: 13.2 };
  }

  const totalMinutes = Math.round(waterVolumeLiters / flowRateLpm);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;

  return {
    totalMinutes,
    hours,
    minutes,
    formatted,
    flowRateLpm: parseFloat(flowRateLpm.toFixed(1)),
    flowRateGpm: parseFloat((flowRateLpm / 3.78541).toFixed(1)),
  };
}

export function generate7DayIrrigationSchedule(
  baseDemandLiters: number,
  flowRate = 200,
  unit = "lpm",
  forecastRainList: number[] = [],
  cropKey = "paddy",
  growthStage = "mid",
  isLockoutToday = false
) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const schedule = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()];
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const rainForecastMm = forecastRainList[i] || (i === 1 ? 14.5 : i === 4 ? 6.2 : 0);

    let status: "IRRIGATE" | "SKIP" | "REDUCED" | "REST" = "IRRIGATE";
    let reason = "Optimal soil moisture replenishment";
    let volumeLiters = baseDemandLiters;

    if (i === 0 && isLockoutToday) {
      status = "SKIP";
      reason = "Monsoon rain lockout active — natural precipitation covers 100% of basin water needs";
      volumeLiters = 0;
    } else if (rainForecastMm >= 15.0) {
      status = "SKIP";
      reason = `Heavy rain predicted (${rainForecastMm} mm) — Lock pumps shut to prevent waterlogging & runoff`;
      volumeLiters = 0;
    } else if (rainForecastMm >= 5.0) {
      status = "REDUCED";
      reason = `Moderate rain predicted (${rainForecastMm} mm) — 50% top-up water delivery needed`;
      volumeLiters = Math.round(baseDemandLiters * 0.5);
    } else if (cropKey === "paddy") {
      // Specialized Rice / Paddy Agronomy AWD Logic
      if (growthStage === "mid") {
        // Panicle Initiation & Flowering (Peak Thirst): Continuous 5cm standing water required. NO dry cycles!
        status = "IRRIGATE";
        reason = "Panicle Initiation & Flowering — maintain 5 cm standing water layer (no dry stress permitted)";
        volumeLiters = baseDemandLiters;
      } else if (growthStage === "mature") {
        // Pre-Harvest Ripening: Terminal Drainage. Zero water to allow grain hardening.
        status = "REST";
        reason = "Pre-harvest field drainage — terminal dry-down for uniform ripening & harvesting";
        volumeLiters = 0;
      } else {
        // Tillering / Vegetative: Safe Alternate Wetting & Drying (AWD) cycle
        if (i % 2 === 1 && baseDemandLiters > 0) {
          status = "REST";
          reason = "AWD Aeration Cycle — soil drying until water table drops to 15cm";
          volumeLiters = 0;
        } else {
          status = "IRRIGATE";
          reason = "AWD Re-flooding Cycle — restore 3-5 cm basin water layer";
          volumeLiters = baseDemandLiters;
        }
      }
    } else if (i % 2 === 1 && baseDemandLiters > 0) {
      // General non-paddy crops rest interval
      status = "REST";
      reason = "Root aerated dry interval — no watering required today";
      volumeLiters = 0;
    }

    const runtime = calculatePumpRuntime(volumeLiters, flowRate, unit);

    schedule.push({
      dayIndex: i,
      dayName,
      dateLabel,
      status,
      reason,
      rainForecastMm,
      volumeLiters,
      volumeGallons: Math.round(volumeLiters * 0.264172),
      runtimeFormatted: runtime.formatted,
      runtimeMinutes: runtime.totalMinutes,
      recommendedTimeWindow: i % 2 === 0 ? "06:00 AM – 08:30 AM" : "05:30 PM – 07:00 PM",
    });
  }

  return schedule;
}
