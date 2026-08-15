'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';

function calcRejectPct(harvested: number, rejects: number) {
  if (!harvested || harvested <= 0) return 0;
  const pct = rejects / harvested;
  return isFinite(pct) ? pct : 0;
}

export async function createHarvestRecord(formData: FormData) {
  await requireAuth();

  // DEBUG: log all formData keys
  const entries: Record<string, string> = {};
  formData.forEach((v, k) => { entries[k] = String(v); });


  const date = String(formData.get('date') || '').trim();
  const variety = String(formData.get('variety') || '').trim();
  const harvestedKg = Number(formData.get('harvestedKg') || 0);
  const blocks = String(formData.get('blocks') || '').trim() || null;
  const supervisor = String(formData.get('supervisor') || '').trim() || null;
  const notes = String(formData.get('notes') || '').trim() || null;

  const weather = String(formData.get('weather') || '').trim() || null;
  const weatherTemp = parseFloat(formData.get('weatherTemp') as string) || null;
  const weatherLat = parseFloat(formData.get('weatherLat') as string) || null;
  const weatherLon = parseFloat(formData.get('weatherLon') as string) || null;
  const weatherSource = String(formData.get('weatherSource') || '').trim() || null;

  // Robust field rejects parsing
  let fieldRejects: Array<{ rejectType: string; rejectPct: number }> = [];
  try {
    const frRaw = formData.get('fieldRejects');
    if (frRaw) {
      const parsed = JSON.parse(String(frRaw));
      if (Array.isArray(parsed)) fieldRejects = parsed;
    }
  } catch (e) {

  }

  // Robust packhouse parsing
  let packhouse: { processedKg: number; notes?: string; rejects: Array<{ rejectType: string; rejectKg: number }> } | null = null;
  try {
    const phRaw = formData.get('packhouse');

    if (phRaw) {
      const parsed = JSON.parse(String(phRaw));

      if (parsed && typeof parsed === 'object' && 'processedKg' in parsed) {
        packhouse = parsed;
      }
    }
  } catch (e) {

  }

  if (!date || !variety) throw new Error('Date and variety are required');
  if (harvestedKg < 0) throw new Error('Harvested kg cannot be negative');

  const totalFieldRejectPct = fieldRejects.reduce((s, r) => s + (r.rejectPct || 0), 0);
  const totalFieldRejectKg = (harvestedKg * totalFieldRejectPct) / 100;

  if (totalFieldRejectKg > harvestedKg) throw new Error('Field rejects cannot exceed harvested kg');


  const harvest = await prisma.harvest.create({
    data: {
      date,
      variety,
      harvestedKg,
      fieldRejectsKg: totalFieldRejectKg,
      fieldRejectPct: totalFieldRejectPct / 100,
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


  if (fieldRejects.length > 0) {
    await prisma.fieldReject.createMany({
      data: fieldRejects.map((r) => ({
        date,
        variety,
        rejectType: r.rejectType,
        rejectPct: r.rejectPct,
        harvestId: harvest.id,
      })),
    });

  }

  if (packhouse && packhouse.processedKg > 0) {

    const load = await prisma.packhouseLoad.create({
      data: {
        date,
        variety,
        processedKg: packhouse.processedKg,
        notes: packhouse.notes || null,
        harvestId: harvest.id,
      },
    });


    if (packhouse.rejects && packhouse.rejects.length > 0) {
      await prisma.packhouseReject.createMany({
        data: packhouse.rejects.map((r) => ({
          date,
          variety,
          rejectType: r.rejectType,
          rejectKg: r.rejectKg,
          rejectPct: load.processedKg > 0 ? (r.rejectKg / load.processedKg) * 100 : 0,
          packhouseLoadId: load.id,
        })),
      });

    }
  } else {

  }

  revalidatePath('/harvest');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateHarvestRecord(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  const date = String(formData.get('date') || '').trim();
  const variety = String(formData.get('variety') || '').trim();
  const harvestedKg = Number(formData.get('harvestedKg') || 0);
  const fieldRejectsKg = Number(formData.get('fieldRejectsKg') || 0);
  const blocks = String(formData.get('blocks') || '').trim() || null;
  const weather = String(formData.get('weather') || '').trim() || null;
  const supervisor = String(formData.get('supervisor') || '').trim() || null;
  const notes = String(formData.get('notes') || '').trim() || null;

  if (!id || !date || !variety) throw new Error('Missing required fields');
  if (harvestedKg < 0) throw new Error('Harvested kg cannot be negative');
  if (fieldRejectsKg < 0) throw new Error('Field rejects cannot be negative');
  if (fieldRejectsKg > harvestedKg) throw new Error('Field rejects cannot exceed harvested kg');

  const fieldRejectPct = calcRejectPct(harvestedKg, fieldRejectsKg);

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

  revalidatePath('/harvest');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteHarvestRecord(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing record ID');

  await prisma.harvest.delete({ where: { id } });

  revalidatePath('/harvest');
  revalidatePath('/dashboard');
  return { success: true };
}
