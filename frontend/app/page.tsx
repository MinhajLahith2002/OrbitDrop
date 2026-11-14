"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import PresetsBar, { PRESET_FARMLANDS } from "@/components/PresetsBar";
import StatsPanel from "@/components/StatsPanel";
import SustainabilityTicker from "@/components/SustainabilityTicker";
import ExportModal from "@/components/ExportModal";
import CropInfoModal from "@/components/CropInfoModal";
import WaterUsageModal from "@/components/WaterUsageModal";
import SproutAICopilot from "@/components/SproutAICopilot";
import WaterWiseDock from "@/components/WaterWiseDock";
import { FieldData, PresetLocation, DownscalingResult } from "@/types/geo";
import { CROP_COEFFICIENTS } from "@/lib/services/agronomyService";

// Dynamically import MapComponent to disable server-side rendering for Leaflet & Canvas
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 text-cyan-400">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
      <p className="text-sm tracking-wide font-medium">
        Initializing Esri High-Resolution Satellite Feed...
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
  const [selectedPreset, setSelectedPreset] = useState<PresetLocation | null>(null);

  // WaterWise Modals & Configuration State
  const [isCropInfoOpen, setIsCropInfoOpen] = useState(false);
  const [isWaterUsageOpen, setIsWaterUsageOpen] = useState(false);
  const [isSproutAIOpen, setIsSproutAIOpen] = useState(false);

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
    if (!activeField) return;
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
      alert("Please draw an agricultural parcel or select a preset first!");
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

  // Derive metrics for the Sustainability Ticker
  const tickerMetrics = telemetryData ? {
    waterSavedLiters: telemetryData.rainLockout?.sustainabilityImpact?.waterSavedLiters || 0,
    waterSavedAcreFeet: telemetryData.rainLockout?.sustainabilityImpact?.waterSavedAcreFeet || 0,
    electricitySavedKWh: telemetryData.rainLockout?.sustainabilityImpact?.electricitySavedKWh || 0,
    costSavedLKR: telemetryData.rainLockout?.sustainabilityImpact?.costSavedLKR || 0,
    costSavedUSD: telemetryData.rainLockout?.sustainabilityImpact?.costSavedUSD || 0,
    carbonOffsetKgCO2: telemetryData.rainLockout?.sustainabilityImpact?.carbonOffsetKgCO2 || 0,
    isLockoutActive: telemetryData.rainLockout?.isLockoutActive || false,
    rainForecastMm: telemetryData.rainLockout?.totalForecastRain48h_mm || 0,
    waterWastedVsFloodLiters: telemetryData.cropDemand?.waterWastedByFloodLiters || 0,
  } : activeField ? {
    waterSavedLiters: Math.round(activeField.areaHectares * 25000),
    waterSavedAcreFeet: parseFloat(((activeField.areaHectares * 25000) / 1233480).toFixed(2)),
    electricitySavedKWh: Math.round(activeField.areaHectares * 3.5),
    costSavedLKR: Math.round(activeField.areaHectares * 105),
    costSavedUSD: parseFloat((activeField.areaHectares * 0.35).toFixed(2)),
    carbonOffsetKgCO2: parseFloat((activeField.areaHectares * 1.35).toFixed(1)),
    isLockoutActive: false,
    rainForecastMm: 0,
    waterWastedVsFloodLiters: Math.round(activeField.areaHectares * 18000),
  } : null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Header */}
      <Header
        activeFieldPresent={!!activeField}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Farmland Quick Jumps */}
      <PresetsBar onSelectPreset={handleSelectPreset} />

      {/* Interactive Map Core with HTML5 Canvas Water Splash */}
      <MapComponent
        onFieldCreated={handleFieldCreated}
        onFieldCleared={handleFieldCleared}
        selectedPreset={selectedPreset}
        gridData={gridData}
        showGrid={true}
        isIrrigating={isIrrigating}
        onIrrigationComplete={handleIrrigationComplete}
        activeField={activeField}
        waterDemandLiters={telemetryData?.cropDemand?.waterDemandLiters || 350000}
      />

      {/* Stats, Agronomic, ML & Spray Action Panel (Left) */}
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

      {/* WaterWise Signature Bottom Dock */}
      <WaterWiseDock
        onOpenCropInfo={() => setIsCropInfoOpen(true)}
        onOpenLocation={() => {
          // Cycle through the Sri Lankan agricultural presets
          const currentIndex = selectedPreset
            ? PRESET_FARMLANDS.findIndex((p) => p.name === selectedPreset.name)
            : -1;
          const nextPreset = PRESET_FARMLANDS[(currentIndex + 1) % PRESET_FARMLANDS.length];
          setSelectedPreset(nextPreset);
        }}
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

      {/* Sustainability Ticker (Bottom Right) */}
      <SustainabilityTicker
        metrics={tickerMetrics}
        onOpenExport={() => setIsExportOpen(true)}
      />

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

      {/* WaterWise Modal 2: 7-Day Watering Calendar & Pump Runtime */}
      <WaterUsageModal
        isOpen={isWaterUsageOpen}
        onClose={() => setIsWaterUsageOpen(false)}
        field={activeField}
        telemetryData={telemetryData}
        flowRate={flowRate}
        flowRateUnit={flowRateUnit}
        onTriggerSpray={() => {
          setIsWaterUsageOpen(false);
          handleStartIrrigation();
        }}
      />

      {/* WaterWise Modal 3: Sprout AI Agronomist Copilot */}
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
