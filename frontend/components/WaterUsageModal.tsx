"use client";

import React from "react";
import { X, Droplets, Clock, Calendar, ShieldAlert, Sparkles, Waves, Cpu, BarChart3, CloudRain } from "lucide-react";
import { FieldData, DownscalingResult } from "@/types/geo";

interface WaterUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldData | null;
  telemetryData: any;
  gridData?: DownscalingResult | null;
  flowRate: number;
  flowRateUnit: "gpm" | "lpm";
  onTriggerSpray?: () => void;
}

export default function WaterUsageModal({
  isOpen,
  onClose,
  field,
  telemetryData,
  gridData,
  flowRate,
  flowRateUnit,
  onTriggerSpray,
}: WaterUsageModalProps) {
  if (!isOpen) return null;

  const cropName = telemetryData?.cropDemand?.cropName || "Rice / Paddy";
  const grossWaterLiters = telemetryData?.cropDemand?.grossWaterDemandLiters || 45000;
  const grossWaterGallons = Math.round(grossWaterLiters * 0.264172);
  const pumpRuntime = telemetryData?.pumpRuntime?.formatted || "1h 35m";
  const isLockout = telemetryData?.rainLockout?.isLockoutActive || false;
  const forecastRainMm = telemetryData?.rainLockout?.totalForecastRain48h_mm || 0;
  const hourlyRain = telemetryData?.rainLockout?.hourlyRainNext24h || [];

  // Use 7-day schedule from backend telemetry, or generate fallback
  const schedule = telemetryData?.sevenDaySchedule || [
    { dayIndex: 0, dayName: "Today", dateLabel: "Day 1", status: isLockout ? "SKIP" : "IRRIGATE", volumeLiters: isLockout ? 0 : grossWaterLiters, volumeGallons: isLockout ? 0 : grossWaterGallons, runtimeFormatted: isLockout ? "0 mins" : pumpRuntime, reason: isLockout ? `Monsoon storm predicted (${forecastRainMm} mm)` : "Deficit replenishment", recommendedTimeWindow: "06:00 AM – 08:30 AM" },
    { dayIndex: 1, dayName: "Tomorrow", dateLabel: "Day 2", status: "REST", volumeLiters: 0, volumeGallons: 0, runtimeFormatted: "0 mins", reason: "Root aerated resting cycle", recommendedTimeWindow: "No watering required" },
    { dayIndex: 2, dayName: "Wednesday", dateLabel: "Day 3", status: "IRRIGATE", volumeLiters: Math.round(grossWaterLiters * 0.95), volumeGallons: Math.round(grossWaterGallons * 0.95), runtimeFormatted: pumpRuntime, reason: "Atmospheric evaporation replenishment", recommendedTimeWindow: "06:00 AM – 08:30 AM" },
    { dayIndex: 3, dayName: "Thursday", dateLabel: "Day 4", status: "REST", volumeLiters: 0, volumeGallons: 0, runtimeFormatted: "0 mins", reason: "Soil moisture retention cycle", recommendedTimeWindow: "No watering required" },
    { dayIndex: 4, dayName: "Friday", dateLabel: "Day 5", status: "IRRIGATE", volumeLiters: Math.round(grossWaterLiters * 1.05), volumeGallons: Math.round(grossWaterGallons * 1.05), runtimeFormatted: pumpRuntime, reason: "Mid-cycle crop transpiration", recommendedTimeWindow: "05:30 PM – 07:00 PM" },
    { dayIndex: 5, dayName: "Saturday", dateLabel: "Day 6", status: "REST", volumeLiters: 0, volumeGallons: 0, runtimeFormatted: "0 mins", reason: "Moisture adequate", recommendedTimeWindow: "No watering required" },
    { dayIndex: 6, dayName: "Sunday", dateLabel: "Day 7", status: "IRRIGATE", volumeLiters: grossWaterLiters, volumeGallons: grossWaterGallons, runtimeFormatted: pumpRuntime, reason: "Weekly baseline balance", recommendedTimeWindow: "06:00 AM – 08:30 AM" },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Droplets className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Farm Water Requirements & Pump Schedule</h3>
              <p className="text-[10px] text-slate-400">
                WaterWise-style automated watering calendar & pump runtime
              </p>
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
          {/* Top Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 mb-1">Target Crop</div>
              <div className="text-sm font-bold text-slate-100">{cropName}</div>
              <div className="text-[10px] text-cyan-400 font-mono">
                {field ? `${field.areaHectares.toFixed(1)} ha (${field.areaAcres.toFixed(1)} ac)` : "1.0 ha"}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 mb-1">Single Session Water</div>
              <div className="text-sm font-bold text-cyan-300 font-mono">
                {grossWaterGallons.toLocaleString()} <span className="text-xs font-normal">Gal</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                ({grossWaterLiters.toLocaleString()} Liters)
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 mb-1">Recommended Pump Run</div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-center justify-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{pumpRuntime}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                @ {flowRate} {flowRateUnit.toUpperCase()} pump rate
              </div>
            </div>
          </div>

          {/* ML Soil Moisture Downscaling Summary (Colab-Trained Model) */}
          {gridData && (
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                      <span>ML Soil Moisture Downscaling</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono">
                        R² = 0.9688
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Downscaled 30m resolution across {gridData.totalCells} grid points
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    Avg Moisture: {gridData.averageMoisture.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-red-950/30 border border-red-500/30 p-2 rounded-lg">
                  <div className="text-red-400 font-bold text-xs">{gridData.criticalCount} Cells</div>
                  <div className="text-slate-400">Critical Dry (&lt;16%)</div>
                </div>
                <div className="bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg">
                  <div className="text-amber-400 font-bold text-xs">{gridData.warningCount} Cells</div>
                  <div className="text-slate-400">Moderate (16-24%)</div>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-lg">
                  <div className="text-emerald-400 font-bold text-xs">{gridData.optimalCount} Cells</div>
                  <div className="text-slate-400">Optimal (&gt;24%)</div>
                </div>
              </div>
            </div>
          )}

          {/* 24-Hour Rainfall Forecast Chart */}
          {hourlyRain.length > 0 && (
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  <span>24-Hour Rain Forecast</span>
                </span>
                <span className="text-[10px] font-mono text-sky-300">
                  Total 48h: {forecastRainMm} mm
                </span>
              </div>
              <div className="h-14 flex items-end space-x-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80 overflow-x-auto">
                {hourlyRain.slice(0, 16).map((h: any, idx: number) => {
                  const maxRain = 10;
                  const heightPercent = Math.min((h.rain_mm / maxRain) * 100, 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center min-w-[18px]">
                      <div
                        className={`w-full rounded-t ${h.rain_mm > 0 ? "bg-sky-400" : "bg-slate-800"}`}
                        style={{ height: `${Math.max(heightPercent, 10)}%` }}
                        title={`${h.hourLabel}: ${h.rain_mm} mm`}
                      />
                      <span className="text-[7px] text-slate-500 mt-1">
                        {idx % 3 === 0 ? h.hourLabel.replace(":00", "") : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rain Lockout Alert if active */}
          {isLockout && (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/50 flex items-start space-x-3 text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-300">Smart Rain Lockout Triggered ({forecastRainMm} mm rain)</div>
                <div className="text-[11px] text-amber-200/90 mt-0.5">
                  Natural rainfall will hydrate your field. Today's pump schedule is automatically suspended to avoid waterlogging and electricity costs.
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Schedule Calendar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>7-Day WaterWise Irrigation Calendar</span>
              </h4>
              <span className="text-[10px] text-slate-400">Night & Early Morning Windows</span>
            </div>

            <div className="space-y-2">
              {schedule.map((day: any) => {
                const isIrrigate = day.status === "IRRIGATE";
                const isSkip = day.status === "SKIP";
                return (
                  <div
                    key={day.dayIndex}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSkip
                        ? "bg-amber-950/20 border-amber-500/40"
                        : isIrrigate
                        ? "bg-cyan-950/30 border-cyan-500/40 shadow-sm"
                        : "bg-slate-900/40 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-16">
                        <span className="font-bold text-slate-100 block">{day.dayName}</span>
                        <span className="text-[10px] text-slate-500">{day.dateLabel}</span>
                      </div>

                      <div className="hidden sm:block">
                        <span className="text-[11px] text-slate-300 block font-medium">{day.reason}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Window: {day.recommendedTimeWindow}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      {isIrrigate ? (
                        <div>
                          <span className="font-bold font-mono text-cyan-300 block">
                            {day.volumeGallons.toLocaleString()} Gal
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                            Run: {day.runtimeFormatted}
                          </span>
                        </div>
                      ) : isSkip ? (
                        <div className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold">
                          SKIP (Rain)
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[10px]">
                          REST DAY
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          {onTriggerSpray && (
            <button
              onClick={() => {
                onClose();
                onTriggerSpray();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Dispatch Precision Spray Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
