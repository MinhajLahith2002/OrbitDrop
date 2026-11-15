"use client";

import React, { useState } from "react";
import { X, MapPin, Navigation, Compass, Check } from "lucide-react";
import { PresetLocation } from "@/types/geo";
import { PRESET_FARMLANDS } from "@/components/PresetsBar";

interface FarmLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: PresetLocation | null;
  onSelectLocation: (preset: PresetLocation) => void;
}

export default function FarmLocationModal({
  isOpen,
  onClose,
  currentPreset,
  onSelectLocation,
}: FarmLocationModalProps) {
  const [latInput, setLatInput] = useState<string>(
    currentPreset ? currentPreset.lat.toString() : "7.9403"
  );
  const [lngInput, setLngInput] = useState<string>(
    currentPreset ? currentPreset.lng.toString() : "81.0188"
  );
  const [selectedPresetName, setSelectedPresetName] = useState<string>(
    currentPreset?.name || "Polonnaruwa Basin"
  );

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetLocation) => {
    setSelectedPresetName(preset.name);
    setLatInput(preset.lat.toString());
    setLngInput(preset.lng.toString());
  };

  const handleConfirm = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid decimal coordinates (e.g. Lat: 7.9403, Long: 81.0188)");
      return;
    }

    const matchingPreset = PRESET_FARMLANDS.find(
      (p) => Math.abs(p.lat - lat) < 0.01 && Math.abs(p.lng - lng) < 0.01
    );

    const targetPreset: PresetLocation = matchingPreset || {
      name: `Custom Farm (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      region: "Custom Sri Lanka Coordinates",
      lat,
      lng,
      zoom: 15,
      description: "User-defined agricultural field coordinates",
    };

    onSelectLocation(targetPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Set Farm Location</h2>
              <p className="text-[11px] text-slate-400">
                Jump to a Sri Lankan agricultural district or enter custom coordinates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Preset Buttons Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sri Lankan Agricultural Zones</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_FARMLANDS.map((preset) => {
                const isSelected = selectedPresetName === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-start space-x-2 text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? "bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400 font-bold" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                        {preset.region}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coordinate Inputs (Matching WaterWise) */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Or Enter GPS Coordinates
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Enter Lat (Latitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="e.g. 7.9403"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Enter Long (Longitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="e.g. 81.0188"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 fill-slate-950" />
            <span>Confirm & Fly To Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
