"use client";

import React, { useEffect, useRef, useState } from "react";
import * as turf from "@turf/turf";
import confetti from "canvas-confetti";
import { FieldData, PresetLocation, DownscalingResult } from "@/types/geo";
import { Layers, Eye, EyeOff, Sparkles, Grid3X3, Droplets, CheckCircle2 } from "lucide-react";

interface MapComponentProps {
  onFieldCreated: (field: FieldData) => void;
  onFieldCleared: () => void;
  selectedPreset: PresetLocation | null;
  gridData?: DownscalingResult | null;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  isIrrigating?: boolean;
  onIrrigationComplete?: () => void;
  activeField?: FieldData | null;
  waterDemandLiters?: number;
}

// Raycasting Point-In-Polygon Algorithm
function pointInPolygon(
  x: number,
  y: number,
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

interface Particle {
  x: number;
  y: number;
  targetY: number;
  speedY: number;
  speedX: number;
  length: number;
  opacity: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export default function MapComponent({
  onFieldCreated,
  onFieldCleared,
  selectedPreset,
  gridData,
  showGrid = true,
  onToggleGrid,
  isIrrigating = false,
  onIrrigationComplete,
  activeField,
  waterDemandLiters = 500000,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const activeLayerRef = useRef<any>(null);
  const gridLayerGroupRef = useRef<any>(null);

  const [internalShowGrid, setInternalShowGrid] = useState(showGrid);
  const [hydrationProgress, setHydrationProgress] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Irrigation Animation state refs
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const irrigationStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setInternalShowGrid(showGrid);
  }, [showGrid]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("@geoman-io/leaflet-geoman-free");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default center: Sri Lanka Polonnaruwa
      const defaultLat = 7.9403;
      const defaultLng = 81.0188;
      const defaultZoom = 13;

      const map = L.map(mapContainerRef.current as HTMLElement, {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Esri Satellite Basemap
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "Esri, Maxar, Earthstar Geographics, USDA FSA, USGS",
        }
      ).addTo(map);

      // Boundaries & Place Labels
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          opacity: 0.65,
        }
      ).addTo(map);

      gridLayerGroupRef.current = L.layerGroup().addTo(map);

      map.pm.addControls({
        position: "topleft",
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawPolygon: true,
        drawRectangle: true,
        drawCircle: true,
        drawText: false,
        editMode: true,
        dragMode: true,
        cutPolygon: false,
        removalMode: true,
        rotateMode: false,
      });

      map.pm.setPathOptions({
        color: "#06b6d4",
        fillColor: "#0284c7",
        fillOpacity: 0.25,
        weight: 3,
        dashArray: "4, 6",
      });

      const processLayerGeometry = (layer: any) => {
        if (activeLayerRef.current && activeLayerRef.current !== layer) {
          map.removeLayer(activeLayerRef.current);
        }
        activeLayerRef.current = layer;
        setIsHydrated(false);

        let geojson: any;
        if (typeof layer.toGeoJSON === "function") {
          geojson = layer.toGeoJSON();
        } else {
          return;
        }

        if (layer instanceof (L as any).Circle) {
          const center = layer.getLatLng();
          const radiusMeters = layer.getRadius();
          const turfCircle = turf.circle([center.lng, center.lat], radiusMeters / 1000, {
            steps: 64,
            units: "kilometers",
          });
          geojson = turfCircle;
        }

        try {
          const areaSqMeters = turf.area(geojson);
          const areaHectares = areaSqMeters / 10000;
          const areaAcres = areaSqMeters * 0.000247105;
          const perimeterMeters = turf.length(geojson, { units: "kilometers" }) * 1000;
          const centroidFeature = turf.centroid(geojson);
          const [centroidLng, centroidLat] = centroidFeature.geometry.coordinates;

          const latLngs = (geojson.geometry.coordinates[0] || []).map(
            ([lng, lat]: [number, number]) => ({ lat, lng })
          );

          layer.setStyle({
            color: "#10b981",
            fillColor: "#0284c7",
            fillOpacity: 0.28,
            weight: 3,
            dashArray: undefined,
          });

          const fieldPayload: FieldData = {
            id: `field_${Date.now()}`,
            name: "Target Parcel (Sri Lanka)",
            coordinates: geojson.geometry.coordinates,
            latLngs,
            centroid: { lat: centroidLat, lng: centroidLng },
            areaHectares,
            areaAcres,
            perimeterMeters,
            cropType: "Rice / Paddy",
            createdAt: new Date().toISOString(),
          };

          if (typeof window !== "undefined") {
            (window as any).activeField = fieldPayload;
          }

          onFieldCreated(fieldPayload);
        } catch (err) {
          console.error("Error computing field geometry with Turf.js:", err);
        }
      };

      map.on("pm:create", (e: any) => {
        processLayerGeometry(e.layer);

        e.layer.on("pm:edit", () => {
          processLayerGeometry(e.layer);
        });

        e.layer.on("pm:dragend", () => {
          processLayerGeometry(e.layer);
        });
      });

      map.on("pm:remove", () => {
        activeLayerRef.current = null;
        if (gridLayerGroupRef.current) {
          gridLayerGroupRef.current.clearLayers();
        }
        if (typeof window !== "undefined") {
          (window as any).activeField = null;
        }
        setIsHydrated(false);
        onFieldCleared();
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Preset Farmland FlyTo
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPreset) return;
    const lat = selectedPreset.lat ?? (selectedPreset as any).center?.[0];
    const lng = selectedPreset.lng ?? (selectedPreset as any).center?.[1];
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return;
    mapInstanceRef.current.flyTo(
      [lat, lng],
      selectedPreset.zoom || 14,
      {
        duration: 1.8,
        easeLinearity: 0.25,
      }
    );
  }, [selectedPreset]);

  // Phase 4: Render 30m Micro-Stress Grid Overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !gridLayerGroupRef.current) return;

    gridLayerGroupRef.current.clearLayers();

    if (!gridData || !gridData.cells || !internalShowGrid) return;

    const renderGrid = async () => {
      const L = (await import("leaflet")).default;

      gridData.cells.forEach((cell) => {
        let color = "#10b981";
        let statusLabel = "Optimal Moisture";
        let badgeColor = "#10b981";

        if (cell.stressLevel === "critical") {
          color = "#ef4444";
          statusLabel = "Critical Drought Stress";
          badgeColor = "#ef4444";
        } else if (cell.stressLevel === "warning") {
          color = "#f59e0b";
          statusLabel = "Moderate Moisture Stress";
          badgeColor = "#f59e0b";
        }

        const marker = L.circleMarker([cell.lat, cell.lng], {
          radius: 5.5,
          fillColor: color,
          fillOpacity: 0.85,
          color: "#ffffff",
          weight: 1.2,
        });

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; font-size: 11px; color: #0f172a; min-width: 175px; padding: 2px;">
            <div style="font-weight: 700; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 5px; display: flex; justify-content: space-between;">
              <span>30m Parcel Grid</span>
              <span style="font-family: monospace; color: #64748b;">${cell.id}</span>
            </div>
            <div style="margin-bottom: 3px;">Soil Moisture: <strong style="font-size: 12px; color: #0f172a;">${cell.moisturePercentage}%</strong></div>
            <div style="margin-bottom: 3px;">Health Status: <span style="font-weight: 700; color: ${badgeColor};">${statusLabel}</span></div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1; color: #475569; font-size: 10px;">
              Variable-Rate Target: <strong style="color: #0284c7;">${cell.irrigationMultiplier}x Droplet Rate</strong>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        gridLayerGroupRef.current.addLayer(marker);
      });
    };

    renderGrid();
  }, [gridData, internalShowGrid]);

  // Phase 5: HTML5 Canvas Water Splash / Spray Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI screens
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    if (!isIrrigating || !activeField || !activeField.latLngs.length) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = [];
      ripplesRef.current = [];
      irrigationStartTimeRef.current = null;
      setHydrationProgress(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return () => window.removeEventListener("resize", handleResize);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Total duration of irrigation cycle: 8 seconds
    const TOTAL_DURATION_MS = 8000;
    irrigationStartTimeRef.current = Date.now();

    // Map screen polygon coordinates
    const getScreenPolygon = () => {
      return activeField.latLngs.map((pt) => {
        const containerPt = map.latLngToContainerPoint([pt.lat, pt.lng]);
        return { x: containerPt.x, y: containerPt.y };
      });
    };

    // Calculate Screen Bounding Box
    const getScreenBounds = (polygon: { x: number; y: number }[]) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      polygon.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
      return { minX, minY, maxX, maxY };
    };

    // Project 30m Grid Cells to Screen for Variable-Rate Targeting
    const getScreenCells = () => {
      if (!gridData || !gridData.cells || gridData.cells.length === 0) return [];
      return gridData.cells.map((c) => {
        const pt = map.latLngToContainerPoint([c.lat, c.lng]);
        return {
          x: pt.x,
          y: pt.y,
          multiplier: c.irrigationMultiplier,
          stressLevel: c.stressLevel,
        };
      });
    };

    // Spawn Particles Loop
    const spawnParticles = (screenPoly: { x: number; y: number }[], bounds: any, screenCells: any[]) => {
      // Spawn 8-16 droplets per frame for dense rainfall effect
      const SPAWN_COUNT = 12;

      for (let i = 0; i < SPAWN_COUNT; i++) {
        let spawnX = 0;
        let targetGroundY = 0;
        let attempts = 0;
        let found = false;

        if (screenCells.length > 0 && Math.random() < 0.75) {
          // Variable-Rate Targeting: Pick high-stress cells preferentially
          const weightedCell = screenCells[Math.floor(Math.random() * screenCells.length)];
          // If optimal (0x), 90% chance skip to conserve water!
          if (weightedCell.multiplier === 0 && Math.random() > 0.1) continue;

          // Jitter around cell
          const jitterX = (Math.random() - 0.5) * 35;
          const jitterY = (Math.random() - 0.5) * 35;
          const candidateX = weightedCell.x + jitterX;
          const candidateY = weightedCell.y + jitterY;

          if (pointInPolygon(candidateX, candidateY, screenPoly)) {
            spawnX = candidateX;
            targetGroundY = candidateY;
            found = true;
          }
        }

        // Fallback: Uniform random sampling within polygon bounds
        while (!found && attempts < 15) {
          attempts++;
          const rx = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
          const ry = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
          if (pointInPolygon(rx, ry, screenPoly)) {
            spawnX = rx;
            targetGroundY = ry;
            found = true;
          }
        }

        if (found) {
          // Start above target
          const startHeight = 120 + Math.random() * 150;
          particlesRef.current.push({
            x: spawnX - (Math.random() * 20),
            y: targetGroundY - startHeight,
            targetY: targetGroundY,
            speedY: 9 + Math.random() * 6,
            speedX: 1.2 + Math.random() * 1.5, // slight monsoon wind drift
            length: 12 + Math.random() * 10,
            opacity: 0.65 + Math.random() * 0.35,
            color: Math.random() > 0.4 ? "#38bdf8" : "#06b6d4",
          });
        }
      }
    };

    // 60 FPS Animation Engine
    const renderLoop = () => {
      const now = Date.now();
      const elapsed = now - (irrigationStartTimeRef.current || now);
      const progressRatio = Math.min(elapsed / TOTAL_DURATION_MS, 1.0);
      setHydrationProgress(Math.round(progressRatio * 100));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const screenPoly = getScreenPolygon();
      const bounds = getScreenBounds(screenPoly);
      const screenCells = getScreenCells();

      // Only spawn new drops if cycle is still running
      if (progressRatio < 0.98) {
        spawnParticles(screenPoly, bounds, screenCells);
      }

      // Update & Draw Falling Water Droplets
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.y += p.speedY;
        p.x += p.speedX;

        // Check ground impact
        if (p.y >= p.targetY) {
          // Spawn impact ripple
          ripplesRef.current.push({
            x: p.x,
            y: p.targetY,
            radius: 2,
            maxRadius: 12 + Math.random() * 8,
            opacity: 0.85,
            color: p.color,
          });

          // Remove droplet
          particlesRef.current.splice(i, 1);
        } else {
          // Draw falling droplet line
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.speedX * 1.5, p.y - p.length);
          ctx.stroke();
        }
      }

      // Update & Draw Ground Impact Ripples
      for (let r = ripplesRef.current.length - 1; r >= 0; r--) {
        const rip = ripplesRef.current[r];
        rip.radius += 0.55;
        rip.opacity -= 0.035;

        if (rip.opacity <= 0 || rip.radius >= rip.maxRadius) {
          ripplesRef.current.splice(r, 1);
        } else {
          ctx.beginPath();
          ctx.strokeStyle = rip.color;
          ctx.globalAlpha = Math.max(rip.opacity, 0);
          ctx.lineWidth = 1.4;
          // Flatten circle into 3D ground perspective ellipse
          ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;

      // Completion Condition
      if (progressRatio >= 1.0 && particlesRef.current.length === 0 && ripplesRef.current.length === 0) {
        // Complete! Hydrate soil
        setIsHydrated(true);
        if (activeLayerRef.current) {
          // Deep saturated hydrated emerald/blue
          activeLayerRef.current.setStyle({
            color: "#06b6d4",
            fillColor: "#0284c7",
            fillOpacity: 0.55,
            weight: 3.5,
          });
        }

        // Confetti burst
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#38bdf8", "#06b6d4", "#10b981", "#3b82f6"],
        });

        if (onIrrigationComplete) onIrrigationComplete();
      } else {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isIrrigating, activeField]);

  const toggleGrid = () => {
    const next = !internalShowGrid;
    setInternalShowGrid(next);
    if (onToggleGrid) onToggleGrid();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Phase 5: High-Performance Transparent HTML5 Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[450]"
      />

      {/* Floating Hydration Status Banner during Spray */}
      {isIrrigating && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl px-6 py-3 text-white shadow-2xl flex items-center space-x-4 pointer-events-auto animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <Droplets className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Precision Variable-Rate Spray Active
              </span>
              <span className="font-mono text-xs font-bold text-slate-100">
                {hydrationProgress}%
              </span>
            </div>
            <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-150"
                style={{ width: `${hydrationProgress}%` }}
              />
            </div>
          </div>
          <div className="text-right pl-2 border-l border-slate-800">
            <div className="text-[10px] text-slate-400">Target Dispatched</div>
            <div className="text-xs font-mono font-bold text-sky-300">
              {Math.round((waterDemandLiters * hydrationProgress) / 100).toLocaleString()} L
            </div>
          </div>
        </div>
      )}

      {/* Hydration Complete Notification */}
      {isHydrated && !isIrrigating && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 rounded-2xl px-5 py-2.5 text-white shadow-2xl flex items-center space-x-3 pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-emerald-200">
              Field Saturated & Hydrated Successfully
            </div>
            <div className="text-[10px] text-slate-300">
              Target crop moisture achieved with 0% runoff waste.
            </div>
          </div>
        </div>
      )}

      {/* Phase 4 Floating Grid Legend & Control (Top Right) */}
      {gridData && gridData.cells.length > 0 && (
        <div className="absolute top-20 right-6 z-[1000] bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 text-white shadow-2xl w-72 pointer-events-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Grid3X3 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-100">30m Micro-Stress Grid</h4>
            </div>
            <button
              onClick={toggleGrid}
              className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30 transition-all"
            >
              {internalShowGrid ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{internalShowGrid ? "Hide Grid" : "Show Grid"}</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                <span className="text-slate-300 text-[11px]">Critical Stress (&lt;16%)</span>
              </div>
              <span className="font-mono font-bold text-red-400">
                {gridData.criticalCount} <span className="text-[10px] text-slate-500 font-normal">({Math.round((gridData.criticalCount / gridData.totalCells) * 100)}%)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                <span className="text-slate-300 text-[11px]">Moderate Stress (16-24%)</span>
              </div>
              <span className="font-mono font-bold text-amber-300">
                {gridData.warningCount} <span className="text-[10px] text-slate-500 font-normal">({Math.round((gridData.warningCount / gridData.totalCells) * 100)}%)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                <span className="text-slate-300 text-[11px]">Optimal (&gt;24%)</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">
                {gridData.optimalCount} <span className="text-[10px] text-slate-500 font-normal">({Math.round((gridData.optimalCount / gridData.totalCells) * 100)}%)</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Avg Parcel Moisture:</span>
            <span className="font-mono font-bold text-cyan-300">{gridData.averageMoisture}%</span>
          </div>

          <div className="text-[9px] text-slate-500 italic">
            VRI Target: 3x droplets for Red, 1x for Amber, 0 for Green.
          </div>
        </div>
      )}
    </div>
  );
}
