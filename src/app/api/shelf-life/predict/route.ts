import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/auth';
import { predictShelfLife } from "@/app/shelf-life/lib/prediction";
import { validatePredictionInputs } from "@/app/shelf-life/lib/validation";

export async function GET(req: NextRequest) {

  try {
     await requireAuth();
    const { searchParams } = new URL(req.url);
    const variety = searchParams.get("variety") || "";
    const pickTemp = parseFloat(searchParams.get("pickTemp") || "0");
    const brix = parseFloat(searchParams.get("brix") || "0");
    const freightType = searchParams.get("freightType") || "AIR";
    const week = searchParams.get("week") ? parseInt(searchParams.get("week")!) : null;
    const packWeight = searchParams.get("packWeight")
      ? parseFloat(searchParams.get("packWeight")!)
      : null;

    // Validation
    const validation = validatePredictionInputs({
      variety,
      pickTemp,
      brix,
      freightType,
      week,
      packWeight,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid inputs",
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    const prediction = await predictShelfLife(
      variety,
      pickTemp,
      brix,
      freightType,
      week,
      packWeight
    );

    return NextResponse.json({
      ...prediction,
      input: { variety, pickTemp, brix, freightType, week, packWeight },
      warnings: [...prediction.warnings, ...validation.warnings],
    });
  } catch (error) {
    console.error("GET /api/shelf-life/predict/shelf-life error:", error);
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}
