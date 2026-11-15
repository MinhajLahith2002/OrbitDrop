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
}

export default function FieldSummaryBadge({
  field,
  cropName,
  isGeneratingGrid,
  gridData,
  onGenerateGrid,
}: FieldSummaryBadgeProps) {
  if (!field) return null;

  return (
    <div className="absolute top-20 left-6 z-[1000] bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 text-white shadow-2xl max-w-xs animate-in fade-in slide-in-from-top-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Parcel Mapped
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-300">
          {field.areaHectares.toFixed(2)} ha ({field.areaAcres.toFixed(1)} ac)
        </span>
      </div>

      {/* Field Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Crop Variety</div>
          <div className="font-semibold text-slate-100 truncate">{cropName}</div>
        </div>
        <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Boundary</div>
          <div className="font-semibold text-slate-200 font-mono">{Math.round(field.perimeterMeters)} m perimeter</div>
        </div>
      </div>

      {/* Action: ML Soil Moisture Downscaling */}
      <button
        onClick={onGenerateGrid}
        disabled={isGeneratingGrid}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
      >
        {isGeneratingGrid ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
            <span>Scanning Satellite Grid...</span>
          </>
        ) : (
          <>
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>
              {gridData ? `Rescan 30m Dry Spots (${gridData.totalCells} cells)` : "Scan Field for Dry Spots (ML)"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
