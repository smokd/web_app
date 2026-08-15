// src/app/api/shelf-life/reports/validation/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try{
  await requireAuth();
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
} catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error(
      'Shelf-life validation report failed:',
      error
    );

    return Response.json(
      { error: 'Failed to generate validation report.' },
      { status: 500 }
    );
  }
}
