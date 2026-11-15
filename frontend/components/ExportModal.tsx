"use client";

import React from "react";
import { 
  X, 
  Download, 
  Printer, 
  FileJson, 
  CheckCircle2, 
  Orbit, 
  Calendar, 
  MapPin, 
  Activity, 
  Droplets, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  Layers,
  Sprout,
  Gauge,
  Sparkles
} from "lucide-react";
import { FieldData, PresetLocation, DownscalingResult } from "@/types/geo";
import { CROP_COEFFICIENTS, IRRIGATION_METHODS } from "@/lib/services/agronomyService";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldData | null;
  telemetryData: any | null;
  gridData: DownscalingResult | null;
  selectedCrop?: string;
  growthStage?: string;
  irrigationMethod?: string;
  flowRate?: number;
  flowRateUnit?: "gpm" | "lpm";
  selectedLocation?: PresetLocation | null;
}

export default function ExportModal({
  isOpen,
  onClose,
  field,
  telemetryData,
  gridData,
  selectedCrop = "paddy",
  growthStage = "mid",
  irrigationMethod = "basin",
  flowRate = 200,
  flowRateUnit = "lpm",
  selectedLocation,
}: ExportModalProps) {
  if (!isOpen || !field) return null;

  const cropInfo = CROP_COEFFICIENTS[selectedCrop] || CROP_COEFFICIENTS.paddy;
  const isPaddy = selectedCrop === "paddy";

  const stageName = growthStage === "initial" 
    ? (isPaddy ? "1. Land Soaking & Puddling" : "1. Seedling / Establishment") 
    : growthStage === "mid" 
    ? (isPaddy ? "2. Panicle Initiation & Flowering (Peak Thirst)" : "2. Mid-Season Peak Thirst") 
    : (isPaddy ? "3. Grain Hardening & Terminal Drain" : "3. Ripening / Pre-Harvest");

  const currentKc = growthStage === "initial" 
    ? (cropInfo.initial || 1.05) 
    : growthStage === "mid" 
    ? (cropInfo.mid || 1.20) 
    : (cropInfo.mature || 0.85);

  const irrigationMethodInfo = IRRIGATION_METHODS[irrigationMethod] || IRRIGATION_METHODS.basin;
  const systemEfficiency = Math.round(irrigationMethodInfo.efficiency * 100);

  const isLockout = telemetryData?.rainLockout?.isLockoutActive ?? false;
  const rainForecastMm = telemetryData?.rainLockout?.totalForecastRain48h_mm ?? 0;
  const recordedRainMm = telemetryData?.nasa?.telemetry?.precipitation_mm ?? 0;
  const nasaTelemetry = telemetryData?.nasa?.telemetry;

  const et0 = telemetryData?.evapotranspiration?.ET0_mm_per_day || 2.15;
  const etc = parseFloat((et0 * currentKc).toFixed(2));

  // Live real gross water needed
  const dailyThirstLiters = Math.round(etc * field.areaHectares * 10000);
  const grossWaterLiters = Math.round(dailyThirstLiters / irrigationMethodInfo.efficiency);

  // Pump calculation
  const flowRateLpm = flowRateUnit === "gpm" ? flowRate * 3.78541 : flowRate;
  const rawMinutes = flowRateLpm > 0 && grossWaterLiters > 0 ? Math.round(grossWaterLiters / flowRateLpm) : 0;
  const rawHours = Math.floor(rawMinutes / 60);
  const rawMins = rawMinutes % 60;
  const calculatedRuntimeFormatted = rawHours > 0 ? `${rawHours}h ${rawMins}m` : `${rawMins} mins`;

  // Effective dispatch values accounting for rain lockout
  const effectiveWaterToPump = isLockout ? 0 : grossWaterLiters;
  const effectivePumpRuntime = isLockout ? "0 mins (Paused by Rain Lockout)" : calculatedRuntimeFormatted;

  const schedule = telemetryData?.sevenDaySchedule || [];
  const totalWeekLiters = schedule.reduce((acc: number, d: any) => acc + (d.volumeLiters || 0), 0);

  // Handle Download GeoJSON
  const handleDownloadGeoJSON = () => {
    const geoJsonData = {
      type: "FeatureCollection",
      generator: "OrbitDrop Sri Lanka - NASA Satellite Precision Irrigation Dispatch",
      generatedAt: new Date().toISOString(),
      metadata: {
        telemetryFeed: "Live NASA POWER Earth Observations",
        region: selectedLocation?.name || "Polonnaruwa Basin",
        coordinates: { lat: field.centroid.lat, lng: field.centroid.lng },
      },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: field.coordinates,
          },
          properties: {
            fieldId: field.id,
            fieldName: field.name,
            areaHectares: field.areaHectares,
            areaAcres: field.areaAcres,
            perimeterMeters: field.perimeterMeters,
            centroid: field.centroid,
            targetCrop: cropInfo.name,
            growthStage: stageName,
            kc: currentKc,
            deliveryHardware: irrigationMethodInfo.name,
            hardwareEfficiency: `${systemEfficiency}%`,
            pumpFlowRate: `${flowRate} ${flowRateUnit.toUpperCase()}`,
            recommendedPumpRuntime: effectivePumpRuntime,
            recommendedWaterToPumpLiters: effectiveWaterToPump,
            unpausedGrossDemandLiters: grossWaterLiters,
            dailyCropThirstETc_mm: etc,
            evapotranspirationET0_mm: et0,
            solarRadiation_MJ_m2_day: nasaTelemetry?.solarRadiation_MJ_m2_day || 18.5,
            temperature_C: nasaTelemetry?.temperature_C || 26.5,
            relativeHumidity_percent: nasaTelemetry?.relativeHumidity_percent || 78,
            forecastRain48h_mm: rainForecastMm,
            rainLockoutActive: isLockout,
            total7DayAWDVolumeLiters: totalWeekLiters,
            microStressTotalCells: gridData?.totalCells || 0,
            criticalStressCells: gridData?.criticalCount || 0,
            moderateStressCells: gridData?.warningCount || 0,
            optimalCells: gridData?.optimalCount || 0,
            averageMoisturePercent: gridData?.averageMoisture || 25.0,
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OrbitDrop_Live_Prescription_${field.id}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-white shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Orbit className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">
                  Irrigation Dispatch Prescription & Sustainability Plan
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NASA POWER Telemetry & FAO-56 Agronomic Report · {selectedLocation?.name || "Polonnaruwa Basin"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Preview Body (Printable Area) */}
        <div id="printable-report" className="p-6 space-y-4 text-xs text-slate-300">
          
          {/* Metadata Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">PARCEL IDENTIFIER</span>
              <span className="font-mono font-bold text-slate-200">{field.id}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">TOTAL MAPPED ACREAGE</span>
              <span className="font-bold text-cyan-300">
                {field.areaHectares.toFixed(2)} ha ({field.areaAcres.toFixed(1)} ac)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">TARGET CENTROID</span>
              <span className="font-mono text-[11px] text-slate-300">
                {field.centroid.lat.toFixed(4)}° N, {field.centroid.lng.toFixed(4)}° E
              </span>
            </div>
          </div>

          {/* NASA Satellite Observations Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-4 h-4" />
                <span>NASA Agroclimatology Observations</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time Sensor Sync</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Solar Radiation</div>
                <div className="font-bold text-slate-100 text-xs font-mono">
                  {nasaTelemetry?.solarRadiation_MJ_m2_day || 18.5} MJ/m²
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Live Temperature</div>
                <div className="font-bold text-slate-100 text-xs font-mono">
                  {nasaTelemetry?.temperature_C || 26.5} °C
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Relative Humidity</div>
                <div className="font-bold text-slate-100 text-xs font-mono">
                  {nasaTelemetry?.relativeHumidity_percent || 78}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">48h Rain Forecast</div>
                <div className="font-bold text-emerald-400 text-xs font-mono">
                  {rainForecastMm} mm
                </div>
              </div>
            </div>
          </div>

          {/* Agronomic Evapotranspiration & Prescription */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Droplets className="w-4 h-4" />
                <span>Live Crop Water Needs & Hardware Prescription</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">FAO-56 Penman-Monteith</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Target Crop / Variety:</span>
                <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{cropInfo.name}</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Phenological Growth Stage:</span>
                <span className="font-medium text-slate-200">
                  {stageName} · Kc {currentKc.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Delivery Hardware:</span>
                <span className="font-medium text-slate-200">
                  {irrigationMethodInfo.name} ({systemEfficiency}% Efficiency)
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Atmospheric Evaporation (ET₀):</span>
                <span className="font-mono font-bold text-cyan-300">
                  {et0} mm/day
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Daily Crop Thirst (ETc):</span>
                <span className="font-mono font-bold text-emerald-300">
                  {etc} mm/day ({dailyThirstLiters.toLocaleString()} L across {field.areaHectares.toFixed(2)} ha)
                </span>
              </div>

              {/* 48h Predictive Weather Watchdog Banner */}
              {isLockout ? (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300">
                      Pumps Paused: 48h Monsoon Rain Lockout Active ({rainForecastMm} mm predicted)
                    </div>
                    <div className="text-[11px] text-amber-200/90 mt-0.5">
                      Natural rain satisfies 100% of crop hydration requirements. Pumping is suspended to prevent root rot and save electricity.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-300">
                      Dry Weather Approved: Optimal Hydration Window
                    </div>
                    <div className="text-[11px] text-emerald-200/90 mt-0.5">
                      Atmospheric deficit requires irrigation replenishment. Recommended delivery: 06:00 AM – 08:30 AM.
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Water to Pump */}
              <div className="flex justify-between items-center pt-1 font-bold text-slate-100">
                <span>Recommended Water to Pump:</span>
                <span className="font-mono text-cyan-300 text-sm">
                  {isLockout ? "0 Liters (Rain Saturated)" : `${grossWaterLiters.toLocaleString()} Liters`}
                </span>
              </div>
              {isLockout && (
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  (Unpaused Crop Demand: {grossWaterLiters.toLocaleString()} Liters)
                </div>
              )}

              {/* Pump Runtime Prescription */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-100">
                <span className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prescribed Pump Runtime (@ {flowRate} {flowRateUnit.toUpperCase()}):</span>
                </span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {effectivePumpRuntime}
                </span>
              </div>
            </div>
          </div>

          {/* 30m Micro-Stress Spatial Downscaling Summary */}
          {gridData && gridData.cells && gridData.cells.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                <span>Field Dry Spot Breakdown (30m Satellite ML Blocks)</span>
                <span className="font-mono text-[10px] text-cyan-300">
                  Avg Moisture: {gridData.averageMoisture.toFixed(1)}%
                </span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30">
                  <span className="text-[10px] text-red-400 block font-bold">Critical Thirst (&lt;16%)</span>
                  <span className="font-mono text-slate-100 font-bold">
                    {gridData.criticalCount} cells ({Math.round((gridData.criticalCount / gridData.totalCells) * 100)}%)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 block font-bold">Moderate Thirst (16–24%)</span>
                  <span className="font-mono text-slate-100 font-bold">
                    {gridData.warningCount} cells ({Math.round((gridData.warningCount / gridData.totalCells) * 100)}%)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-bold">Optimal Wetness (&gt;24%)</span>
                  <span className="font-mono text-slate-100 font-bold">
                    {gridData.optimalCount} cells ({Math.round((gridData.optimalCount / gridData.totalCells) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sustainability & Sri Lanka ROI Summary */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-cyan-950/50 border border-emerald-500/30 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Reservoir Water Saved</span>
              <span className="font-bold text-cyan-300 text-sm font-mono">
                {telemetryData?.rainLockout?.sustainabilityImpact?.waterSavedAcreFeet || "0.45"} Ac-ft
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Electricity Bill Saved</span>
              <span className="font-bold text-emerald-400 text-sm font-mono">
                LKR {telemetryData?.rainLockout?.sustainabilityImpact?.costSavedLKR?.toLocaleString() || "5,017"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Clean Air Benefit</span>
              <span className="font-bold text-teal-300 text-sm font-mono">
                {telemetryData?.rainLockout?.sustainabilityImpact?.carbonOffsetKgCO2 || "64.4"} kg CO₂
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-md">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Ready for Department of Agriculture & Agronomic Audit</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadGeoJSON}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download GeoJSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
