"use client";

import React, { useState } from "react";
import { X, Sprout, Droplets, Gauge, ArrowRight } from "lucide-react";
import { CROP_COEFFICIENTS, IRRIGATION_METHODS } from "@/lib/services/agronomyService";

interface CropInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCrop: string;
  onSelectCrop: (crop: string) => void;
  growthStage: string;
  onSelectGrowthStage: (stage: string) => void;
  irrigationMethod: string;
  onSelectIrrigationMethod: (method: string) => void;
  flowRate: number;
  onFlowRateChange: (rate: number) => void;
  flowRateUnit: "gpm" | "lpm";
  onFlowRateUnitChange: (unit: "gpm" | "lpm") => void;
  onStartDrawing?: () => void;
}

export default function CropInfoModal({
  isOpen,
  onClose,
  selectedCrop,
  onSelectCrop,
  growthStage,
  onSelectGrowthStage,
  irrigationMethod,
  onSelectIrrigationMethod,
  flowRate,
  onFlowRateChange,
  flowRateUnit,
  onFlowRateUnitChange,
  onStartDrawing,
}: CropInfoModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const cropKeys = Object.keys(CROP_COEFFICIENTS).filter((key) => {
    const crop = CROP_COEFFICIENTS[key];
    return (
      crop.name.toLowerCase().includes(search.toLowerCase()) ||
      (crop.category && crop.category.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Crop & Irrigation Settings</h3>
              <p className="text-[10px] text-slate-400">Configure your crop, pump rate, and watering system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Crop Type Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Crop Type</label>
              <span className="text-[10px] text-cyan-400 font-mono">35+ FAO-56 Crops</span>
            </div>
            <input
              type="text"
              placeholder="Search crops (e.g. Tomato, Rice, Potato, Tea, Corn)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-900/50 rounded-lg border border-slate-800/80">
              {cropKeys.map((key) => {
                const c = CROP_COEFFICIENTS[key];
                const isSelected = selectedCrop === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectCrop(key)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold"
                        : "text-slate-300 hover:bg-slate-800/70"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono ml-1">{c.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Growth Stage */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Growth Stage</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "initial", label: "Seedling", sub: "Low Water Need" },
                { id: "mid", label: "Adult", sub: "Peak Thirst" },
                { id: "mature", label: "Elderly", sub: "Pre-Harvest" },
              ].map((stage) => {
                const isSelected = growthStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => onSelectGrowthStage(stage.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/20"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-semibold">{stage.label}</div>
                    <div className="text-[9px] text-slate-500">{stage.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Irrigation Method */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Irrigation Hardware</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(IRRIGATION_METHODS).map((methodKey) => {
                const method = IRRIGATION_METHODS[methodKey];
                const isSelected = irrigationMethod === methodKey;
                return (
                  <button
                    key={methodKey}
                    onClick={() => onSelectIrrigationMethod(methodKey)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs flex items-center justify-between">
                      <span>{method.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{Math.round(method.efficiency * 100)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flow Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Water Pump Flow Rate</span>
              </label>
              <div className="flex items-center space-x-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => onFlowRateUnitChange("gpm")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    flowRateUnit === "gpm" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                  }`}
                >
                  GPM (gal/min)
                </button>
                <button
                  onClick={() => onFlowRateUnitChange("lpm")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    flowRateUnit === "lpm" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                  }`}
                >
                  LPM (L/min)
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="5000"
                value={flowRate}
                onChange={(e) => onFlowRateChange(parseFloat(e.target.value) || 50)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="Enter pump rate (e.g. 50)"
              />
              <span className="text-xs text-slate-400 font-mono flex-shrink-0">
                {flowRateUnit === "gpm" ? "Gallons / min" : "Liters / min"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Used to calculate exact pump run time in hours and minutes per watering session.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              if (onStartDrawing) onStartDrawing();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <span>Save & Draw Field</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
