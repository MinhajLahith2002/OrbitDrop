"use client";

import React from "react";
import { MapPin, Compass } from "lucide-react";
import { PresetLocation } from "@/types/geo";

export const PRESET_FARMLANDS: PresetLocation[] = [
  {
    name: "Polonnaruwa Basin",
    region: "Parakrama Samudra Paddy (Maha/Yala)",
    lat: 7.9403,
    lng: 81.0188,
    zoom: 14,
    description: "Extensive rice paddy fields irrigated by ancient Parakrama Samudra reservoir",
  },
  {
    name: "Anuradhapura Farmlands",
    region: "Dry Zone Cascade Reservoir Tanks",
    lat: 8.3325,
    lng: 80.4250,
    zoom: 14,
    description: "Classic village cascade tank systems and alluvial paddy parcels",
  },
  {
    name: "Nuwara Eliya Terraces",
    region: "Ceylon Tea & Upcountry Vegetables",
    lat: 6.9680,
    lng: 80.7680,
    zoom: 15,
    description: "Highland tea plantations and terraced potato, carrot & leek gardens",
  },
  {
    name: "Kurunegala Belt",
    region: "Coconut Triangle & Intercropping",
    lat: 7.4863,
    lng: 80.3623,
    zoom: 14,
    description: "Coconut plantations, banana, and spice agroforestry parcels",
  },
  {
    name: "Jaffna Peninsula",
    region: "Red Soil Onions, Chilies & Tobacco",
    lat: 9.6850,
    lng: 80.0380,
    zoom: 14,
    description: "Intensive aquifer-fed red soil vegetable, red onion, and chili cultivation",
  },
  {
    name: "Ampara (Digamadulla)",
    region: "Eastern Province Rice Granary",
    lat: 7.2950,
    lng: 81.6750,
    zoom: 14,
    description: "Major Mahaweli scheme eastern paddy basin",
  },
];

interface PresetsBarProps {
  onSelectPreset: (preset: PresetLocation) => void;
}

export default function PresetsBar({ onSelectPreset }: PresetsBarProps) {
  return (
    <div className="absolute top-[68px] left-6 z-[1000] flex items-center gap-2 max-w-[calc(100vw-48px)] overflow-x-auto py-1 scrollbar-none pointer-events-auto">
      <div className="flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 text-xs shadow-lg font-medium">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Agricultural Presets:</span>
      </div>
      {PRESET_FARMLANDS.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelectPreset(preset)}
          className="flex-shrink-0 group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-cyan-950/90 border border-slate-800/80 hover:border-cyan-500/50 backdrop-blur-md text-xs text-slate-300 hover:text-cyan-200 transition-all duration-200 shadow-md"
          title={`${preset.name}: ${preset.description}`}
        >
          <MapPin className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">{preset.name}</span>
        </button>
      ))}
    </div>
  );
}
