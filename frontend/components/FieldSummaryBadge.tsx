"use client";

import React from "react";
import { Maximize2, Droplets, Grid3X3, Loader2, Trash2, ArrowRight, Clock, Sparkles } from "lucide-react";
import { FieldData, DownscalingResult } from "@/types/geo";

interface FieldSummaryBadgeProps {
  field: FieldData | null;
  cropName: string;
  isGeneratingGrid: boolean;
  gridData: DownscalingResult | null;
  onGenerateGrid: () => void;
  telemetryData?: any;
  flowRate?: number;
  flowRateUnit?: "gpm" | "lpm";
  onOpenDetails?: () => void;
  onClearField?: () => void;
}

export default function FieldSummaryBadge({
  field,
  cropName,
  isGeneratingGrid,
  gridData,
  onGenerateGrid,
  telemetryData,
  flowRate = 200,
  flowRateUnit = "lpm",
  onOpenDetails,
  onClearField,
}: FieldSummaryBadgeProps) {
  if (!field) return null;

  const grossLiters = telemetryData?.cropDemand?.grossWaterDemandLiters 
    ? telemetryData.cropDemand.grossWaterDemandLiters 
    : Math.round(27400 * field.areaHectares / 0.55);

  const flowRateLpm = flowRateUnit === "gpm" ? flowRate * 3.78541 : flowRate;
  const rawMinutes = flowRateLpm > 0 && grossLiters > 0 ? Math.round(grossLiters / flowRateLpm) : 0;
  const rawHours = Math.floor(rawMinutes / 60);
  const rawMins = rawMinutes % 60;
  const runtimeFormatted = rawHours > 0 ? `${rawHours}h ${rawMins}m` : `${rawMins} mins`;

  return (
    <div className="absolute top-20 left-6 z-[1000] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 text-white shadow-2xl max-w-xs animate-in fade-in slide-in-from-top-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Parcel Active
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-300">
          {field.areaHectares.toFixed(2)} ha ({field.areaAcres.toFixed(1)} ac)
        </span>
      </div>

      {/* Field Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Crop Profile</div>
          <div className="font-semibold text-slate-100 truncate">{cropName}</div>
        </div>
        <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Boundary</div>
          <div className="font-semibold text-slate-200 font-mono">{Math.round(field.perimeterMeters)} m perimeter</div>
        </div>
        <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Gross Water Need</div>
          <div className="font-bold text-sky-300 font-mono">{grossLiters.toLocaleString()} L</div>
        </div>
        <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Pump Run (@ {flowRate} {flowRateUnit.toUpperCase()})</div>
          <div className="font-bold text-amber-300 font-mono">{runtimeFormatted}</div>
        </div>
      </div>

      {/* Action: Open Command Deck Details */}
      {onOpenDetails && (
        <button
          onClick={onOpenDetails}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-emerald-400 hover:from-cyan-500 hover:to-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-cyan-500/25"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>View Water Prescription & 7-Day Plan</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      )}

      {/* Action: ML Soil Moisture Downscaling */}
      <button
        onClick={onGenerateGrid}
        disabled={isGeneratingGrid}
        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
      >
        {isGeneratingGrid ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
            <span>Scanning Satellite Grid...</span>
          </>
        ) : (
          <>
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {gridData ? `Rescan 30m Dry Spots (${gridData.totalCells} cells)` : "Scan Field for Dry Spots (ML)"}
            </span>
          </>
        )}
      </button>

      {/* Action: Delete / Clear Field Boundary */}
      {onClearField && (
        <button
          onClick={onClearField}
          className="w-full py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 font-semibold text-[11px] flex items-center justify-center space-x-1.5 transition-all"
          title="Delete current mapped field"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear / Delete Field</span>
        </button>
      )}
    </div>
  );
}
