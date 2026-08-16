'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

type RejectInputMode = 'KG' | 'PERCENT';

type FieldRejectInput = {
  rejectType: string;
  inputMode: RejectInputMode;
  inputValue: number;
};

type PackhouseRejectInput = {
  rejectType: string;
  inputMode: RejectInputMode;
  inputValue: number;
};

type PackhouseEntryInput = {
  variety: string;
  processedKg: number;
  rejectKg: number;
  rejects: PackhouseRejectInput[];
  notes?: string | null;
};

type PackhouseInput = {
  entries: PackhouseEntryInput[];
};

function calcRejectPct(
  harvested: number,
  rejects: number
) {
  if (
    !Number.isFinite(harvested) ||
    harvested <= 0
  ) {
    return 0;
  }

  const pct =
    (rejects / harvested) * 100;

  return Number.isFinite(pct)
    ? Math.round(pct * 100) / 100
    : 0;
}

function parseRejectInputMode(
  value: unknown
): RejectInputMode {
  const mode = String(value ?? 'KG')
    .trim()
    .toUpperCase();

  if (mode !== 'KG' && mode !== 'PERCENT') {
    throw new Error('Reject input mode must be KG or PERCENT');
  }

  return mode;
}


function resolveRejectBreakdown(
  rejects: Array<{
    rejectType: string;
    inputMode: RejectInputMode;
    inputValue: number;
  }>,
  totalRejectKg: number,
  fieldName: string
) {
  const kgEntries = rejects.filter(
    reject => reject.inputMode === 'KG'
  );

  const percentEntries = rejects.filter(
    reject => reject.inputMode === 'PERCENT'
  );

  const fixedKg = kgEntries.reduce(
    (sum, reject) => sum + reject.inputValue,
    0
  );

  if (fixedKg > totalRejectKg + 0.01) {
    throw new Error(
      `${fieldName} KG breakdown exceeds total reject kg`
    );
  }

  const remainingKg = Math.max(
    0,
    totalRejectKg - fixedKg
  );

  const percentTotal = percentEntries.reduce(
    (sum, reject) => sum + reject.inputValue,
    0
  );

  if (
    percentEntries.length > 0 &&
    Math.abs(percentTotal - 100) > 0.1
  ) {
    throw new Error(
      `${fieldName} percentage breakdown must total 100%`
    );
  }

  return rejects.map(reject => {
    const rejectKg =
      reject.inputMode === 'KG'
        ? reject.inputValue
        : remainingKg *
          (reject.inputValue / 100);

    return {
      ...reject,
      rejectKg,
      rejectPct:
        totalRejectKg > 0
          ? (rejectKg / totalRejectKg) * 100
          : 0,
    };
  });
}

function parseFiniteNumber(
  value: FormDataEntryValue | null,
  fieldName: string,
  defaultValue = 0
) {
  if (value === null || String(value).trim() === '') {
    return defaultValue;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return number;
}

function parseFieldRejects(
  value: FormDataEntryValue | null
): FieldRejectInput[] {
  if (value === null || String(value).trim() === '') {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error('Invalid field reject data');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Field reject data must be an array');
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(
        `Invalid field reject at row ${index + 1}`
      );
    }

    const row = item as Record<string, unknown>;

    const rejectType = String(
      row.rejectType ?? ''
    ).trim();

    const inputMode = parseRejectInputMode(
      row.inputMode
    );

    const inputValue = Number(
      row.inputValue
    );

    if (!rejectType) {
      throw new Error(
        `Field reject type is required at row ${index + 1}`
      );
    }

    if (
      !Number.isFinite(inputValue) ||
      inputValue < 0
    ) {
      throw new Error(
        `Field reject value is invalid at row ${index + 1}`
      );
    }

    if (
      inputMode === 'PERCENT' &&
      inputValue > 100
    ) {
      throw new Error(
        `Field reject percentage cannot exceed 100% at row ${index + 1}`
      );
    }

    return {
      rejectType,
      inputMode,
      inputValue,
    };
  });
}

function parsePackhouse(
  value: FormDataEntryValue | null
): PackhouseInput | null {
  if (
    value === null ||
    String(value).trim() === ''
  ) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error(
      'Invalid packhouse data'
    );
  }

  if (
    !parsed ||
    typeof parsed !== 'object'
  ) {
    throw new Error(
      'Invalid packhouse data'
    );
  }

  const raw =
    parsed as Record<string, unknown>;

  if (!Array.isArray(raw.entries)) {
    throw new Error(
      'Packhouse entries must be an array'
    );
  }

  const entries: PackhouseEntryInput[] =
    raw.entries.map(
      (item, index) => {
        if (
          !item ||
          typeof item !== 'object'
        ) {
          throw new Error(
            `Invalid packhouse entry at row ${index + 1}`
          );
        }

        const row =
          item as Record<
            string,
            unknown
          >;

        const variety =
          String(
            row.variety ?? ''
          ).trim();

        const processedKg =
          Number(
            row.processedKg
          );

        const rejectKg =
          Number(
            row.rejectKg
          ) || 0;

        if (!variety) {
          throw new Error(
            `Packhouse variety is required at row ${index + 1}`
          );
        }

        if (
          !Number.isFinite(
            processedKg
          ) ||
          processedKg < 0
        ) {
          throw new Error(
            `Packhouse processed kg is invalid at row ${index + 1}`
          );
        }

        if (
          !Number.isFinite(
            rejectKg
          ) ||
          rejectKg < 0
        ) {
          throw new Error(
            `Packhouse reject kg is invalid at row ${index + 1}`
          );
        }

        if (
          rejectKg >
          processedKg + 0.01
        ) {
          throw new Error(
            `Packhouse rejects cannot exceed processed kg at row ${index + 1}`
          );
        }

        const rawRejects =
          Array.isArray(
            row.rejects
          )
            ? row.rejects
            : [];

        const rejects =
          rawRejects.map(
            (reject, rejectIndex) => {
              if (
                !reject ||
                typeof reject !==
                  'object'
              ) {
                throw new Error(
                  `Invalid packhouse reject at row ${rejectIndex + 1}`
                );
              }

              const r =
                reject as Record<
                  string,
                  unknown
                >;

              const rejectType =
                String(
                  r.rejectType ??
                    ''
                ).trim();

              const inputMode =
                parseRejectInputMode(
                  r.inputMode
                );

              const inputValue =
                Number(
                  r.inputValue
                );

              if (!rejectType) {
                throw new Error(
                  `Packhouse reject type is required at row ${rejectIndex + 1}`
                );
              }

              if (
                !Number.isFinite(
                  inputValue
                ) ||
                inputValue < 0
              ) {
                throw new Error(
                  `Packhouse reject value is invalid at row ${rejectIndex + 1}`
                );
              }

              if (
                inputMode ===
                  'PERCENT' &&
                inputValue > 100
              ) {
                throw new Error(
                  `Packhouse reject percentage cannot exceed 100% at row ${rejectIndex + 1}`
                );
              }

              return {
                rejectType,
                inputMode,
                inputValue,
              };
            }
          );

        return {
          variety,
          processedKg,
          rejectKg,
          rejects,
          notes:
            String(
              row.notes ?? ''
            ).trim() || null,
        };
      }
    );

  return { entries };
}


export async function createHarvestRecord(formData: FormData) {
  const session = await requireAuth();


  const date = String(formData.get('date') || '').trim();
  const variety = String(formData.get('variety') || '').trim();

  const harvestedKg = parseFiniteNumber(
    formData.get('harvestedKg'),
    'Harvested kg'
  );

  const blocks =
    String(formData.get('blocks') || '').trim() || null;

  const supervisor =
    String(formData.get('supervisor') || '').trim() || null;

  const notes =
    String(formData.get('notes') || '').trim() || null;

  const weather =
    String(formData.get('weather') || '').trim() || null;

  const weatherTemp = parseFiniteNumber(
    formData.get('weatherTemp'),
    'Weather temperature',
    0
  );

  const weatherLat = parseFiniteNumber(
    formData.get('weatherLat'),
    'Weather latitude',
    0
  );

  const weatherLon = parseFiniteNumber(
    formData.get('weatherLon'),
    'Weather longitude',
    0
  );

  const weatherSource =
    String(formData.get('weatherSource') || '').trim() || null;

  if (!date || !variety) {
    throw new Error('Date and variety are required');
  }

  if (harvestedKg < 0) {
    throw new Error('Harvested kg cannot be negative');
  }

  const fieldRejects = parseFieldRejects(
    formData.get('fieldRejects')
  );



  const packhouse = parsePackhouse(
    formData.get('packhouse')
  );

  const totalFieldRejectKg = parseFiniteNumber(
    formData.get('fieldRejectsKg'),
    'Field rejects kg',
    0
  );

  const totalFieldRejectPct = calcRejectPct(
  harvestedKg,
  totalFieldRejectKg
);


  if (totalFieldRejectKg > harvestedKg) {
    throw new Error(
      'Field rejects cannot exceed harvested kg'
    );
  }
  if (totalFieldRejectPct > 100) {
  throw new Error(
    'Total field reject percentage cannot exceed 100%'
  );
}


const resolvedFieldRejects =
  resolveRejectBreakdown(
    fieldRejects,
    totalFieldRejectKg,
    'Field reject'
  );


   /* if (packhouse) {


      const totalPackhouseRejectKg = parseFiniteNumber(
  formData.get('packhouseRejectsKg'),
  'Packhouse rejects kg',
  0
    );

    if (
      totalPackhouseRejectKg >
      packhouse.processedKg
    ) {
      throw new Error(
        'Packhouse rejects cannot exceed processed kg'
      );
    }
  }  */

    let totalPackhouseRejectKg = 0;

let resolvedPackhouseRejects: ReturnType<
  typeof resolveRejectBreakdown
> = [];

/* if (packhouse) {
  totalPackhouseRejectKg = parseFiniteNumber(
    formData.get('packhouseRejectsKg'),
    'Packhouse rejects kg',
    0
  );

  if (
    totalPackhouseRejectKg >
    packhouse.processedKg
  ) {
    throw new Error(
      'Packhouse rejects cannot exceed processed kg'
    );
  }

  resolvedPackhouseRejects =
    resolveRejectBreakdown(
      packhouse.rejects,
      totalPackhouseRejectKg,
      'Packhouse reject'
    );
} */

    let packhouseEntries =
  packhouse?.entries ?? [];

for (
  const entry of packhouseEntries
) {
  if (entry.processedKg <= 0) {
    continue;
  }

  if (
    entry.rejectKg >
    entry.processedKg + 0.01
  ) {
    throw new Error(
      `Packhouse rejects cannot exceed processed kg for ${entry.variety}`
    );
  }
}

  /* const resolvedPackhouseRejects =
  resolveRejectBreakdown(
    packhouse.rejects,
    totalPackhouseRejectKg,
    'Packhouse reject'
  ); */

  const fieldRejectPct =
    calcRejectPct(
      harvestedKg,
      totalFieldRejectKg
    );


  let createdHarvestId: number;

  try {
    await prisma.$transaction(async (tx) => {
      const harvest = await tx.harvest.create({

        data: {
          date,
          variety,
          harvestedKg,
          fieldRejectsKg: totalFieldRejectKg,
          fieldRejectPct,
          blocks,
          supervisor,
          notes,
          weather,
          weatherTemp,
          weatherLat,
          weatherLon,
          weatherSource,
          userId: session.userId,
        },
      });

      createdHarvestId = harvest.id;

      if (fieldRejects.length > 0) {

        await tx.fieldReject.createMany({
          data: resolvedFieldRejects.map((reject) => ({
            date,
            variety,
            rejectType: reject.rejectType,
            inputMode: reject.inputMode,
            inputValue: reject.inputValue,
            rejectKg: reject.rejectKg,
            rejectPct: reject.rejectPct,
            harvestId: harvest.id,
          })),
        });

      }

      /* if (packhouse && packhouse.processedKg > 0) {
        const load =
          await tx.packhouseLoad.create({
            data: {
              date,
              variety,
              processedKg: packhouse.processedKg,
              notes: packhouse.notes || null,
              harvestId: harvest.id,
            },
          });

        if (packhouse.rejects.length > 0) {
          await tx.packhouseReject.createMany({
            data: resolvedPackhouseRejects.map((reject) => ({
                date,
                variety,
                rejectType: reject.rejectType,
                inputMode: reject.inputMode,
                inputValue: reject.inputValue,
                rejectKg: reject.rejectKg,
                rejectPct: reject.rejectPct,
                packhouseLoadId: load.id,
              })),
          });
        }

      } */

        for (
  const entry of packhouseEntries
) {
  if (entry.processedKg <= 0) {
    continue;
  }

  const resolvedRejects =
    resolveRejectBreakdown(
      entry.rejects,
      entry.rejectKg,
      `Packhouse reject (${entry.variety})`
    );

  const load =
    await tx.packhouseLoad.create({
      data: {
        date,
        variety:
          entry.variety,
        processedKg:
          entry.processedKg,
        notes:
          entry.notes ?? null,
        harvestId: null,
      },
    });

  if (
    resolvedRejects.length > 0
  ) {
    await tx.packhouseReject.createMany(
      {
        data:
          resolvedRejects.map(
            reject => ({
              date,
              variety:
                entry.variety,
              rejectType:
                reject.rejectType,
              inputMode:
                reject.inputMode,
              inputValue:
                reject.inputValue,
              rejectKg:
                reject.rejectKg,
              rejectPct:
                reject.rejectPct,
              packhouseLoadId:
                load.id,
            })
          ),
      }
    );
  }
}

      await createAuditLog({
  userId: session.userId,
  action: 'CREATE',
  entity: 'HARVEST',
  entityId: createdHarvestId!,
  description:
    `Created harvest record #${createdHarvestId}`,
  changes: {
    date,
    variety,
    harvestedKg,
    fieldRejectsKg:
      totalFieldRejectKg,
    fieldRejectPct,
    blocks,
    supervisor,
  },
});
    });
  } catch (error) {
    console.error(
      'Failed to create harvest record:',
      error
    );

    throw new Error(
    error instanceof Error
      ? error.message
      : 'Failed to save harvest record. No changes were made.'
  );
  }

  revalidatePath('/harvest');
  revalidatePath('/dashboard');

  return {
    success: true,
  };
}

export async function updateHarvestRecord(
  formData: FormData
) {
  const session = await requireAdmin();


  const id = Number(formData.get('id'));

  const date =
    String(formData.get('date') || '').trim();

  const variety =
    String(formData.get('variety') || '').trim();

  const harvestedKg =
    parseFiniteNumber(
      formData.get('harvestedKg'),
      'Harvested kg'
    );

  const fieldRejectsKg =
    parseFiniteNumber(
      formData.get('fieldRejectsKg'),
      'Field rejects kg'
    );

  const blocks =
    String(formData.get('blocks') || '').trim() || null;

  const weather =
    String(formData.get('weather') || '').trim() || null;

  const supervisor =
    String(formData.get('supervisor') || '').trim() || null;

  const notes =
    String(formData.get('notes') || '').trim() || null;

  if (!id || !date || !variety) {
    throw new Error(
      'Missing required fields'
    );
  }

  if (harvestedKg < 0) {
    throw new Error(
      'Harvested kg cannot be negative'
    );
  }

  if (fieldRejectsKg < 0) {
    throw new Error(
      'Field rejects cannot be negative'
    );
  }

  if (fieldRejectsKg > harvestedKg) {
    throw new Error(
      'Field rejects cannot exceed harvested kg'
    );
  }

  const fieldRejectPct =
    calcRejectPct(
      harvestedKg,
      fieldRejectsKg
    );

     const existing =
  await prisma.harvest.findUnique({
    where: { id },
  });

if (!existing) {
  throw new Error(
    'Harvest record not found'
  );
}

  await prisma.harvest.update({
    where: { id },
    data: {
      date,
      variety,
      harvestedKg,
      fieldRejectsKg,
      fieldRejectPct,
      blocks,
      weather,
      supervisor,
      notes,
    },
  });

  await createAuditLog({
  userId: session.userId,
  action: 'UPDATE',
  entity: 'HARVEST',
  entityId: id,
  description:
    `Updated harvest record #${id}`,
  changes: {
    before: {
      date: existing.date,
      variety: existing.variety,
      harvestedKg:
        existing.harvestedKg,
      fieldRejectsKg:
        existing.fieldRejectsKg,
      blocks:
        existing.blocks,
      supervisor:
        existing.supervisor,
    },

    after: {
      date,
      variety,
      harvestedKg,
      fieldRejectsKg,
      blocks,
      supervisor,
    },
  },
});

  revalidatePath('/harvest');
  revalidatePath('/dashboard');

  return {
    success: true,
  };
}



export async function deleteHarvestRecord(
  formData: FormData
) {
  const session = await requireAdmin();

  const id = Number(formData.get('id'));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      'Invalid record ID'
    );
  }

  const existing =
  await prisma.harvest.findUnique({
    where: { id },
  });

if (!existing) {
  throw new Error(
    'Harvest record not found'
  );
}
  await prisma.harvest.delete({
    where: { id },
  });

  await createAuditLog({
  userId: session.userId,
  action: 'DELETE',
  entity: 'HARVEST',
  entityId: id,
  description: `Deleted harvest record #${id}`,
  changes: {
    date: existing.date,
    variety: existing.variety,
    harvestedKg: existing.harvestedKg,
    fieldRejectsKg: existing.fieldRejectsKg,
    blocks: existing.blocks,
  },
});

  revalidatePath('/harvest');
  revalidatePath('/dashboard');

  return {
    success: true,
  };
}

