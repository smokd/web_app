// src/app/api/shelf-life/reports/validation/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const variety = p.get("variety");

  const where: any = {};
  if (variety) where.variety = variety;

  const samples = await prisma.shelfLifeSample.findMany({
    where,
    include: { observations: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(samples);
}
