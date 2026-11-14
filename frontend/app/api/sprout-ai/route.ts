import { NextRequest, NextResponse } from "next/server";
import { generateSproutAdvice } from "@/lib/services/sproutAiService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body;

    const advice = generateSproutAdvice(question, context);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      question,
      advice,
    });
  } catch (error: any) {
    console.error("[API Sprout AI] Error:", error);
    return NextResponse.json(
      { error: "Error generating Sprout AI advice", details: error.message },
      { status: 500 }
    );
  }
}
