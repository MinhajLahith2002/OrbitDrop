"use client";

import React, { useState, useRef, useEffect } from "react";
import { Satellite, MapPin, Sprout, Orbit, Download, RotateCcw, ChevronDown } from "lucide-react";
import { PresetLocation } from "@/types/geo";
import { PRESET_FARMLANDS } from "./PresetsBar";

interface HeaderProps {
  onReset?: () => void;
  onOpenExport?: () => void;
  activeFieldPresent?: boolean;
  locationName?: string;
  activeCropName?: string;
  onSelectPreset?: (preset: PresetLocation) => void;
}

export default function Header({
  onReset,
  onOpenExport,
  activeFieldPresent,
  locationName = "Polonnaruwa Basin",
  activeCropName = "Rice / Paddy",
  onSelectPreset,
}: HeaderProps) {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* Middle: Clean Interactive Status & Basin Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => onSelectPreset && setIsLocationDropdownOpen(!isLocationDropdownOpen)}
          className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-xs transition-all shadow-sm"
          title="Click to switch Sri Lankan agricultural region"
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">{activeCropName}</span>
          <span className="text-slate-600">·</span>
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-medium">{locationName}</span>
          {onSelectPreset && <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />}
        </button>

        {/* Location Dropdown */}
        {isLocationDropdownOpen && onSelectPreset && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-2 shadow-2xl z-[1200] animate-in fade-in slide-in-from-top-2 space-y-1">
            <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
              Select Agricultural Basin
            </div>
            {PRESET_FARMLANDS.map((preset) => {
              const isSelected = preset.name === locationName;
              const liveTempMap: Record<string, string> = {
                "Polonnaruwa Basin": "25.8°C",
                "Anuradhapura Farmlands": "26.5°C",
                "Nuwara Eliya Terraces": "15.8°C",
                "Kurunegala Belt": "26.2°C",
                "Jaffna Peninsula": "27.5°C",
                "Ampara (Digamadulla)": "27.4°C",
              };
              const liveTemp = liveTempMap[preset.name] || "26°C";

              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    onSelectPreset(preset);
                    setIsLocationDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-semibold"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-100 flex items-center space-x-1.5">
                      <span>{preset.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                        {liveTemp}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{preset.region}</div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                </button>
              );
            })}
          </div>
        )}
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
