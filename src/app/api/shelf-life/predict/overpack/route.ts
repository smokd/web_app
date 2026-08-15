import { NextRequest, NextResponse } from "next/server";
import { calculateOverpackPrediction } from "@/app/shelf-life/lib/prediction";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const variety = searchParams.get("variety");
  const freightType = searchParams.get("freightType");
  const pickTemp = searchParams.get("pickTemp");
  const week = searchParams.get("week");
  const brix = searchParams.get("brix");
  const shipmentWeight = searchParams.get("shipmentWeight");

  if (!variety || !freightType || !pickTemp || !week || !brix || !shipmentWeight) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const result = await calculateOverpackPrediction({
      variety,
      freightType,
      pickTemp: Number(pickTemp),
      week: Number(week),
      brix: Number(brix),
      shipmentWeight: Number(shipmentWeight),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Prediction failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
