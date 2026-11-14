"use client";

import React from "react";
import { Maximize2, Droplets, Grid3X3, Loader2, Trash2, ArrowRight } from "lucide-react";
import { FieldData, DownscalingResult } from "@/types/geo";

interface FieldSummaryBadgeProps {
  field: FieldData | null;
  cropName: string;
  isGeneratingGrid: boolean;
  gridData: DownscalingResult | null;
  onGenerateGrid: () => void;
  onOpenWaterUsage: () => void;
  onClearField: () => void;
}

export default function FieldSummaryBadge({
  field,
  cropName,
  isGeneratingGrid,
  gridData,
  onGenerateGrid,
  onOpenWaterUsage,
  onClearField,
}: FieldSummaryBadgeProps) {
  if (!field) return null;

  return (
    <div className="absolute top-20 left-6 z-[1000] bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-4 text-white shadow-2xl max-w-sm animate-in fade-in slide-in-from-top-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Parcel Active
          </span>
        </div>
        <button
          onClick={onClearField}
          className="text-slate-500 hover:text-rose-400 p-1 transition-colors rounded hover:bg-slate-900"
          title="Clear this field"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Field Metrics */}
      <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
        <div>
          <div className="text-[10px] text-slate-400">Crop Profile</div>
          <div className="text-xs font-bold text-slate-100">{cropName}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Parcel Area</div>
          <div className="text-xs font-bold text-cyan-300 font-mono">
            {field.areaHectares.toFixed(2)} ha{" "}
            <span className="text-[10px] text-slate-400 font-normal">
              ({field.areaAcres.toFixed(1)} ac)
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action: Get Water Usage */}
      <button
        onClick={onOpenWaterUsage}
        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all"
      >
        <Droplets className="w-4 h-4 fill-slate-950" />
        <span>Get Water Usage & Schedule</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Secondary Action: ML Soil Moisture Downscaling */}
      <button
        onClick={onGenerateGrid}
        disabled={isGeneratingGrid}
        className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
      >
        {isGeneratingGrid ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Downscaling 30m Micro-Grid...</span>
          </>
        ) : (
          <>
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {gridData ? `Regenerate ML Grid (${gridData.totalCells} cells)` : "Scan Field for Dry Spots (ML)"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
