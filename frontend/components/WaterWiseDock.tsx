"use client";

import React from "react";
import { Sprout, MapPin, Droplets, Bot, Waves, Sparkles } from "lucide-react";

interface WaterWiseDockProps {
  onOpenCropInfo: () => void;
  onOpenLocation: () => void;
  onOpenWaterUsage: () => void;
  onOpenSproutAI: () => void;
  onToggleSpray: () => void;
  isIrrigating: boolean;
  activeCropName: string;
  hasActiveField: boolean;
}

export default function WaterWiseDock({
  onOpenCropInfo,
  onOpenLocation,
  onOpenWaterUsage,
  onOpenSproutAI,
  onToggleSpray,
  isIrrigating,
  activeCropName,
  hasActiveField,
}: WaterWiseDockProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 shadow-2xl space-x-1.5 animate-in fade-in slide-in-from-bottom-4">
      {/* 1. Set Crop Info */}
      <button
        onClick={onOpenCropInfo}
        className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 hover:text-cyan-200 transition-all shadow-md group"
        title="Choose from 35+ crop types, growth stages and pump flow rate"
      >
        <Sprout className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        <span>Set Crop Info</span>
        <span className="hidden md:inline text-[10px] text-slate-500 font-mono">({activeCropName})</span>
      </button>

      {/* 2. Set Farm Location */}
      <button
        onClick={onOpenLocation}
        className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 hover:text-cyan-200 transition-all shadow-md group"
        title="Jump to Sri Lankan agricultural basins or enter Lat/Long"
      >
        <MapPin className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span>Set Farm Location</span>
      </button>

      {/* 3. Get Water Usage */}
      <button
        onClick={onOpenWaterUsage}
        className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-sky-950/90 hover:from-cyan-900 hover:to-sky-900 border border-cyan-500/50 text-xs font-bold text-cyan-200 transition-all shadow-md group"
        title="Calculate crop water needs and 7-day pump runtime schedule"
      >
        <Droplets className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span>Get Water Usage</span>
      </button>

      {/* 4. Sprout AI Copilot */}
      <button
        onClick={onOpenSproutAI}
        className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/50 text-xs font-bold text-emerald-300 transition-all shadow-md group"
        title="Ask Sprout AI about your field, weather risks and pump timing"
      >
        <Bot className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span>Sprout AI</span>
        <span className="hidden sm:inline w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
      </button>

      {/* 5. Precision Spray Trigger */}
      {hasActiveField && (
        <button
          onClick={onToggleSpray}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-lg ${
            isIrrigating
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse"
              : "bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-cyan-500/25"
          }`}
          title="Watch 60 FPS water spray animation over thirsty field spots"
        >
          <Waves className="w-4 h-4" />
          <span>{isIrrigating ? "Stop Spray" : "Smart Spray"}</span>
        </button>
      )}
    </div>
  );
}
