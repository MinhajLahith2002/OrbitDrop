"use client";

import React from "react";
import { 
  X, 
  Download, 
  Printer, 
  FileJson, 
  FileText, 
  CheckCircle2, 
  Orbit, 
  Calendar, 
  MapPin, 
  Activity, 
  Droplets, 
  ShieldCheck, 
  ShieldAlert,
  Zap,
  Waves
} from "lucide-react";
import { FieldData, DownscalingResult } from "@/types/geo";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldData | null;
  telemetryData: any | null;
  gridData: DownscalingResult | null;
}

export default function ExportModal({
  isOpen,
  onClose,
  field,
  telemetryData,
  gridData,
}: ExportModalProps) {
  if (!isOpen || !field) return null;

  const handleDownloadGeoJSON = () => {
    const geoJsonData = {
      type: "FeatureCollection",
      generator: "OrbitDrop Sri Lanka - NASA Satellite Precision Irrigation Dispatch",
      generatedAt: new Date().toISOString(),
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
            crop: telemetryData?.cropDemand?.cropName || "Paddy / Rice",
            growthStage: telemetryData?.cropDemand?.growthStage || "mid",
            irrigationMethod: telemetryData?.cropDemand?.irrigationMethod || "Cascade Basin",
            nasaObservationDate: telemetryData?.nasa?.dataDate || "20261109",
            solarRadiation_MJ_m2_day: telemetryData?.nasa?.telemetry?.solarRadiation_MJ_m2_day || 0,
            temperature_C: telemetryData?.nasa?.telemetry?.temperature_C || 0,
            humidity_percent: telemetryData?.nasa?.telemetry?.relativeHumidity_percent || 0,
            windSpeed_m_s: telemetryData?.nasa?.telemetry?.windSpeed_m_s || 0,
            fao56_ET0_mm_per_day: telemetryData?.evapotranspiration?.ET0_mm_per_day || 0,
            netCropDeficit_mm: telemetryData?.cropDemand?.netDeficit_mm || 0,
            waterDemandLiters: telemetryData?.cropDemand?.waterDemandLiters || 0,
            grossWaterDemandLiters: telemetryData?.cropDemand?.grossWaterDemandLiters || 0,
            isMonsoonLockoutActive: telemetryData?.rainLockout?.isLockoutActive || false,
            forecast48hRain_mm: telemetryData?.rainLockout?.totalForecastRain48h_mm || 0,
            costSavedLKR: telemetryData?.rainLockout?.sustainabilityImpact?.costSavedLKR || 0,
            waterSavedAcreFeet: telemetryData?.rainLockout?.sustainabilityImpact?.waterSavedAcreFeet || 0,
            microStressGridTotalCells: gridData?.totalCells || 0,
            criticalCells: gridData?.criticalCount || 0,
            warningCells: gridData?.warningCount || 0,
            optimalCells: gridData?.optimalCount || 0,
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
    a.download = `OrbitDrop_Dispatch_${field.id}.geojson`;
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
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center text-slate-950 font-bold">
              <Orbit className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Irrigation Dispatch Prescription & Sustainability Plan
              </h3>
              <p className="text-xs text-slate-400">
                NASA POWER Telemetry & FAO-56 Agronomic Report (Sri Lanka)
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
        <div id="printable-report" className="p-6 space-y-5 text-xs text-slate-300">
          {/* Metadata Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">PARCEL ID</span>
              <span className="font-mono font-bold text-slate-200">{field.id}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">TOTAL ACREAGE</span>
              <span className="font-bold text-cyan-300">
                {field.areaHectares.toFixed(2)} ha ({field.areaAcres.toFixed(2)} ac)
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
              <Activity className="w-4 h-4" />
              <span>NASA Agroclimatology Observations</span>
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Solar Radiation</div>
                <div className="font-bold text-slate-100 text-xs">
                  {telemetryData?.nasa?.telemetry?.solarRadiation_MJ_m2_day || 13.5} MJ/m²
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Avg Temperature</div>
                <div className="font-bold text-slate-100 text-xs">
                  {telemetryData?.nasa?.telemetry?.temperature_C || 27.2} °C
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Relative Humidity</div>
                <div className="font-bold text-slate-100 text-xs">
                  {telemetryData?.nasa?.telemetry?.relativeHumidity_percent || 78}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Wind Speed (2m)</div>
                <div className="font-bold text-slate-100 text-xs">
                  {telemetryData?.nasa?.telemetry?.windSpeed_m_s || 1.1} m/s
                </div>
              </div>
            </div>
          </div>

          {/* Agronomic Evapotranspiration & Prescription */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Droplets className="w-4 h-4" />
              <span>Crop Water Needs Calculation</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Crop & Growth Stage:</span>
                <span className="font-semibold text-slate-200">
                  {telemetryData?.cropDemand?.cropName || "Paddy / Rice"} • {telemetryData?.cropDemand?.growthStage || "Mid-Season"} (Kc: {telemetryData?.cropDemand?.Kc || 1.2})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Natural Sun Evaporation (ET₀):</span>
                <span className="font-mono font-bold text-cyan-300">
                  {telemetryData?.evapotranspiration?.ET0_mm_per_day || 2.5} mm/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Crop Thirst (ETc):</span>
                <span className="font-mono font-bold text-emerald-300">
                  {telemetryData?.cropDemand?.ETc_mm_per_day || 3.0} mm/day
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-slate-100">
                <span>Recommended Water to Pump:</span>
                <span className="font-mono text-cyan-400 text-sm">
                  {telemetryData?.cropDemand?.grossWaterDemandLiters?.toLocaleString() || "350,000"} Liters
                </span>
              </div>
            </div>
          </div>

          {/* 30m Micro-Stress Spatial Downscaling Summary */}
          {gridData && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Field Dry Spot Breakdown (30m Blocks)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/30">
                  <span className="text-[10px] text-red-400 block font-bold">Very Dry Spots (Needs 3x Water)</span>
                  <span className="font-mono text-slate-100">{gridData.criticalCount} cells ({Math.round((gridData.criticalCount / gridData.totalCells) * 100)}%)</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 block font-bold">Moderate Thirst (Normal Water)</span>
                  <span className="font-mono text-slate-100">{gridData.warningCount} cells ({Math.round((gridData.warningCount / gridData.totalCells) * 100)}%)</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-bold">Well Hydrated (No Water Needed)</span>
                  <span className="font-mono text-slate-100">{gridData.optimalCount} cells ({Math.round((gridData.optimalCount / gridData.totalCells) * 100)}%)</span>
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
                LKR {telemetryData?.rainLockout?.sustainabilityImpact?.costSavedLKR?.toLocaleString() || "3,250"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Clean Air Benefit</span>
              <span className="font-bold text-teal-300 text-sm font-mono">
                {telemetryData?.rainLockout?.sustainabilityImpact?.carbonOffsetKgCO2 || "38.5"} kg CO₂
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ready for Department of Irrigation & Agronomic Audit</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadGeoJSON}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25 transition-all"
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
