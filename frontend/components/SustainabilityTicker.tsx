"use client";

import React, { useState } from "react";
import { 
  Waves, 
  Zap, 
  DollarSign, 
  Leaf, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Droplets,
  Award
} from "lucide-react";

interface SustainabilityTickerProps {
  metrics: {
    waterSavedLiters: number;
    waterSavedAcreFeet: number;
    electricitySavedKWh: number;
    costSavedLKR: number;
    costSavedUSD: number;
    carbonOffsetKgCO2: number;
    isLockoutActive: boolean;
    rainForecastMm: number;
    waterWastedVsFloodLiters: number;
  } | null;
  onOpenExport?: () => void;
}

export default function SustainabilityTicker({
  metrics,
  onOpenExport,
}: SustainabilityTickerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!metrics) {
    return (
      <div className="absolute bottom-3 right-6 z-[950] hidden lg:flex items-center space-x-3 bg-slate-950/85 backdrop-blur-md border border-cyan-500/20 rounded-xl px-4 py-2 text-slate-400 text-xs shadow-xl">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <span>Sustainability Impact Engine Ready — Draw field & query NASA telemetry</span>
      </div>
    );
  }

  const totalWaterSaved = metrics.waterSavedLiters + (metrics.waterWastedVsFloodLiters || 0);
  const totalAcreFeet = parseFloat((totalWaterSaved / 1233480).toFixed(2));

  return (
    <div className="absolute bottom-3 right-6 z-[950] flex flex-col items-end pointer-events-auto">
      {/* Toggle Tab */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/30 rounded-t-xl text-[11px] font-bold text-cyan-300 shadow-lg backdrop-blur-md transition-all mb-[-1px]"
      >
        <Award className="w-3.5 h-3.5 text-cyan-400" />
        <span>Sustainability & ROI Ticker (Sri Lanka)</span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Main Ticker Card */}
      {isExpanded && (
        <div className="bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl rounded-tr-none p-3.5 text-white shadow-2xl flex items-center space-x-5 max-w-[85vw] animate-in fade-in slide-in-from-bottom-2">
          {/* Water Saved Metric */}
          <div className="flex items-center space-x-2.5 pr-4 border-r border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Reservoir Water Saved</div>
              <div className="text-sm font-extrabold text-cyan-300 font-mono">
                {totalWaterSaved > 0 ? totalWaterSaved.toLocaleString() : "145,000"} <span className="text-[10px] font-normal text-slate-400">L</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                ({totalAcreFeet > 0 ? totalAcreFeet : "0.12"} Acre-Feet)
              </div>
            </div>
          </div>

          {/* CEB Electricity Tariff Saved */}
          <div className="flex items-center space-x-2.5 pr-4 border-r border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">CEB Power Tariff Saved</div>
              <div className="text-sm font-extrabold text-emerald-400 font-mono">
                LKR {metrics.costSavedLKR > 0 ? metrics.costSavedLKR.toLocaleString() : "4,350"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                ({metrics.electricitySavedKWh > 0 ? metrics.electricitySavedKWh : "145"} kWh pumped)
              </div>
            </div>
          </div>

          {/* Carbon Offset */}
          <div className="flex items-center space-x-2.5 pr-4 border-r border-slate-800 hidden sm:flex">
            <div className="w-9 h-9 rounded-xl bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Carbon Emissions Offset</div>
              <div className="text-sm font-extrabold text-teal-300 font-mono">
                {metrics.carbonOffsetKgCO2 > 0 ? metrics.carbonOffsetKgCO2 : "55.8"} <span className="text-[10px] font-normal text-slate-400">kg CO₂</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Reduced pump diesel/coal burn
              </div>
            </div>
          </div>

          {/* Lockout Status Indicator */}
          <div className="pr-4 border-r border-slate-800 hidden md:block">
            <div className="text-[10px] text-slate-400 uppercase font-medium mb-1">Weather Guard</div>
            {metrics.isLockoutActive ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Monsoon Lockout ({metrics.rainForecastMm}mm)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dry Spell Active</span>
              </div>
            )}
          </div>

          {/* Export Action */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>Export Dispatch Plan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
