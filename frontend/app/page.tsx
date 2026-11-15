"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import FieldSummaryBadge from "@/components/FieldSummaryBadge";
import PaddyCommandCenter from "@/components/PaddyCommandCenter";
import FloatingSproutCopilot from "@/components/FloatingSproutCopilot";
import SproutAICopilot from "@/components/SproutAICopilot";
import ExportModal from "@/components/ExportModal";
import { FieldData, PresetLocation, DownscalingResult } from "@/types/geo";
import { CROP_COEFFICIENTS } from "@/lib/services/agronomyService";
import { PRESET_FARMLANDS } from "@/components/PresetsBar";

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
  const [isSproutAIOpen, setIsSproutAIOpen] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<PresetLocation | null>(
    PRESET_FARMLANDS[0]
  );

  // Paddy & Crop Irrigation State
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
      alert("Please draw your paddy field or agricultural parcel on the map first!");
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
      {/* Sleek Top Header (Clean status without duplicate buttons) */}
      <Header
        activeFieldPresent={!!activeField}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        locationName={selectedPreset?.name || "Polonnaruwa Basin"}
        activeCropName={activeCropDisplay}
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
        }}
        onClearField={handleFieldCleared}
      />

      {/* OrbitDrop Precision Paddy Command Center (Unified Bottom Deck) */}
      <PaddyCommandCenter
        field={activeField}
        telemetryData={telemetryData}
        gridData={gridData}
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
        selectedLocation={selectedPreset}
        onSelectLocation={handleSelectPreset}
        isIrrigating={isIrrigating}
        onToggleSpray={() => {
          if (isIrrigating) {
            handleStopIrrigation();
          } else {
            handleStartIrrigation();
          }
        }}
        onOpenSproutAI={() => setIsSproutAIOpen(true)}
      />

      {/* Dedicated Floating Sprout AI Copilot (Bottom Right) */}
      <FloatingSproutCopilot
        onClick={() => setIsSproutAIOpen(true)}
        cropName={activeCropDisplay}
      />

      {/* Sprout AI Agronomist Copilot Modal */}
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
