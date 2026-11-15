import mongoose from "mongoose";

const DispatchLogSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      required: false,
    },
    parcelName: {
      type: String,
      default: "Field Parcel",
    },
    region: {
      type: String,
      default: "Polonnaruwa",
    },
    cropType: {
      type: String,
      default: "paddy",
    },
    areaHectares: {
      type: Number,
      required: true,
    },
    cropDeficit_mm: {
      type: Number,
      required: true,
    },
    et0_mm: {
      type: Number,
      required: true,
    },
    rainLockoutActive: {
      type: Boolean,
      default: false,
    },
    forecastRain48h_mm: {
      type: Number,
      default: 0,
    },
    waterSaved_acft: {
      type: Number,
      default: 0,
    },
    electricitySaved_kwh: {
      type: Number,
      default: 0,
    },
    lkrSaved: {
      type: Number,
      default: 0,
    },
    sprayHydrationPercent: {
      type: Number,
      default: 100,
    },
    gridCellsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["completed", "locked_out", "scheduled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

export const DispatchLog = mongoose.model("DispatchLog", DispatchLogSchema);
