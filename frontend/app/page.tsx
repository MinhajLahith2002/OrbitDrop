"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import PresetsBar from "@/components/PresetsBar";
import StatsPanel from "@/components/StatsPanel";
import SustainabilityTicker from "@/components/SustainabilityTicker";
import ExportModal from "@/components/ExportModal";
import { FieldData, PresetLocation, DownscalingResult } from "@/types/geo";

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
  const [selectedPreset, setSelectedPreset] = useState<PresetLocation | null>(
    null
  );

  const handleFieldCreated = (field: FieldData) => {
    setActiveField(field);
    setGridData(null);
    setIsIrrigating(false);
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
      alert("Please draw an agricultural parcel first!");
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

  // Derive metrics for the Phase 6 Sustainability Ticker
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
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Top Header */}
      <Header
        activeFieldPresent={!!activeField}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Farmland Quick Jumps */}
      <PresetsBar onSelectPreset={handleSelectPreset} />

      {/* Interactive Map Core with HTML5 Canvas Water Splash (Phase 5) */}
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

      {/* Stats, Agronomic, ML & Spray Action Panel */}
      <StatsPanel
        field={activeField}
        gridData={gridData}
        onGenerateGrid={handleGenerateGrid}
        isGeneratingGrid={isGeneratingGrid}
        isIrrigating={isIrrigating}
        onStartIrrigation={handleStartIrrigation}
        onStopIrrigation={handleStopIrrigation}
        onTelemetryUpdated={(data) => setTelemetryData(data)}
      />

      {/* Phase 6: Sustainability Ticker (Bottom Right) */}
      <SustainabilityTicker
        metrics={tickerMetrics}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Phase 6: 1-Click Export Prescription Plan Modal (GeoJSON / PDF) */}
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
