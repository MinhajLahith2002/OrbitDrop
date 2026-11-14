import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Parcel } from "./models/Parcel.js";
import { DispatchLog } from "./models/DispatchLog.js";
import { fetchNasaTelemetry } from "./services/nasaPowerService.js";
import { calculateFAO56_ET0, calculateCropDemand, CROP_COEFFICIENTS, IRRIGATION_METHODS } from "./services/agronomyService.js";
import { evaluateRainLockout } from "./services/lockoutService.js";
import { generateMicroStressGrid } from "./services/mlDownscalerService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));

// Connect to MongoDB
connectDB();

// Health Endpoint
app.get("/health", (req, res) => {
  const mongoStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const mongoStatus = mongoStates[mongoose.connection.readyState] || "unknown";

  res.json({
    status: "healthy",
    service: "OrbitDrop Backend API",
    version: "1.0.0",
    port: PORT,
    database: {
      type: "MongoDB",
      status: mongoStatus,
      dbName: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
  });
});

// Crops & Irrigation reference
app.get("/api/crops", (req, res) => {
  res.json({ crops: CROP_COEFFICIENTS, irrigationMethods: IRRIGATION_METHODS });
});

// -------------------------------------------------------------
// MongoDB Parcel CRUD APIs (GeoJSON with 2dsphere index)
// -------------------------------------------------------------

// 1. Get all saved field parcels
app.get("/api/parcels", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, parcels: [], message: "MongoDB offline, operating in ephemeral mode" });
    }
    const parcels = await Parcel.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: parcels.length, parcels });
  } catch (err) {
    console.error("[MongoDB] Error fetching parcels:", err);
    return res.status(500).json({ error: "Failed to fetch parcels", details: err.message });
  }
});

// 2. Save a new field parcel
app.post("/api/parcels", async (req, res) => {
  try {
    const { name, region, cropType, growthStage, irrigationMethod, areaHectares, areaAcres, perimeterKm, geometry, latestTelemetry } = req.body;

    if (!geometry || !geometry.coordinates) {
      return res.status(400).json({ error: "Missing required GeoJSON polygon geometry" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        savedToDB: false,
        message: "Parcel processed (MongoDB currently offline)",
        parcel: req.body,
      });
    }

    const newParcel = new Parcel({
      name: name || `Parcel-${Date.now().toString().slice(-4)}`,
      region: region || "Polonnaruwa",
      cropType: cropType || "paddy",
      growthStage: growthStage || "mid",
      irrigationMethod: irrigationMethod || "basin",
      areaHectares: areaHectares || 1.0,
      areaAcres: areaAcres || 2.47,
      perimeterKm: perimeterKm || 0,
      geometry,
      latestTelemetry,
    });

    const saved = await newParcel.save();
    return res.status(201).json({ success: true, savedToDB: true, parcel: saved });
  } catch (err) {
    console.error("[MongoDB] Error saving parcel:", err);
    return res.status(500).json({ error: "Failed to save parcel", details: err.message });
  }
});

// 3. Delete a parcel by ID
app.delete("/api/parcels/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, deleted: true });
    }
    await Parcel.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Parcel deleted successfully" });
  } catch (err) {
    console.error("[MongoDB] Error deleting parcel:", err);
    return res.status(500).json({ error: "Failed to delete parcel", details: err.message });
  }
});

// -------------------------------------------------------------
// MongoDB Irrigation Dispatch History APIs
// -------------------------------------------------------------

// 1. Get recent dispatch history
app.get("/api/dispatches", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, dispatches: [] });
    }
    const dispatches = await DispatchLog.find().sort({ createdAt: -1 }).limit(20);
    return res.json({ success: true, count: dispatches.length, dispatches });
  } catch (err) {
    console.error("[MongoDB] Error fetching dispatches:", err);
    return res.status(500).json({ error: "Failed to fetch dispatches", details: err.message });
  }
});

// 2. Log an irrigation dispatch event
app.post("/api/dispatches", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({ success: true, savedToDB: false, dispatch: req.body });
    }
    const log = new DispatchLog(req.body);
    const saved = await log.save();
    return res.status(201).json({ success: true, savedToDB: true, dispatch: saved });
  } catch (err) {
    console.error("[MongoDB] Error logging dispatch:", err);
    return res.status(500).json({ error: "Failed to log dispatch", details: err.message });
  }
});

// -------------------------------------------------------------
// Telemetry & Evapotranspiration API (FAO-56 & NASA POWER)
// -------------------------------------------------------------
app.post("/api/telemetry", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      areaHectares = 1.0,
      crop = "paddy",
      growthStage = "mid",
      irrigationMethod = "basin",
      simulateStorm = false,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude coordinates" });
    }

    // 1. Ingest NASA POWER telemetry
    const nasaData = await fetchNasaTelemetry(latitude, longitude);

    // 2. Compute FAO-56 Penman-Monteith ET0
    const et0Result = calculateFAO56_ET0(nasaData.telemetry);

    // 3. Compute Crop Water Demand & Deficit
    const cropResult = calculateCropDemand(
      et0Result.ET0_mm_per_day,
      crop,
      growthStage,
      areaHectares,
      nasaData.telemetry.precipitation_mm,
      irrigationMethod
    );

    // 4. Compute 7-day historical timeline
    const historyWithET0 = (nasaData.history || []).map((record) => {
      const dayET0 = calculateFAO56_ET0(record);
      const dayDemand = calculateCropDemand(
        dayET0.ET0_mm_per_day,
        crop,
        growthStage,
        areaHectares,
        record.precipitation_mm,
        irrigationMethod
      );
      return {
        date: record.date,
        formattedDate: record.formattedDate,
        solarRadiation: record.solarRadiation_MJ_m2_day,
        temperature: record.temperature_C,
        tempMax: record.tempMax_C,
        tempMin: record.tempMin_C,
        humidity: record.relativeHumidity_percent,
        windSpeed: record.windSpeed_m_s,
        precipitation: record.precipitation_mm,
        ET0_mm_per_day: dayET0.ET0_mm_per_day,
        ETc_mm_per_day: dayDemand.ETc_mm_per_day,
        waterDemandLiters: dayDemand.waterDemandLiters,
        vpd_kPa: dayET0.vaporPressureDeficit_kPa,
      };
    });

    // 5. Evaluate Rain Forecast & Smart Lockout
    const lockoutResult = await evaluateRainLockout(
      latitude,
      longitude,
      cropResult.netDeficit_mm,
      areaHectares,
      simulateStorm
    );

    return res.json({
      timestamp: new Date().toISOString(),
      coordinates: { latitude, longitude },
      nasa: {
        success: nasaData.success,
        isFallback: nasaData.isFallback,
        dataDate: nasaData.dataDate,
        telemetry: nasaData.telemetry,
      },
      evapotranspiration: et0Result,
      cropDemand: cropResult,
      historyTimeline: historyWithET0,
      rainLockout: lockoutResult,
    });
  } catch (error) {
    console.error("[Backend API Telemetry] Error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// -------------------------------------------------------------
// 30m Micro-Stress Spatial Downscaling API
// -------------------------------------------------------------
app.post("/api/predict-stress", (req, res) => {
  try {
    const { coordinates, regionalMoisture = 22.0, gridSpacingMeters = 30.0 } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: "Missing or invalid coordinates array" });
    }

    const gridResult = generateMicroStressGrid(coordinates, regionalMoisture, gridSpacingMeters);
    return res.json(gridResult);
  } catch (error) {
    console.error("[Backend API Predict-Stress] Error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🛰️ OrbitDrop Backend API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
