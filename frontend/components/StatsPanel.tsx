"use client";

import React, { useState } from "react";
import { 
  Maximize2, 
  Ruler, 
  Crosshair, 
  Layers, 
  Code2, 
  Copy, 
  Check, 
  ArrowRight,
  Sun,
  Wind,
  Droplets,
  CloudRain,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Zap,
  Leaf,
  Loader2,
  Waves,
  Activity,
  Calculator,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  BarChart3,
  Gauge,
  Lock,
  Unlock,
  Radio,
  Grid3X3,
  Cpu,
  Play,
  Square,
  CheckCircle2,
  Bot,
  Sprout
} from "lucide-react";
import { FieldData, DownscalingResult } from "@/types/geo";

interface StatsPanelProps {
  field: FieldData | null;
  gridData: DownscalingResult | null;
  onGenerateGrid: () => void;
  isGeneratingGrid: boolean;
  isIrrigating: boolean;
  onStartIrrigation: () => void;
  onStopIrrigation: () => void;
  onTelemetryUpdated?: (data: any) => void;
  telemetryData?: any;
  selectedCrop?: string;
  onSelectCrop?: (crop: string) => void;
  growthStage?: string;
  onSelectGrowthStage?: (stage: string) => void;
  irrigationMethod?: string;
  onSelectIrrigationMethod?: (method: string) => void;
  flowRate?: number;
  onFlowRateChange?: (rate: number) => void;
  flowRateUnit?: "gpm" | "lpm";
  onFlowRateUnitChange?: (unit: "gpm" | "lpm") => void;
  onOpenCropModal?: () => void;
  onOpenWaterUsageModal?: () => void;
  onOpenSproutModal?: () => void;
}

export default function StatsPanel({
  field,
  gridData,
  onGenerateGrid,
  isGeneratingGrid,
  isIrrigating,
  onStartIrrigation,
  onStopIrrigation,
  onTelemetryUpdated,
  telemetryData: externalTelemetryData,
  selectedCrop: externalCrop,
  onSelectCrop: externalSetCrop,
  growthStage: externalStage,
  onSelectGrowthStage: externalSetStage,
  irrigationMethod: externalMethod,
  onSelectIrrigationMethod: externalSetMethod,
  flowRate: externalFlowRate,
  onFlowRateChange: externalSetFlowRate,
  flowRateUnit: externalFlowRateUnit,
  onFlowRateUnitChange: externalSetFlowRateUnit,
  onOpenCropModal,
  onOpenWaterUsageModal,
  onOpenSproutModal,
}: StatsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showGeoJson, setShowGeoJson] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);
  const [showRainForecast, setShowRainForecast] = useState(true);
  const [loading, setLoading] = useState(false);

  const [localCrop, setLocalCrop] = useState("paddy");
  const [localStage, setLocalStage] = useState("mid");
  const [localMethod, setLocalMethod] = useState("basin");
  const [localFlowRate, setLocalFlowRate] = useState(50);
  const [localFlowRateUnit, setLocalFlowRateUnit] = useState<"gpm" | "lpm">("gpm");
  const [simulateStorm, setSimulateStorm] = useState(false);
  const [localTelemetryData, setLocalTelemetryData] = useState<any>(null);

  const selectedCrop = externalCrop !== undefined ? externalCrop : localCrop;
  const growthStage = externalStage !== undefined ? externalStage : localStage;
  const irrigationMethod = externalMethod !== undefined ? externalMethod : localMethod;
  const flowRate = externalFlowRate !== undefined ? externalFlowRate : localFlowRate;
  const flowRateUnit = externalFlowRateUnit !== undefined ? externalFlowRateUnit : localFlowRateUnit;
  const telemetryData = externalTelemetryData !== undefined ? externalTelemetryData : localTelemetryData;

  const setSelectedCrop = (crop: string) => {
    if (externalSetCrop) externalSetCrop(crop);
    else setLocalCrop(crop);
  };

  const setGrowthStage = (stage: string) => {
    if (externalSetStage) externalSetStage(stage);
    else setLocalStage(stage);
  };

  const setIrrigationMethod = (method: string) => {
    if (externalSetMethod) externalSetMethod(method);
    else setLocalMethod(method);
  };

  if (!field) {
    return (
      <div className="absolute bottom-6 left-6 z-[1000] w-96 bg-slate-950/85 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-5 text-white shadow-2xl">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100">Step 1: Draw Your Farm Parcel</h3>
            <p className="text-[11px] text-slate-400">Paddy field, tea estate, or coconut plot</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
            <p>Click a preset at the top (e.g. <strong>Polonnaruwa</strong> or <strong>Anuradhapura</strong>).</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
            <p>Click the <strong className="text-cyan-300">Polygon</strong> tool on the left toolbar and click points around your field.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
            <p>Click <strong>Calculate Water Needs</strong> to check satellite data and spray water only where needed.</p>
          </div>
        </div>

        {onOpenCropModal && (
          <button
            onClick={onOpenCropModal}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Crop & Pump Settings (35+ Crops)</span>
          </button>
        )}
      </div>
    );
  }

  const copyGeoJSON = () => {
    const geoJsonPayload = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: field.coordinates,
      },
      properties: {
        id: field.id,
        areaHectares: field.areaHectares,
        areaAcres: field.areaAcres,
        centroid: field.centroid,
        perimeterMeters: field.perimeterMeters,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(geoJsonPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchTelemetry = async (stormOverride?: boolean) => {
    setLoading(true);
    try {
      const isStorm = stormOverride !== undefined ? stormOverride : simulateStorm;
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: field.centroid.lat,
          longitude: field.centroid.lng,
          areaHectares: field.areaHectares,
          crop: selectedCrop,
          growthStage: growthStage,
          irrigationMethod: irrigationMethod,
          flowRate: flowRate,
          flowRateUnit: flowRateUnit,
          simulateStorm: isStorm,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setLocalTelemetryData(data);
      if (onTelemetryUpdated) {
        onTelemetryUpdated(data);
      }
    } catch (err: any) {
      console.error("Error fetching telemetry:", err);
      alert(`Telemetry Service error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStormSimulation = () => {
    const nextState = !simulateStorm;
    setSimulateStorm(nextState);
    if (telemetryData) {
      fetchTelemetry(nextState);
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-[1000] w-[430px] max-h-[88vh] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 text-white shadow-2xl space-y-4">
      {/* Header status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Field Captured (Sri Lanka)
          </span>
        </div>
        <button
          onClick={copyGeoJSON}
          className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 px-2 py-1 rounded border border-cyan-500/30 transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy GeoJSON"}</span>
        </button>
      </div>

      {/* Geometry Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Field Area</span>
          </div>
          <div className="text-lg font-bold text-slate-100">
            {field.areaHectares.toFixed(2)} <span className="text-xs font-medium text-cyan-400">ha</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ({field.areaAcres.toFixed(2)} acres / {(field.areaAcres * 4).toFixed(1)} roods)
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bund Perimeter</span>
          </div>
          <div className="text-lg font-bold text-slate-100">
            {(field.perimeterMeters / 1000).toFixed(2)} <span className="text-xs font-medium text-emerald-400">km</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ({field.perimeterMeters.toFixed(0)} meters)
          </div>
        </div>
      </div>

      {/* Phase 5 Action Button: HTML5 Canvas Water Splash / Spray */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-sky-950/60 to-emerald-950/70 p-3.5 rounded-xl border border-cyan-400/50 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">Smart Water Spray Animation</div>
              <div className="text-[10px] text-slate-400">Sprays water strictly where plants are thirsty</div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-300 border border-cyan-400/30">
            60 FPS Spray
          </span>
        </div>

        {!isIrrigating ? (
          <button
            onClick={onStartIrrigation}
            className="w-full group py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>
              {telemetryData?.rainLockout?.isLockoutActive
                ? "Simulate Water Spray (Rain Lockout Override)"
                : "Start Smart Water Spray"}
            </span>
          </button>
        ) : (
          <button
            onClick={onStopIrrigation}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 transition-all animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Water Spray</span>
          </button>
        )}

        <div className="text-[10px] text-slate-400 text-center">
          Water droplets stay inside field borders. Sprays 3x more water on dry red spots.
        </div>
      </div>

      {/* Phase 4 ML Micro-Stress Grid Card */}
      <div className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Field Moisture Scanner</h4>
              <p className="text-[10px] text-slate-400">Finds dry spots in 30-meter blocks across your field</p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
            30m Grid
          </span>
        </div>

        {!gridData ? (
          <button
            onClick={onGenerateGrid}
            disabled={isGeneratingGrid}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
          >
            {isGeneratingGrid ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Scanning Field Moisture...</span>
              </>
            ) : (
              <>
                <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan Field for Dry Spots</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-slate-300">Grid Cells Generated:</span>
              <span className="font-mono font-bold text-cyan-300">{gridData.totalCells} cells</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="bg-red-950/40 border border-red-500/40 p-1.5 rounded">
                <div className="text-red-400 font-bold">{gridData.criticalCount}</div>
                <div className="text-slate-400 text-[9px]">Critical (3x)</div>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/40 p-1.5 rounded">
                <div className="text-amber-400 font-bold">{gridData.warningCount}</div>
                <div className="text-slate-400 text-[9px]">Moderate (1x)</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-1.5 rounded">
                <div className="text-emerald-400 font-bold">{gridData.optimalCount}</div>
                <div className="text-slate-400 text-[9px]">Optimal (0x)</div>
              </div>
            </div>
            <button
              onClick={onGenerateGrid}
              disabled={isGeneratingGrid}
              className="w-full text-[10px] text-cyan-400 hover:text-cyan-300 py-1 flex items-center justify-center space-x-1"
            >
              <Crosshair className="w-3 h-3" />
              <span>Regenerate Grid</span>
            </button>
          </div>
        )}
      </div>

      {/* Crop and Irrigation Setup */}
      <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-1">
          <span className="flex items-center space-x-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crop & Watering Setup</span>
          </span>
          {onOpenCropModal && (
            <button
              onClick={onOpenCropModal}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center space-x-1"
            >
              <span>35+ Crops</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-slate-400 font-medium block">
              Target Crop
            </label>
            <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase">{selectedCrop}</span>
          </div>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="paddy">🌾 Rice / Paddy (Maha/Yala Basins)</option>
            <option value="tea">🫖 Ceylon Tea (Nuwara Eliya / Kandy)</option>
            <option value="coconut">🌴 Coconut (Coconut Triangle)</option>
            <option value="tomato">🍅 Tomato (Field / Greenhouse)</option>
            <option value="potato">🥔 Potato (Upcountry Tubers)</option>
            <option value="onion">🧅 Onion / Shallots (Jaffna Red Soil)</option>
            <option value="maize">🌽 Maize (Dry Zone Granary)</option>
            <option value="chili">🌶️ Chili Pepper (Jaffna / Dry Zone)</option>
            <option value="watermelon">🍉 Watermelon (Dry Zone)</option>
            <option value="cinnamon">🌿 Cinnamon & Spices (Wet Zone)</option>
            <option value="banana">🍌 Banana Plantain</option>
            <option value="sugarcane">🎋 Sugarcane</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">
              Growth Stage
            </label>
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="initial">Young Seedlings (Low thirst)</option>
              <option value="mid">Mid-Season (Peak thirst)</option>
              <option value="mature">Ripening / Harvest (Low thirst)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">
              Watering Method
            </label>
            <select
              value={irrigationMethod}
              onChange={(e) => setIrrigationMethod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="basin">Flood / Basin (55% efficiency)</option>
              <option value="drip">Drip System (90% efficiency)</option>
              <option value="sprinkler">Sprinklers (75% efficiency)</option>
              <option value="furrow">Furrow Channels (60% efficiency)</option>
            </select>
          </div>
        </div>

        {/* Monsoon Storm Simulator */}
        <div className="pt-1.5 flex items-center justify-between text-xs border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span>Test Rain Alert (Simulate Storm)</span>
          </span>
          <button
            onClick={handleToggleStormSimulation}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
              simulateStorm
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {simulateStorm ? "Storm Active (24.5mm Rain)" : "Live Weather"}
          </button>
        </div>
      </div>

      {/* Telemetry Trigger */}
      {!telemetryData && (
        <button
          onClick={() => fetchTelemetry()}
          disabled={loading}
          className="w-full group py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Checking NASA Satellites & Weather...</span>
            </>
          ) : (
            <>
              <span>Calculate Water Needs (Check NASA Satellites)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      )}

      {/* Output Sections */}
      {telemetryData && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          {/* Phase 3 Valve Lockout Banner */}
          <div className={`rounded-xl p-3.5 border transition-all ${
            telemetryData.rainLockout?.isLockoutActive
              ? "bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/15"
              : "bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/15"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {telemetryData.rainLockout?.isLockoutActive ? (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                    <Unlock className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    <span className={telemetryData.rainLockout?.isLockoutActive ? "text-amber-300" : "text-emerald-300"}>
                      {telemetryData.rainLockout?.isLockoutActive ? "WATERING STOPPED (RAIN COMING)" : "WATERING APPROVED (DRY WEATHER)"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {telemetryData.rainLockout?.isLockoutActive ? "Rain Lockout: Pumps paused to prevent flooding" : "Dry Spell: Safe to irrigate"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  Rain: {telemetryData.rainLockout.totalForecastRain48h_mm} mm
                </span>
              </div>
            </div>

            {telemetryData.rainLockout?.isLockoutActive ? (
              <div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed mb-2.5">
                  Incoming rainfall of <strong>{telemetryData.rainLockout.totalForecastRain48h_mm} mm</strong> will naturally hydrate your crops. Water pumps are paused to save electricity and prevent over-flooding.
                </p>

                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[9px] text-slate-400">Power Saved</div>
                    <div className="font-bold text-amber-300 text-xs font-mono">
                      {telemetryData.rainLockout.sustainabilityImpact.electricitySavedKWh} kWh
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">Bill Saved</div>
                    <div className="font-bold text-emerald-300 text-xs font-mono">
                      LKR {telemetryData.rainLockout.sustainabilityImpact.costSavedLKR?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">Reservoir Water Saved</div>
                    <div className="font-bold text-cyan-300 text-xs font-mono">
                      {telemetryData.rainLockout.sustainabilityImpact.waterSavedAcreFeet} Ac-ft
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                48-hour rainfall is below threshold ({telemetryData.rainLockout.lockoutThreshold_mm} mm). Irrigation is recommended to prevent crop wilting.
              </p>
            )}
          </div>

          {/* 24h Rain Forecast Bar Chart */}
          {telemetryData.rainLockout?.hourlyRainNext24h && (
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <button
                onClick={() => setShowRainForecast(!showRainForecast)}
                className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-cyan-300 mb-1"
              >
                <span className="flex items-center space-x-1.5 font-semibold">
                  <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>24-Hour Rainfall Forecast (Hour by Hour)</span>
                </span>
                <span className="text-[10px] text-cyan-400">
                  {showRainForecast ? "Hide Chart" : "Show Chart"}
                </span>
              </button>

              {showRainForecast && (
                <div className="mt-2.5 space-y-2">
                  <div className="h-16 flex items-end space-x-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80 overflow-x-auto">
                    {telemetryData.rainLockout.hourlyRainNext24h.slice(0, 16).map((h: any, idx: number) => {
                      const maxRain = 10;
                      const heightPercent = Math.min((h.rain_mm / maxRain) * 100, 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center min-w-[20px] group relative">
                          <div
                            className={`w-full rounded-t transition-all ${
                              h.rain_mm > 0 ? "bg-sky-400 group-hover:bg-cyan-300" : "bg-slate-800"
                            }`}
                            style={{ height: `${Math.max(heightPercent, 8)}%` }}
                          />
                          <span className="text-[7px] text-slate-500 mt-1 truncate">
                            {idx % 3 === 0 ? h.hourLabel.replace(":00", "") : ""}
                          </span>

                          <div className="hidden group-hover:block absolute bottom-14 z-50 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                            {h.hourLabel}: {h.rain_mm} mm
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Hourly rain depth in millimeters</span>
                    <span className="text-sky-300 font-mono">Peak: {Math.max(...telemetryData.rainLockout.hourlyRainNext24h.map((h: any) => h.rain_mm))} mm</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NASA Weather & Evapotranspiration */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-300 font-medium">Natural Sun Evaporation (ET₀):</span>
                <span className="text-[10px] text-slate-500 block">Water lost to sun & wind</span>
              </div>
              <span className="font-bold text-cyan-300 font-mono">{telemetryData.evapotranspiration.ET0_mm_per_day} mm/day</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
              <div>
                <span className="text-slate-300 font-medium">Crop Water Thirst (ETc):</span>
                <span className="text-[10px] text-slate-500 block">What {telemetryData.cropDemand.cropName} drinks daily</span>
              </div>
              <span className="font-bold text-emerald-400 font-mono">
                {telemetryData.cropDemand.ETc_mm_per_day} mm/day
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800">
              <div>
                <span className="text-slate-100 font-bold">Total Water to Pump:</span>
                <span className="text-[10px] text-slate-400 block">Recommended delivery for this parcel</span>
              </div>
              <span className="font-bold text-sky-300 font-mono text-sm">
                {telemetryData.cropDemand.grossWaterDemandLiters.toLocaleString()} Liters
              </span>
            </div>

            {/* WaterWise Pump Runtime */}
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800/60 bg-cyan-950/30 -mx-1 px-2 py-1.5 rounded-lg border border-cyan-500/20">
              <div>
                <span className="text-cyan-200 font-bold flex items-center space-x-1">
                  <span>Pump Runtime:</span>
                </span>
                <span className="text-[10px] text-slate-400 block">
                  At {flowRate} {flowRateUnit.toUpperCase()} flow rate
                </span>
              </div>
              <span className="font-extrabold text-amber-300 font-mono text-sm">
                {telemetryData.pumpRuntime?.formatted || "1h 45m"}
              </span>
            </div>

            {/* WaterWise Navigation Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {onOpenWaterUsageModal && (
                <button
                  onClick={onOpenWaterUsageModal}
                  className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950 to-sky-950 hover:from-cyan-900 hover:to-sky-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-md transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>7-Day Schedule</span>
                </button>
              )}
              {onOpenSproutModal && (
                <button
                  onClick={onOpenSproutModal}
                  className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-md transition-all"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ask Sprout AI</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GeoJSON details toggle */}
      <div>
        <button
          onClick={() => setShowGeoJson(!showGeoJson)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1"
        >
          <span className="flex items-center space-x-1.5">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inspect Polygon Coordinates ({field.latLngs.length} vertices)</span>
          </span>
          <span className="text-cyan-400 text-[10px]">{showGeoJson ? "Hide" : "Show"}</span>
        </button>
        {showGeoJson && (
          <div className="mt-2 max-h-36 overflow-y-auto bg-slate-950 p-2 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-800">
            <pre>{JSON.stringify(field.coordinates[0], null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
