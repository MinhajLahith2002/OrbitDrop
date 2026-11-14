"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import FieldSummaryBadge from "@/components/FieldSummaryBadge";
import WaterWiseDock from "@/components/WaterWiseDock";
import CropInfoModal from "@/components/CropInfoModal";
import FarmLocationModal from "@/components/FarmLocationModal";
import WaterUsageModal from "@/components/WaterUsageModal";
import SproutAICopilot from "@/components/SproutAICopilot";
import ExportModal from "@/components/ExportModal";
import StatsPanel from "@/components/StatsPanel";
import { FieldData, PresetLocation, DownscalingResult } from "@/types/geo";
import { CROP_COEFFICIENTS } from "@/lib/services/agronomyService";
import { PRESET_FARMLANDS } from "@/components/PresetsBar";
import { X, Layers } from "lucide-react";

// Dynamically import MapComponent to disable server-side rendering for Leaflet & Canvas
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 text-cyan-400">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
      <p className="text-sm tracking-wide font-medium">
        Initializing Satellite Basemap Feed...
      </p>
    </div>
  ),
});

export default function Home() {
  const [activeField, setActiveField] = useState<FieldData | null>(null);
  const [gridData, setGridData] = useState<DownscalingResult | null>(null);
  const [isGeneratingGrid, setIsGeneratingGrid] = useState(false);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetLocation | null>(
    PRESET_FARMLANDS[0]
  );

  // WaterWise Modals & Configuration State
  const [isCropInfoOpen, setIsCropInfoOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isWaterUsageOpen, setIsWaterUsageOpen] = useState(false);
  const [isSproutAIOpen, setIsSproutAIOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState("paddy");
  const [growthStage, setGrowthStage] = useState("mid");
  const [irrigationMethod, setIrrigationMethod] = useState("basin");
  const [flowRate, setFlowRate] = useState(50);
  const [flowRateUnit, setFlowRateUnit] = useState<"gpm" | "lpm">("gpm");

  const fetchTelemetryForField = async (
    targetField = activeField,
    crop = selectedCrop,
    stage = growthStage,
    method = irrigationMethod,
    rate = flowRate,
    unit = flowRateUnit
  ) => {
    if (!targetField) return;
    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: targetField.centroid.lat,
          longitude: targetField.centroid.lng,
          areaHectares: targetField.areaHectares,
          crop,
          growthStage: stage,
          irrigationMethod: method,
          flowRate: rate,
          flowRateUnit: unit,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTelemetryData(data);
      }
    } catch (err) {
      console.error("Auto-fetch telemetry error:", err);
    }
  };

  const handleFieldCreated = (field: FieldData) => {
    setActiveField(field);
    setGridData(null);
    setIsIrrigating(false);
    fetchTelemetryForField(field);
  };

  const handleFieldCleared = () => {
    setActiveField(null);
    setGridData(null);
    setIsIrrigating(false);
    setTelemetryData(null);
  };

  const handleSelectPreset = (preset: PresetLocation) => {
    setSelectedPreset(preset);
  };

  const handleReset = () => {
    setActiveField(null);
    setGridData(null);
    setIsIrrigating(false);
    setTelemetryData(null);
    if (typeof window !== "undefined") {
      (window as any).activeField = null;
      window.location.reload();
    }
  };

  const handleGenerateGrid = async () => {
    if (!activeField) {
      alert("Please draw an agricultural parcel or select a preset first!");
      return;
    }
    setIsGeneratingGrid(true);
    try {
      const response = await fetch("/api/predict-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinates: activeField.coordinates,
          regionalMoisture: 22.5,
          gridSpacingMeters: 30.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: DownscalingResult = await response.json();
      setGridData(result);
    } catch (err: any) {
      console.error("Error generating micro-stress grid:", err);
      alert(`ML Spatial Downscaling error: ${err.message}`);
    } finally {
      setIsGeneratingGrid(false);
    }
  };

  const handleStartIrrigation = () => {
    if (!activeField) {
      alert("Please draw an agricultural parcel on the map first!");
      return;
    }
    setIsIrrigating(true);
  };

  const handleStopIrrigation = () => {
    setIsIrrigating(false);
  };

  const handleIrrigationComplete = () => {
    setIsIrrigating(false);
  };

  const handleCropChange = (crop: string) => {
    setSelectedCrop(crop);
    if (activeField) {
      fetchTelemetryForField(activeField, crop, growthStage, irrigationMethod, flowRate, flowRateUnit);
    }
  };

  const handleStageChange = (stage: string) => {
    setGrowthStage(stage);
    if (activeField) {
      fetchTelemetryForField(activeField, selectedCrop, stage, irrigationMethod, flowRate, flowRateUnit);
    }
  };

  const handleMethodChange = (method: string) => {
    setIrrigationMethod(method);
    if (activeField) {
      fetchTelemetryForField(activeField, selectedCrop, growthStage, method, flowRate, flowRateUnit);
    }
  };

  const handleFlowRateChange = (rate: number) => {
    setFlowRate(rate);
    if (activeField) {
      fetchTelemetryForField(activeField, selectedCrop, growthStage, irrigationMethod, rate, flowRateUnit);
    }
  };

  const handleFlowRateUnitChange = (unit: "gpm" | "lpm") => {
    setFlowRateUnit(unit);
    if (activeField) {
      fetchTelemetryForField(activeField, selectedCrop, growthStage, irrigationMethod, flowRate, unit);
    }
  };

  const activeCropDisplay = CROP_COEFFICIENTS[selectedCrop]?.name || selectedCrop.toUpperCase();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Sleek Top Header */}
      <Header
        activeFieldPresent={!!activeField}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        locationName={selectedPreset?.name || "Polonnaruwa Basin"}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        activeCropName={activeCropDisplay}
        onOpenCropModal={() => setIsCropInfoOpen(true)}
      />

      {/* Full-Bleed Interactive Map Core with HTML5 Canvas Spray */}
      <MapComponent
        onFieldCreated={handleFieldCreated}
        onFieldCleared={handleFieldCleared}
        selectedPreset={selectedPreset}
        gridData={gridData}
        showGrid={true}
        isIrrigating={isIrrigating}
        onIrrigationComplete={handleIrrigationComplete}
        activeField={activeField}
        waterDemandLiters={telemetryData?.cropDemand?.waterDemandLiters || 45000}
      />

      {/* Floating Active Field Badge (Clean Top-Left, only when field is drawn) */}
      <FieldSummaryBadge
        field={activeField}
        cropName={activeCropDisplay}
        isGeneratingGrid={isGeneratingGrid}
        gridData={gridData}
        onGenerateGrid={handleGenerateGrid}
        onOpenWaterUsage={() => {
          if (!telemetryData && activeField) {
            fetchTelemetryForField();
          }
          setIsWaterUsageOpen(true);
        }}
        onClearField={handleFieldCleared}
      />

      {/* WaterWise Signature Floating Bottom Dock */}
      <WaterWiseDock
        onOpenCropInfo={() => setIsCropInfoOpen(true)}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenWaterUsage={() => {
          if (!telemetryData && activeField) {
            fetchTelemetryForField();
          }
          setIsWaterUsageOpen(true);
        }}
        onOpenSproutAI={() => setIsSproutAIOpen(true)}
        onToggleSpray={() => {
          if (isIrrigating) {
            handleStopIrrigation();
          } else {
            handleStartIrrigation();
          }
        }}
        isIrrigating={isIrrigating}
        activeCropName={activeCropDisplay}
        hasActiveField={!!activeField}
      />

      {/* Optional Slide-Over Diagnostics Drawer (Only when opened on demand) */}
      {isDiagnosticsOpen && (
        <div className="fixed inset-y-0 left-0 z-[1500] w-[440px] max-w-[90vw] bg-slate-950/95 backdrop-blur-2xl border-r border-cyan-500/30 p-5 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-slate-100 text-sm">Detailed Agronomic Diagnostics</h3>
            </div>
            <button
              onClick={() => setIsDiagnosticsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <StatsPanel
            field={activeField}
            gridData={gridData}
            onGenerateGrid={handleGenerateGrid}
            isGeneratingGrid={isGeneratingGrid}
            isIrrigating={isIrrigating}
            onStartIrrigation={handleStartIrrigation}
            onStopIrrigation={handleStopIrrigation}
            onTelemetryUpdated={(data) => setTelemetryData(data)}
            telemetryData={telemetryData}
            selectedCrop={selectedCrop}
            onSelectCrop={handleCropChange}
            growthStage={growthStage}
            onSelectGrowthStage={handleStageChange}
            irrigationMethod={irrigationMethod}
            onSelectIrrigationMethod={handleMethodChange}
            flowRate={flowRate}
            onFlowRateChange={handleFlowRateChange}
            flowRateUnit={flowRateUnit}
            onFlowRateUnitChange={handleFlowRateUnitChange}
            onOpenCropModal={() => setIsCropInfoOpen(true)}
            onOpenWaterUsageModal={() => setIsWaterUsageOpen(true)}
            onOpenSproutModal={() => setIsSproutAIOpen(true)}
          />
        </div>
      )}

      {/* WaterWise Modal 1: 35+ Crop Info & Pump Flow Rate Setup */}
      <CropInfoModal
        isOpen={isCropInfoOpen}
        onClose={() => setIsCropInfoOpen(false)}
        selectedCrop={selectedCrop}
        onSelectCrop={handleCropChange}
        growthStage={growthStage}
        onSelectGrowthStage={handleStageChange}
        irrigationMethod={irrigationMethod}
        onSelectIrrigationMethod={handleMethodChange}
        flowRate={flowRate}
        onFlowRateChange={handleFlowRateChange}
        flowRateUnit={flowRateUnit}
        onFlowRateUnitChange={handleFlowRateUnitChange}
        onStartDrawing={() => {
          setIsCropInfoOpen(false);
        }}
      />

      {/* WaterWise Modal 2: Set Farm Location (Lat/Long + Sri Lanka Zones) */}
      <FarmLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentPreset={selectedPreset}
        onSelectLocation={handleSelectPreset}
      />

      {/* WaterWise Modal 3: 7-Day Watering Calendar, Pump Runtime & ML Moisture */}
      <WaterUsageModal
        isOpen={isWaterUsageOpen}
        onClose={() => setIsWaterUsageOpen(false)}
        field={activeField}
        telemetryData={telemetryData}
        gridData={gridData}
        flowRate={flowRate}
        flowRateUnit={flowRateUnit}
        onTriggerSpray={() => {
          setIsWaterUsageOpen(false);
          handleStartIrrigation();
        }}
      />

      {/* WaterWise Modal 4: Sprout AI Agronomist Copilot */}
      <SproutAICopilot
        isOpen={isSproutAIOpen}
        onClose={() => setIsSproutAIOpen(false)}
        field={activeField}
        telemetryData={telemetryData}
        selectedCrop={selectedCrop}
        growthStage={growthStage}
      />

      {/* 1-Click Export Prescription Plan Modal (GeoJSON / PDF) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        field={activeField}
        telemetryData={telemetryData}
        gridData={gridData}
      />
    </main>
  );
}
