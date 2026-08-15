'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

type PackhouseReject = {
  rejectType: string;
  rejectKg: number;
};

function calcRejectPct(processedKg: number, rejectKg: number) {
  if (!Number.isFinite(processedKg) || processedKg <= 0) {
    return 0;
  }

  const pct = (rejectKg / processedKg) * 100;

  return Number.isFinite(pct) ? pct : 0;
}

function parseNumber(
  value: FormDataEntryValue | null,
  fieldName: string
) {
  if (value === null || String(value).trim() === '') {
    throw new Error(`${fieldName} is required`);
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return number;
}

function parseRejects(
  value: FormDataEntryValue | null
): PackhouseReject[] {
  if (!value || String(value).trim() === '') {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error('Invalid packhouse reject data');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Packhouse rejects must be an array');
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(
        `Invalid reject at row ${index + 1}`
      );
    }

    const row = item as Record<string, unknown>;

    const rejectType = String(
      row.rejectType ?? ''
    ).trim();

    const rejectKg = Number(row.rejectKg);

    if (!rejectType) {
      throw new Error(
        `Reject type is required at row ${index + 1}`
      );
    }

    if (!Number.isFinite(rejectKg) || rejectKg < 0) {
      throw new Error(
        `Reject kg is invalid at row ${index + 1}`
      );
    }

    return {
      rejectType,
      rejectKg,
    };
  });
}


export async function createPackhouseLoad(
  formData: FormData
) {
  await requireAuth();

  const harvestId = Number(
    formData.get('harvestId')
  );

  if (!Number.isInteger(harvestId) || harvestId <= 0) {
    throw new Error('Invalid harvest ID');
  }

  const processedKg = parseNumber(
    formData.get('processedKg'),
    'Processed kg'
  );

  if (processedKg <= 0) {
    throw new Error(
      'Processed kg must be greater than zero'
    );
  }

  const notes =
    String(formData.get('notes') || '').trim() ||
    null;

  const rejects = parseRejects(
    formData.get('rejects')
  );

  const harvest = await prisma.harvest.findUnique({
    where: {
      id: harvestId,
    },
    include: {
      packhouseLoad: true,
    },
  });

  if (!harvest) {
    throw new Error('Harvest record not found');
  }

  if (harvest.packhouseLoad) {
    throw new Error(
      'This harvest already has a packhouse record'
    );
  }

  const availableKg =
  harvest.harvestedKg -
  harvest.fieldRejectsKg;

if (processedKg > availableKg) {
  throw new Error(
    `Processed kg cannot exceed available harvest quantity (${availableKg.toFixed(2)} kg)`
  );
}

  const totalRejectKg = rejects.reduce(
    (sum, reject) => sum + reject.rejectKg,
    0
  );

  if (totalRejectKg > processedKg) {
    throw new Error(
      'Packhouse rejects cannot exceed processed kg'
    );
  }

  await prisma.$transaction(async (tx) => {
    const load =
      await tx.packhouseLoad.create({
        data: {
          date: harvest.date,
          variety: harvest.variety,
          processedKg,
          notes,
          harvestId: harvest.id,
        },
      });

    if (rejects.length > 0) {
      await tx.packhouseReject.createMany({
        data: rejects.map((reject) => ({
          date: harvest.date,
          variety: harvest.variety,
          rejectType: reject.rejectType,
          rejectKg: reject.rejectKg,
          rejectPct: calcRejectPct(
            processedKg,
            reject.rejectKg
          ),
          packhouseLoadId: load.id,
        })),
      });
    }
  });

  revalidatePath('/packhouse');
  revalidatePath('/harvest');
  revalidatePath('/dashboard');

  return {
    success: true,
  };
}
