"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

type RejectInputMode = "KG" | "PERCENT";

type FieldRejectInput = {
  rejectType: string;
  inputMode: RejectInputMode;
  inputValue: number;
};

type HarvestEntryInput = {
  variety: string;
  harvestedKg: number;
  blocks?: string | null;
  fieldRejects: FieldRejectInput[];
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

function calcRejectPct(harvested: number, rejects: number) {
  if (!Number.isFinite(harvested) || harvested <= 0) {
    return 0;
  }

  const pct = (rejects / harvested) * 100;

  return Number.isFinite(pct) ? Math.round(pct * 100) / 100 : 0;
}

function parseRejectInputMode(value: unknown): RejectInputMode {
  const mode = String(value ?? "KG")
    .trim()
    .toUpperCase();

  if (mode !== "KG" && mode !== "PERCENT") {
    throw new Error("Reject input mode must be KG or PERCENT");
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
  fieldName: string,
) {
  const kgEntries = rejects.filter((reject) => reject.inputMode === "KG");

  const percentEntries = rejects.filter(
    (reject) => reject.inputMode === "PERCENT",
  );

  const fixedKg = kgEntries.reduce((sum, reject) => sum + reject.inputValue, 0);

  if (fixedKg > totalRejectKg + 0.01) {
    throw new Error(`${fieldName} KG breakdown exceeds total reject kg`);
  }

  const remainingKg = Math.max(0, totalRejectKg - fixedKg);

  const percentTotal = percentEntries.reduce(
    (sum, reject) => sum + reject.inputValue,
    0,
  );

  if (percentEntries.length > 0 && Math.abs(percentTotal - 100) > 0.1) {
    throw new Error(`${fieldName} percentage breakdown must total 100%`);
  }

  return rejects.map((reject) => {
    const rejectKg =
      reject.inputMode === "KG"
        ? reject.inputValue
        : remainingKg * (reject.inputValue / 100);

    return {
      ...reject,
      rejectKg,
      rejectPct: totalRejectKg > 0 ? (rejectKg / totalRejectKg) * 100 : 0,
    };
  });
}

function parseFiniteNumber(
  value: FormDataEntryValue | null,
  fieldName: string,
  defaultValue = 0,
) {
  if (value === null || String(value).trim() === "") {
    return defaultValue;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return number;
}

function parseFieldRejects(
  value: FormDataEntryValue | null,
): FieldRejectInput[] {
  if (value === null || String(value).trim() === "") {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error("Invalid field reject data");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Field reject data must be an array");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid field reject at row ${index + 1}`);
    }

    const row = item as Record<string, unknown>;

    const rejectType = String(row.rejectType ?? "").trim();

    const inputMode = parseRejectInputMode(row.inputMode);

    const inputValue = Number(row.inputValue);

    if (!rejectType) {
      throw new Error(`Field reject type is required at row ${index + 1}`);
    }

    if (!Number.isFinite(inputValue) || inputValue < 0) {
      throw new Error(`Field reject value is invalid at row ${index + 1}`);
    }

    if (inputMode === "PERCENT" && inputValue > 100) {
      throw new Error(
        `Field reject percentage cannot exceed 100% at row ${index + 1}`,
      );
    }

    return {
      rejectType,
      inputMode,
      inputValue,
    };
  });
}

function parseHarvestEntries(
  value: FormDataEntryValue | null,
): HarvestEntryInput[] {
  if (value === null || String(value).trim() === "") {
    throw new Error("At least one harvest variety is required");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error("Invalid harvest entries data");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("At least one harvest variety is required");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid harvest entry at row ${index + 1}`);
    }

    const row = item as Record<string, unknown>;

    const variety = String(row.variety ?? "").trim();

    const harvestedKg = Number(row.harvestedKg);

    const blocks = String(row.blocks ?? "").trim() || null;

    if (!variety) {
      throw new Error(`Harvest variety is required at row ${index + 1}`);
    }

    if (!Number.isFinite(harvestedKg) || harvestedKg <= 0) {
      throw new Error(`Harvested kg is invalid for ${variety}`);
    }

    const fieldRejects = Array.isArray(row.fieldRejects)
      ? row.fieldRejects.map((reject, rejectIndex) => {
          if (!reject || typeof reject !== "object") {
            throw new Error(
              `Invalid field reject at row ${rejectIndex + 1} for ${variety}`,
            );
          }

          const r = reject as Record<string, unknown>;

          const rejectType = String(r.rejectType ?? "").trim();

          const inputMode = parseRejectInputMode(r.inputMode);

          const inputValue = Number(r.inputValue);

          if (!rejectType) {
            throw new Error(`Field reject type is required for ${variety}`);
          }

          if (!Number.isFinite(inputValue) || inputValue < 0) {
            throw new Error(`Invalid field reject value for ${variety}`);
          }

          if (inputMode === "PERCENT" && inputValue > 100) {
            throw new Error(
              `Field reject percentage cannot exceed 100% for ${variety}`,
            );
          }

          return {
            rejectType,
            inputMode,
            inputValue,
          };
        })
      : [];

    return {
      variety,
      harvestedKg,
      blocks,
      fieldRejects,
    };
  });
}

function parsePackhouse(
  value: FormDataEntryValue | null,
): PackhouseInput | null {
  if (value === null || String(value).trim() === "") {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new Error("Invalid packhouse data");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid packhouse data");
  }

  const raw = parsed as Record<string, unknown>;

  if (!Array.isArray(raw.entries)) {
    throw new Error("Packhouse entries must be an array");
  }

  const entries: PackhouseEntryInput[] = raw.entries.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid packhouse entry at row ${index + 1}`);
    }

    const row = item as Record<string, unknown>;

    const variety = String(row.variety ?? "").trim();

    const processedKg = Number(row.processedKg);

    const rejectKg = Number(row.rejectKg) || 0;

    if (!variety) {
      throw new Error(`Packhouse variety is required at row ${index + 1}`);
    }

    if (!Number.isFinite(processedKg) || processedKg < 0) {
      throw new Error(`Packhouse processed kg is invalid at row ${index + 1}`);
    }

    if (!Number.isFinite(rejectKg) || rejectKg < 0) {
      throw new Error(`Packhouse reject kg is invalid at row ${index + 1}`);
    }

    if (rejectKg > processedKg + 0.01) {
      throw new Error(
        `Packhouse rejects cannot exceed processed kg at row ${index + 1}`,
      );
    }

    const rawRejects = Array.isArray(row.rejects) ? row.rejects : [];

    const rejects = rawRejects.map((reject, rejectIndex) => {
      if (!reject || typeof reject !== "object") {
        throw new Error(`Invalid packhouse reject at row ${rejectIndex + 1}`);
      }

      const r = reject as Record<string, unknown>;

      const rejectType = String(r.rejectType ?? "").trim();

      const inputMode = parseRejectInputMode(r.inputMode);

      const inputValue = Number(r.inputValue);

      if (!rejectType) {
        throw new Error(
          `Packhouse reject type is required at row ${rejectIndex + 1}`,
        );
      }

      if (!Number.isFinite(inputValue) || inputValue < 0) {
        throw new Error(
          `Packhouse reject value is invalid at row ${rejectIndex + 1}`,
        );
      }

      if (inputMode === "PERCENT" && inputValue > 100) {
        throw new Error(
          `Packhouse reject percentage cannot exceed 100% at row ${rejectIndex + 1}`,
        );
      }

      return {
        rejectType,
        inputMode,
        inputValue,
      };
    });

    return {
      variety,
      processedKg,
      rejectKg,
      rejects,
      notes: String(row.notes ?? "").trim() || null,
    };
  });

  return { entries };
}

export async function createHarvestRecord(formData: FormData) {
  const session = await requireAuth();

  const date = String(formData.get("date") || "").trim();

  const supervisor = String(formData.get("supervisor") || "").trim() || null;

  const notes = String(formData.get("notes") || "").trim() || null;

  const weather = String(formData.get("weather") || "").trim() || null;

  const weatherTemp = parseFiniteNumber(
    formData.get("weatherTemp"),
    "Weather temperature",
    0,
  );

  const weatherLat = parseFiniteNumber(
    formData.get("weatherLat"),
    "Weather latitude",
    0,
  );

  const weatherLon = parseFiniteNumber(
    formData.get("weatherLon"),
    "Weather longitude",
    0,
  );

  const weatherSource =
    String(formData.get("weatherSource") || "").trim() || null;

  if (!date) {
    throw new Error("Harvest date is required");
  }

  const harvestEntries = parseHarvestEntries(formData.get("harvestEntries"));

  if (!date || !variety) {
    throw new Error("Date and variety are required");
  }

  if (harvestedKg < 0) {
    throw new Error("Harvested kg cannot be negative");
  }

  const packhouse = parsePackhouse(formData.get("packhouse"));

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

  let resolvedPackhouseRejects: ReturnType<typeof resolveRejectBreakdown> = [];

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

  let packhouseEntries = packhouse?.entries ?? [];

  /* for (const entry of packhouseEntries) {
    if (entry.processedKg <= 0) {
      continue;
    }

    if (entry.rejectKg > entry.processedKg + 0.01) {
      throw new Error(
        `Packhouse rejects cannot exceed processed kg for ${entry.variety}`,
      );
    }
  } */

  const resolvedPackhouseEntries = packhouseEntries.map((entry) => {
    if (entry.processedKg < 0) {
      throw new Error(
        `Packhouse processed kg cannot be negative for ${entry.variety}`,
      );
    }

    if (entry.rejectKg > entry.processedKg + 0.01) {
      throw new Error(
        `Packhouse rejects cannot exceed processed kg for ${entry.variety}`,
      );
    }

    const resolvedRejects = resolveRejectBreakdown(
      entry.rejects,
      entry.rejectKg,
      `Packhouse reject (${entry.variety})`,
    );

    return {
      ...entry,
      resolvedRejects,
    };
  });

  /* const resolvedPackhouseRejects =
  resolveRejectBreakdown(
    packhouse.rejects,
    totalPackhouseRejectKg,
    'Packhouse reject'
  ); */

  const fieldRejectPct = calcRejectPct(harvestedKg, totalFieldRejectKg);

  const createdHarvestIds: number[] = [];

  for (const entry of harvestEntries) {
    const totalFieldRejectKg = entry.fieldRejects.reduce((sum, reject) => {
      if (reject.inputMode === "KG") {
        return sum + reject.inputValue;
      }

      return sum + (entry.harvestedKg * reject.inputValue) / 100;
    }, 0);

    if (totalFieldRejectKg > entry.harvestedKg + 0.01) {
      throw new Error(
        `Field rejects cannot exceed harvested kg for ${entry.variety}`,
      );
    }

    const fieldRejectPct = calcRejectPct(entry.harvestedKg, totalFieldRejectKg);

    const resolvedFieldRejects = resolveRejectBreakdown(
      entry.fieldRejects,
      totalFieldRejectKg,
      `Field reject (${entry.variety})`,
    );

    try {
      await prisma.$transaction(async (tx) => {
        const harvest = await tx.harvest.create({
          data: {
            date,
            variety: entry.variety,
            harvestedKg: entry.harvestedKg,
            fieldRejectsKg: totalFieldRejectKg,
            fieldRejectPct,
            blocks: entry.blocks ?? null,
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

        createdHarvestIds.push(harvest.id);

        if (resolvedFieldRejects.length > 0) {
          await tx.fieldReject.createMany({
            data: resolvedFieldRejects.map((reject) => ({
              date,
              variety: entry.variety,
              rejectType: reject.rejectType,
              inputMode: reject.inputMode,
              inputValue: reject.inputValue,
              rejectKg: reject.rejectKg,
              rejectPct: reject.rejectPct,
              harvestId: harvest.id,
            })),
          });
        }

        for (const entry of resolvedPackhouseEntries) {
          if (entry.processedKg <= 0) {
            continue;
          }

          const load = await tx.packhouseLoad.create({
            data: {
              date,
              variety: entry.variety,
              processedKg: entry.processedKg,
              notes: entry.notes ?? null,
              harvestId: harvest.id,
            },
          });

          if (entry.resolvedRejects.length > 0) {
            await tx.packhouseReject.createMany({
              data: entry.resolvedRejects.map((reject) => ({
                date,
                variety: entry.variety,
                rejectType: reject.rejectType,
                inputMode: reject.inputMode,
                inputValue: reject.inputValue,
                rejectKg: reject.rejectKg,
                rejectPct: reject.rejectPct,
                notes: entry.notes ?? null,
                packhouseLoadId: load.id,
              })),
            });
          }
        }

        await createAuditLog({
          userId: session.userId,
          action: "CREATE",
          entity: "HARVEST",
          entityId: createdHarvestIds[0]!,
          description: `Created ${createdHarvestIds.length} harvest record${
            createdHarvestIds.length === 1 ? "" : "s"
          }`,
          changes: {
            date,
            varieties: harvestEntries.map((entry) => ({
              variety: entry.variety,
              harvestedKg: entry.harvestedKg,
              blocks: entry.blocks,
              fieldRejects: entry.fieldRejects,
            })),
            supervisor,
          },
        });
      });
    } catch (error) {
      console.error("Failed to create harvest record:", error);

      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to save harvest record. No changes were made.",
      );
    }

    revalidatePath("/harvest");
    revalidatePath("/dashboard");

    return {
      success: true,
      harvestIds: createdHarvestIds,
    };
  }
}

export async function updateHarvestRecord(formData: FormData) {
  const session = await requireAdmin();

  const id = Number(formData.get("id"));

  const date = String(formData.get("date") || "").trim();

  const variety = String(formData.get("variety") || "").trim();

  const harvestedKg = parseFiniteNumber(
    formData.get("harvestedKg"),
    "Harvested kg",
  );

  const fieldRejectsKg = parseFiniteNumber(
    formData.get("fieldRejectsKg"),
    "Field rejects kg",
  );

  const blocks = String(formData.get("blocks") || "").trim() || null;

  const weather = String(formData.get("weather") || "").trim() || null;

  const supervisor = String(formData.get("supervisor") || "").trim() || null;

  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id || !date || !variety) {
    throw new Error("Missing required fields");
  }

  if (harvestedKg < 0) {
    throw new Error("Harvested kg cannot be negative");
  }

  if (fieldRejectsKg < 0) {
    throw new Error("Field rejects cannot be negative");
  }

  if (fieldRejectsKg > harvestedKg) {
    throw new Error("Field rejects cannot exceed harvested kg");
  }

  const fieldRejectPct = calcRejectPct(harvestedKg, fieldRejectsKg);

  const existing = await prisma.harvest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Harvest record not found");
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
    action: "UPDATE",
    entity: "HARVEST",
    entityId: id,
    description: `Updated harvest record #${id}`,
    changes: {
      before: {
        date: existing.date,
        variety: existing.variety,
        harvestedKg: existing.harvestedKg,
        fieldRejectsKg: existing.fieldRejectsKg,
        blocks: existing.blocks,
        supervisor: existing.supervisor,
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

  revalidatePath("/harvest");
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

export async function deleteHarvestRecord(formData: FormData) {
  const session = await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid record ID");
  }

  const existing = await prisma.harvest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Harvest record not found");
  }
  await prisma.harvest.delete({
    where: { id },
  });

  await createAuditLog({
    userId: session.userId,
    action: "DELETE",
    entity: "HARVEST",
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

  revalidatePath("/harvest");
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}
