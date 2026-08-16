'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

type FieldRejectInput = {
  rejectType: string;
  rejectKg: number;
};

type PackhouseRejectInput = {
  rejectType: string;
  rejectKg: number;
};

type PackhouseInput = {
  processedKg: number;
  notes?: string;
  rejects: PackhouseRejectInput[];
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
    rejects / harvested;

  return Number.isFinite(pct)
    ? pct
    : 0;
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
      throw new Error(`Invalid field reject at row ${index + 1}`);
    }

    const row = item as Record<string, unknown>;

    const rejectType = String(row.rejectType ?? '').trim();
    const rejectKg = Number(row.rejectKg);

    if (!rejectType) {
      throw new Error(
        `Field reject type is required at row ${index + 1}`
      );
    }


    if (!Number.isFinite(rejectKg) || rejectKg < 0) {
      throw new Error(
        `Field reject percentage is invalid at row ${index + 1}`
      );
    }

    return {
      rejectType: row.rejectType,
      rejectKg,
    };
  });
}

function parsePackhouse(
  value: FormDataEntryValue | null
): PackhouseInput | null {
  if (value === null || String(value).trim() === '') {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error('Invalid packhouse data');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid packhouse data');
  }

  const data = parsed as Record<string, unknown>;

  const processedKg = Number(data.processedKg ?? 0);

  if (!Number.isFinite(processedKg) || processedKg < 0) {
    throw new Error(
      'Packhouse processed kg must be a valid non-negative number'
    );
  }

  const notes =
    data.notes === undefined || data.notes === null
      ? undefined
      : String(data.notes).trim();

  const rawRejects = data.rejects ?? [];

  if (!Array.isArray(rawRejects)) {
    throw new Error('Packhouse rejects must be an array');
  }

  const rejects: PackhouseRejectInput[] = rawRejects.map(
    (item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(
          `Invalid packhouse reject at row ${index + 1}`
        );
      }

      const row = item as Record<string, unknown>;

      const rejectType = String(row.rejectType ?? '').trim();
      const rejectKg = Number(row.rejectKg);

      if (!rejectType) {
        throw new Error(
          `Packhouse reject type is required at row ${index + 1}`
        );
      }

      if (!Number.isFinite(rejectKg) || rejectKg < 0) {
        throw new Error(
          `Packhouse reject kg is invalid at row ${index + 1}`
        );
      }

      return {
        rejectType,
        rejectKg,
      };
    }
  );

  return {
    processedKg,
    notes,
    rejects,
  };
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

  const totalFieldRejectPct = fieldRejects.reduce(
    (sum, reject) => sum + reject.rejectPct,
    0
  );

  const totalFieldRejectKg =
    (harvestedKg * totalFieldRejectPct) / 100;

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



  if (packhouse) {
    if (packhouse.processedKg > harvestedKg) {
      throw new Error(
        'Packhouse processed kg cannot exceed harvested kg'
      );
    }

    const totalPackhouseRejectKg =
      packhouse.rejects.reduce(
        (sum, reject) => sum + reject.rejectKg,
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
  }

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
        },
      });

      createdHarvestId = harvest.id;

      if (fieldRejects.length > 0) {
        await tx.fieldReject.createMany({
  data: fieldRejects.map((reject) => {
    const rejectKg =
      (harvestedKg * reject.rejectPct) / 100;

    return {
      date,
      variety,
      rejectType: reject.rejectType,
      rejectKg,
      rejectPct: reject.rejectPct,
      harvestId: harvest.id,
    };
  }),
});
      }

      if (packhouse && packhouse.processedKg > 0) {
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
            data: packhouse.rejects.map((reject) => ({
              date,
              variety,
              rejectType: reject.rejectType,
              rejectKg: reject.rejectKg,
              rejectPct:
                calcRejectPct(
                  load.processedKg,
                  reject.rejectKg
                ),
              packhouseLoadId: load.id,
            })),
          });
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
      'Failed to save harvest record. No changes were made.'
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
      totalFieldRejectKg
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

