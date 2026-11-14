/**
 * Domain Service: Agronomy Engine (Sri Lanka Agro-Ecological Focus)
 * Implements FAO-56 Penman-Monteith equation for reference evapotranspiration (ET0)
 * and crop-specific coefficient (Kc) water demand modeling for Sri Lankan crops.
 */

import { NasaTelemetry } from "./nasaPowerService";

export interface CropInfo {
  name: string;
  nameSi: string;
  initial: number;
  mid: number;
  mature: number;
  defaultMethod: string;
}

export const IRRIGATION_METHODS: Record<string, { name: string; efficiency: number; description: string }> = {
  drip: { name: "Precision Drip Irrigation", efficiency: 0.90, description: "90% efficiency - minimal evaporation loss" },
  sprinkler: { name: "Overhead Sprinkler", efficiency: 0.75, description: "75% efficiency - moderate wind drift" },
  basin: { name: "Cascade Basin / Flood (Wewa)", efficiency: 0.55, description: "55% efficiency - ancient traditional basin flood" },
  furrow: { name: "Furrow Channel Irrigation", efficiency: 0.60, description: "60% efficiency - channel seepage & runoff" },
};

export const CROP_COEFFICIENTS: Record<string, CropInfo> = {
  paddy: {
    name: "Paddy / Rice",
    nameSi: "Paddy / Rice",
    initial: 1.05, // Flooded nursery & tillering
    mid: 1.20,    // Panicle initiation to flowering
    mature: 0.85, // Grain ripening / pre-harvest
    defaultMethod: "basin",
  },
  tea: {
    name: "Ceylon Tea",
    nameSi: "Ceylon Tea",
    initial: 0.85,
    mid: 1.05,
    mature: 0.95,
    defaultMethod: "sprinkler",
  },
  coconut: {
    name: "Coconut",
    nameSi: "Coconut Palm",
    initial: 0.70,
    mid: 0.80,
    mature: 0.75,
    defaultMethod: "drip",
  },
  maize: {
    name: "Maize / Corn",
    nameSi: "Dry Zone Maize",
    initial: 0.35,
    mid: 1.20,
    mature: 0.60,
    defaultMethod: "furrow",
  },
  chili: {
    name: "Chili & Red Onions",
    nameSi: "Chili & Red Onions",
    initial: 0.60,
    mid: 1.15,
    mature: 0.80,
    defaultMethod: "drip",
  },
  vegetables: {
    name: "Upcountry Vegetables (Potato/Carrot)",
    nameSi: "Upcountry Vegetables",
    initial: 0.50,
    mid: 1.15,
    mature: 0.75,
    defaultMethod: "sprinkler",
  },
  cinnamon: {
    name: "Cinnamon & Spices",
    nameSi: "Cinnamon & Spices",
    initial: 0.70,
    mid: 0.95,
    mature: 0.85,
    defaultMethod: "drip",
  },
};

export interface ET0Result {
  ET0_mm_per_day: number;
  vaporPressureDeficit_kPa: number;
  netRadiation_MJ_m2_day: number;
}

export function calculateFAO56_ET0(
  telemetry: NasaTelemetry,
  altitude_m = 100
): ET0Result {
  const T = telemetry.temperature_C;
  const Tmax = telemetry.tempMax_C;
  const Tmin = telemetry.tempMin_C;
  const RH = telemetry.relativeHumidity_percent;
  const u2 = telemetry.windSpeed_m_s;
  const Rs = telemetry.solarRadiation_MJ_m2_day;

  // 1. Atmospheric pressure P (kPa)
  const P = 101.3 * Math.pow((293 - 0.0065 * altitude_m) / 293, 5.26);

  // 2. Psychrometric constant gamma (kPa/°C)
  const gamma = 0.000665 * P;

  // 3. Slope of saturation vapor pressure curve Delta (kPa/°C)
  const delta =
    (4098 * (0.6108 * Math.exp((17.27 * T) / (T + 237.3)))) /
    Math.pow(T + 237.3, 2);

  // 4. Saturation vapor pressure es (kPa)
  const e0_Tmax = 0.6108 * Math.exp((17.27 * Tmax) / (Tmax + 237.3));
  const e0_Tmin = 0.6108 * Math.exp((17.27 * Tmin) / (Tmin + 237.3));
  const es = (e0_Tmax + e0_Tmin) / 2;

  // 5. Actual vapor pressure ea (kPa)
  const ea = (RH / 100) * es;

  // 6. Net radiation Rn (MJ/m2/day)
  const Rns = (1 - 0.23) * Rs; // Albedo = 0.23
  const Rnl = 0.2 * Rs;
  const Rn = Math.max(Rns - Rnl, 0.1);

  // 7. Full FAO-56 Penman-Monteith Formulation
  const numerator =
    0.408 * delta * Rn + gamma * (900 / (T + 273)) * u2 * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * u2);

  const ET0 = Math.max(numerator / denominator, 0.1);

  return {
    ET0_mm_per_day: parseFloat(ET0.toFixed(2)),
    vaporPressureDeficit_kPa: parseFloat((es - ea).toFixed(3)),
    netRadiation_MJ_m2_day: parseFloat(Rn.toFixed(2)),
  };
}

export interface CropDemandResult {
  cropName: string;
  cropNameSi: string;
  growthStage: string;
  Kc: number;
  ETc_mm_per_day: number;
  netDeficit_mm: number;
  areaHectares: number;
  irrigationMethod: string;
  efficiency: number;
  waterDemandLiters: number;
  grossWaterDemandLiters: number;
  waterWastedByFloodLiters: number;
  waterDemandGallons: number;
  waterDemandAcreFeet: number;
}

export function calculateCropDemand(
  ET0_mm_per_day: number,
  crop = "paddy",
  stage = "mid",
  areaHectares = 1.0,
  recentRain_mm = 0.0,
  method = "basin"
): CropDemandResult {
  const cropData = CROP_COEFFICIENTS[crop.toLowerCase()] || CROP_COEFFICIENTS.paddy;
  const stageKey = stage.toLowerCase() as "initial" | "mid" | "mature";
  const Kc = cropData[stageKey] || cropData.mid;

  // ETc = Kc * ET0 (mm/day)
  const ETc = ET0_mm_per_day * Kc;

  // Net Deficit = ETc - effective precipitation
  const effectiveRain = recentRain_mm * 0.8;
  const netDeficit_mm = Math.max(ETc - effectiveRain, 0.0);

  // Irrigation system efficiency
  const irrigationInfo = IRRIGATION_METHODS[method.toLowerCase()] || IRRIGATION_METHODS.basin;
  const eff = irrigationInfo.efficiency;

  // 1 mm depth over 1 hectare = 10,000 Liters
  const netWaterDemandLiters = netDeficit_mm * areaHectares * 10000;
  const grossWaterDemandLiters = netWaterDemandLiters > 0 ? netWaterDemandLiters / eff : 0;
  
  // Flood irrigation baseline (55% efficiency) vs current method
  const floodBaselineLiters = netWaterDemandLiters > 0 ? netWaterDemandLiters / 0.55 : 0;
  const waterSavedVsFlood = Math.max(floodBaselineLiters - grossWaterDemandLiters, 0);

  const waterDemandGallons = grossWaterDemandLiters * 0.264172;
  const waterDemandAcreFeet = parseFloat((grossWaterDemandLiters / 1233480).toFixed(2));

  return {
    cropName: cropData.name,
    cropNameSi: cropData.nameSi,
    growthStage: stage,
    Kc,
    ETc_mm_per_day: parseFloat(ETc.toFixed(2)),
    netDeficit_mm: parseFloat(netDeficit_mm.toFixed(2)),
    areaHectares,
    irrigationMethod: irrigationInfo.name,
    efficiency: eff,
    waterDemandLiters: Math.round(netWaterDemandLiters),
    grossWaterDemandLiters: Math.round(grossWaterDemandLiters),
    waterWastedByFloodLiters: Math.round(waterSavedVsFlood),
    waterDemandGallons: Math.round(waterDemandGallons),
    waterDemandAcreFeet,
  };
}
