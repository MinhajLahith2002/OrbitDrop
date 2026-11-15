"use client";

import React from "react";
import { Satellite, MapPin, Sprout, Orbit, Download, RotateCcw } from "lucide-react";

interface HeaderProps {
  onReset?: () => void;
  onOpenExport?: () => void;
  activeFieldPresent?: boolean;
  locationName?: string;
  activeCropName?: string;
}

export default function Header({
  onReset,
  onOpenExport,
  activeFieldPresent,
  locationName = "Polonnaruwa Basin",
  activeCropName = "Rice / Paddy",
}: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] bg-slate-950/90 backdrop-blur-md border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between text-white shadow-2xl">
      {/* Brand & Mission */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Orbit className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-emerald-400 bg-clip-text text-transparent">
              OrbitDrop Sri Lanka
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              Paddy Water Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Precision Irrigation, FAO-56 Penman-Monteith & 48h Rain Lockout
          </p>
        </div>
      </div>

      {/* Middle: Clean Status Info (No duplicate buttons) */}
      <div className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <Sprout className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold text-slate-200">{activeCropName}</span>
        <span className="text-slate-600">·</span>
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-300">{locationName}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">Esri Satellite Basemap</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </div>

        {activeFieldPresent && onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-xs font-semibold text-cyan-200 transition-all shadow-md hover:shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Plan</span>
          </button>
        )}

        {activeFieldPresent && onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-xs font-medium text-rose-300 transition-all shadow-md hover:shadow-rose-500/20"
            title="Clear current field geometry"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Clear Field</span>
          </button>
        )}
      </div>
    </header>
  );
}
