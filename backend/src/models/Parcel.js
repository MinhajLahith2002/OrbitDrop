import mongoose from "mongoose";

const GeoJSONPolygonSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true,
      default: "Polygon",
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of [longitude, latitude] pairs
      required: true,
    },
  },
  { _id: false }
);

const ParcelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: () => `Parcel-${Date.now().toString().slice(-4)}`,
    },
    region: {
      type: String,
      default: "Polonnaruwa",
      enum: [
        "Polonnaruwa",
        "Anuradhapura",
        "Nuwara Eliya",
        "Kurunegala",
        "Jaffna",
        "Ampara",
        "Custom Region",
      ],
    },
    cropType: {
      type: String,
      default: "paddy",
      enum: ["paddy", "tea", "coconut", "sugarcane", "vegetables", "maize"],
    },
    growthStage: {
      type: String,
      default: "mid",
      enum: ["initial", "development", "mid", "late"],
    },
    irrigationMethod: {
      type: String,
      default: "basin",
      enum: ["basin", "sprinkler", "drip"],
    },
    areaHectares: {
      type: Number,
      required: true,
    },
    areaAcres: {
      type: Number,
      required: true,
    },
    perimeterKm: {
      type: Number,
      default: 0,
    },
    geometry: {
      type: GeoJSONPolygonSchema,
      required: true,
    },
    latestTelemetry: {
      et0_mm: Number,
      cropDeficit_mm: Number,
      rainLockout: Boolean,
      forecastRain48h_mm: Number,
      calculatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for high-performance spatial GIS queries
ParcelSchema.index({ geometry: "2dsphere" });

export const Parcel = mongoose.model("Parcel", ParcelSchema);
