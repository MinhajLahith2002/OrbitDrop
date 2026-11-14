/**
 * Agronomy Engine (Sri Lanka Agro-Ecological Focus)
 * FAO-56 Penman-Monteith ET0, Kc coefficients & Water Deficit
 */

export const IRRIGATION_METHODS = {
  drip: { name: "Precision Drip Irrigation", efficiency: 0.90, description: "90% efficiency - minimal evaporation loss" },
  sprinkler: { name: "Overhead Sprinkler", efficiency: 0.75, description: "75% efficiency - moderate wind drift" },
  basin: { name: "Cascade Basin / Flood (Wewa)", efficiency: 0.55, description: "55% efficiency - ancient traditional basin flood" },
  furrow: { name: "Furrow Channel Irrigation", efficiency: 0.60, description: "60% efficiency - channel seepage & runoff" },
};

export const CROP_COEFFICIENTS = {
  paddy: {
    name: "Paddy / Rice",
    nameSi: "වී (Rice Paddy)",
    initial: 1.05,
    mid: 1.20,
    mature: 0.85,
    defaultMethod: "basin",
  },
  tea: {
    name: "Ceylon Tea",
    nameSi: "තේ (Ceylon Tea)",
    initial: 0.85,
    mid: 1.05,
    mature: 0.95,
    defaultMethod: "sprinkler",
  },
  coconut: {
    name: "Coconut",
    nameSi: "පොල් (Coconut Palm)",
    initial: 0.70,
    mid: 0.80,
    mature: 0.75,
    defaultMethod: "drip",
  },
  maize: {
    name: "Maize / Corn",
    nameSi: "බඩ ඉරිඟු (Dry Zone Maize)",
    initial: 0.35,
    mid: 1.20,
    mature: 0.60,
    defaultMethod: "furrow",
  },
  chili: {
    name: "Chili & Red Onions",
    nameSi: "මිරිස් / රතු ළූණු (Jaffna & Dry Zone)",
    initial: 0.60,
    mid: 1.15,
    mature: 0.80,
    defaultMethod: "drip",
  },
  vegetables: {
    name: "Upcountry Vegetables (Potato/Carrot)",
    nameSi: "උඩරට එළවළු (Nuwara Eliya)",
    initial: 0.50,
    mid: 1.15,
    mature: 0.75,
    defaultMethod: "sprinkler",
  },
  cinnamon: {
    name: "Cinnamon & Spices",
    nameSi: "කුරුඳු (Cinnamon & Spices)",
    initial: 0.70,
    mid: 0.95,
    mature: 0.85,
    defaultMethod: "drip",
  },
};

export function calculateFAO56_ET0(telemetry, altitude_m = 100) {
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
  const es = (e0_Tmax + e0_Tmin) / 2;
  const ea = (RH / 100) * es;

  const Rns = (1 - 0.23) * Rs;
  const Rnl = 0.2 * Rs;
  const Rn = Math.max(Rns - Rnl, 0.1);

  const numerator = 0.408 * delta * Rn + gamma * (900 / (T + 273)) * u2 * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * u2);

  const ET0 = Math.max(numerator / denominator, 0.1);

  return {
    ET0_mm_per_day: parseFloat(ET0.toFixed(2)),
    vaporPressureDeficit_kPa: parseFloat((es - ea).toFixed(3)),
    netRadiation_MJ_m2_day: parseFloat(Rn.toFixed(2)),
  };
}

export function calculateCropDemand(ET0_mm_per_day, crop = "paddy", stage = "mid", areaHectares = 1.0, recentRain_mm = 0.0, method = "basin") {
  const cropData = CROP_COEFFICIENTS[crop.toLowerCase()] || CROP_COEFFICIENTS.paddy;
  const Kc = cropData[stage.toLowerCase()] || cropData.mid;

  const ETc = ET0_mm_per_day * Kc;
  const effectiveRain = recentRain_mm * 0.8;
  const netDeficit_mm = Math.max(ETc - effectiveRain, 0.0);

  const irrigationInfo = IRRIGATION_METHODS[method.toLowerCase()] || IRRIGATION_METHODS.basin;
  const eff = irrigationInfo.efficiency;

  const netWaterDemandLiters = netDeficit_mm * areaHectares * 10000;
  const grossWaterDemandLiters = netWaterDemandLiters > 0 ? netWaterDemandLiters / eff : 0;
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
