import { NextRequest, NextResponse } from "next/server";
import { generateMicroStressGrid } from "@/lib/services/mlDownscalerService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coordinates, regionalMoisture = 22.0, gridSpacingMeters = 30.0 } = body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: "Missing or invalid coordinates array" },
        { status: 400 }
      );
    }

    const gridResult = generateMicroStressGrid(
      coordinates,
      regionalMoisture,
      gridSpacingMeters
    );

    return NextResponse.json(gridResult);
  } catch (error: any) {
    console.error("[API Predict-Stress] Error:", error);
    return NextResponse.json(
      { error: "Internal error generating stress grid", details: error.message },
      { status: 500 }
    );
  }
}
