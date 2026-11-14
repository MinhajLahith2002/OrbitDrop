import { NextRequest, NextResponse } from "next/server";
import { fetchNasaTelemetry } from "@/lib/services/nasaPowerService";
import { calculateFAO56_ET0, calculateCropDemand } from "@/lib/services/agronomyService";
import { evaluateRainLockout } from "@/lib/services/lockoutService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      latitude,
      longitude,
      areaHectares = 1.0,
      crop = "paddy",
      growthStage = "mid",
      irrigationMethod = "basin",
      simulateStorm = false,
    } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing latitude or longitude coordinates" },
        { status: 400 }
      );
    }

    // 1. Ingest NASA POWER telemetry & 7-day time series
    const nasaData = await fetchNasaTelemetry(latitude, longitude);

    // 2. Compute FAO-56 Penman-Monteith ET0 for latest recorded telemetry
    const et0Result = calculateFAO56_ET0(nasaData.telemetry);

    // 3. Compute Crop Water Demand & Deficit with Irrigation Method Efficiency
    const cropResult = calculateCropDemand(
      et0Result.ET0_mm_per_day,
      crop,
      growthStage,
      areaHectares,
      nasaData.telemetry.precipitation_mm,
      irrigationMethod
    );

    // 4. Compute 7-day historical ET0 & ETc timeline
    const historyWithET0 = (nasaData.history || []).map((record) => {
      const dayET0 = calculateFAO56_ET0(record);
      const dayDemand = calculateCropDemand(
        dayET0.ET0_mm_per_day,
        crop,
        growthStage,
        areaHectares,
        record.precipitation_mm,
        irrigationMethod
      );
      return {
        date: record.date,
        formattedDate: record.formattedDate,
        solarRadiation: record.solarRadiation_MJ_m2_day,
        temperature: record.temperature_C,
        tempMax: record.tempMax_C,
        tempMin: record.tempMin_C,
        humidity: record.relativeHumidity_percent,
        windSpeed: record.windSpeed_m_s,
        precipitation: record.precipitation_mm,
        ET0_mm_per_day: dayET0.ET0_mm_per_day,
        ETc_mm_per_day: dayDemand.ETc_mm_per_day,
        waterDemandLiters: dayDemand.waterDemandLiters,
        vpd_kPa: dayET0.vaporPressureDeficit_kPa,
      };
    });

    // 5. Evaluate Rain Forecast & Smart Lockout (with storm simulation option)
    const lockoutResult = await evaluateRainLockout(
      latitude,
      longitude,
      cropResult.netDeficit_mm,
      areaHectares,
      simulateStorm
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      coordinates: { latitude, longitude },
      nasa: {
        success: nasaData.success,
        isFallback: nasaData.isFallback,
        dataDate: nasaData.dataDate,
        telemetry: nasaData.telemetry,
      },
      evapotranspiration: et0Result,
      cropDemand: cropResult,
      historyTimeline: historyWithET0,
      rainLockout: lockoutResult,
    });
  } catch (error: any) {
    console.error("[API Telemetry] Error:", error);
    return NextResponse.json(
      { error: "Internal error processing telemetry", details: error.message },
      { status: 500 }
    );
  }
}
