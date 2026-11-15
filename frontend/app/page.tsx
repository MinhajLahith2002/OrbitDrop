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
  const [isDeckExpanded, setIsDeckExpanded] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<PresetLocation | null>(
    PRESET_FARMLANDS[0]
  );

  // Paddy & Crop Irrigation State
  const [selectedCrop, setSelectedCrop] = useState("paddy");
  const [growthStage, setGrowthStage] = useState("mid");
  const [irrigationMethod, setIrrigationMethod] = useState("basin");
  const [flowRate, setFlowRate] = useState(200);
  const [flowRateUnit, setFlowRateUnit] = useState<"gpm" | "lpm">("lpm");

  const fetchTelemetry = async (
    targetField = activeField,
    preset = selectedPreset,
    crop = selectedCrop,
    stage = growthStage,
    method = irrigationMethod,
    rate = flowRate,
    unit = flowRateUnit
  ) => {
    const lat = targetField ? targetField.centroid.lat : (preset?.lat || 7.9403);
    const lng = targetField ? targetField.centroid.lng : (preset?.lng || 81.0188);
    const area = targetField ? targetField.areaHectares : 1.0;

    try {
      // 1. Fetch live open-meteo real-time meteorological observations directly from client browser
      let liveWeather: any = null;
      try {
        const liveRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&hourly=precipitation,rain&daily=shortwave_radiation_sum,temperature_2m_max,temperature_2m_min,precipitation_sum&wind_speed_unit=ms&forecast_days=2&timezone=auto`
        );
        if (liveRes.ok) {
          liveWeather = await liveRes.json();
        }
      } catch (clientWeatherErr) {
        console.warn("Client live weather fetch notice:", clientWeatherErr);
      }

      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          areaHectares: area,
          crop,
          growthStage: stage,
          irrigationMethod: method,
          flowRate: rate,
          flowRateUnit: unit,
          liveWeather,
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

  // Live telemetry fetch on initial mount
  React.useEffect(() => {
    fetchTelemetry(null, selectedPreset, selectedCrop, growthStage, irrigationMethod, flowRate, flowRateUnit);
  }, []);

  const handleFieldCreated = (field: FieldData) => {
    setActiveField(field);
    setIsIrrigating(false);
    setIsDeckExpanded(true);
    fetchTelemetry(field, selectedPreset, selectedCrop, growthStage, irrigationMethod, flowRate, flowRateUnit);
    handleGenerateGrid(field);
  };

  const handleFieldCleared = () => {
    setActiveField(null);
    setGridData(null);
    setIsIrrigating(false);
    fetchTelemetry(null, selectedPreset, selectedCrop, growthStage, irrigationMethod, flowRate, flowRateUnit);
  };

  const handleSelectPreset = (preset: PresetLocation) => {
    setSelectedPreset(preset);
    fetchTelemetry(activeField, preset, selectedCrop, growthStage, irrigationMethod, flowRate, flowRateUnit);
  };

  const handleReset = () => {
    setActiveField(null);
    setGridData(null);
    setIsIrrigating(false);
    fetchTelemetry(null, selectedPreset, selectedCrop, growthStage, irrigationMethod, flowRate, flowRateUnit);
  };

  const handleGenerateGrid = async (targetField = activeField) => {
    const fieldToScan = targetField || activeField;
    if (!fieldToScan) {
      alert("Please draw an agricultural parcel or select a preset first!");
      return;
    }
    setIsGeneratingGrid(true);
    try {
      const response = await fetch("/api/predict-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinates: fieldToScan.coordinates,
          regionalMoisture: 24.5,
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
    const newCropName = CROP_COEFFICIENTS[crop]?.name || crop;
    if (activeField) {
      setActiveField({
        ...activeField,
        cropType: newCropName,
      });
    }
    fetchTelemetry(activeField, selectedPreset, crop, growthStage, irrigationMethod, flowRate, flowRateUnit);
  };

  const handleStageChange = (stage: string) => {
    setGrowthStage(stage);
    fetchTelemetry(activeField, selectedPreset, selectedCrop, stage, irrigationMethod, flowRate, flowRateUnit);
  };

  const handleMethodChange = (method: string) => {
    setIrrigationMethod(method);
    fetchTelemetry(activeField, selectedPreset, selectedCrop, growthStage, method, flowRate, flowRateUnit);
  };

  const handleFlowRateChange = (rate: number) => {
    setFlowRate(rate);
    fetchTelemetry(activeField, selectedPreset, selectedCrop, growthStage, irrigationMethod, rate, flowRateUnit);
  };

  const handleFlowRateUnitChange = (unit: "gpm" | "lpm") => {
    setFlowRateUnit(unit);
    fetchTelemetry(activeField, selectedPreset, selectedCrop, growthStage, irrigationMethod, flowRate, unit);
  };

  const activeCropDisplay = CROP_COEFFICIENTS[selectedCrop]?.name || selectedCrop.toUpperCase();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Sleek Top Header (Clean status with 1-click Basin Selector) */}
      <Header
        activeFieldPresent={!!activeField}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        locationName={selectedPreset?.name || "Polonnaruwa Basin"}
        activeCropName={activeCropDisplay}
        onSelectPreset={handleSelectPreset}
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
        cropName={activeCropDisplay}
        selectedCrop={selectedCrop}
        telemetryData={telemetryData}
        flowRate={flowRate}
        flowRateUnit={flowRateUnit}
        growthStage={growthStage}
      />

      {/* Floating Active Field Badge (Clean Top-Left, only when field is drawn) */}
      <FieldSummaryBadge
        field={activeField}
        cropName={activeCropDisplay}
        isGeneratingGrid={isGeneratingGrid}
        gridData={gridData}
        onGenerateGrid={handleGenerateGrid}
        telemetryData={telemetryData}
        flowRate={flowRate}
        flowRateUnit={flowRateUnit}
        onOpenDetails={() => setIsDeckExpanded(true)}
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
        isExpanded={isDeckExpanded}
        onToggleExpand={() => setIsDeckExpanded(!isDeckExpanded)}
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
