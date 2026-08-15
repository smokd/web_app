'use server';

import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createShelfLifeSample(formData: FormData) {
  await requireAuth();

  const sample = await prisma.shelfLifeSample.create({
    data: {
      sampleId: String(formData.get('sampleId') || '').trim(),
      sampleType: String(formData.get('sampleType') || '').trim(),
      variety: String(formData.get('variety') || '').trim(),
      fruitSize: formData.get('fruitSize') ? Number(formData.get('fruitSize')) : null,
      lCode: String(formData.get('lCode') || '').trim() || null,
      block: String(formData.get('block') || '').trim() || null,
      pickDate: String(formData.get('pickDate') || '').trim() || null,
      pickTemp: formData.get('pickTemp') ? Number(formData.get('pickTemp')) : null,
      packDate: String(formData.get('packDate') || '').trim() || null,
      brix: formData.get('brix') ? Number(formData.get('brix')) : null,
      freightType: String(formData.get('freightType') || '').trim() || null,
      customer: String(formData.get('customer') || '').trim() || null,
      palletCode: String(formData.get('palletCode') || '').trim() || null,
      week: formData.get('week') ? Number(formData.get('week')) : null,
      moisturePct: formData.get('moisturePct') ? Number(formData.get('moisturePct')) : null,
      packWeight: formData.get('packWeight') ? Number(formData.get('packWeight')) : null,
      targetTemp: formData.get('targetTemp') ? Number(formData.get('targetTemp')) : 5.0,
      notes: String(formData.get('notes') || '').trim() || null,
    },
  });

  revalidatePath('/shelf-life');
  return { success: true, id: sample.id };
}

export async function addObservation(formData: FormData) {
  await requireAuth();

  const sampleId = String(formData.get('sampleId'));
  const day = Number(formData.get('day'));
  const shrivelCount = Number(formData.get('shrivelCount') || 0);
  const softCount = Number(formData.get('softCount') || 0);
  const collapsedCount = Number(formData.get('collapsedCount') || 0);
  const totalDefects = shrivelCount + softCount + collapsedCount;

  await prisma.shelfLifeObservation.create({
    data: {
      sampleId,
      day,
      shrivelCount,
      softCount,
      collapsedCount,
      otherDefects: String(formData.get('otherDefects') || '').trim() || null,
      overallStatus: String(formData.get('overallStatus') || '').trim() || null,
      totalDefects,
      notes: String(formData.get('notes') || '').trim() || null,
    },
  });

  const overallStatus = String(formData.get('overallStatus') || '');
  if (overallStatus === 'FAIL') {
    await prisma.shelfLifeSample.update({
      where: { id: sampleId },
      data: {
        status: 'FAILED',
        totalDays: day,
        failureReason: totalDefects > 0 ? 'defects' : 'weight_loss',
      },
    });
  }

  revalidatePath(`/shelf-life/${sampleId}`);
  revalidatePath('/shelf-life');
  return { success: true };
}

export async function addWeightReading(formData: FormData) {
  await requireAuth();

  const sampleId = String(formData.get('sampleId'));
  const day = Number(formData.get('day'));
  const weightGrams = Number(formData.get('weightGrams'));

  const sample = await prisma.shelfLifeSample.findUnique({
    where: { id: sampleId },
    select: { packWeight: true },
  });

  const packWeight = sample?.packWeight || weightGrams;
  const weightLossPct = packWeight > 0 ? ((packWeight - weightGrams) / packWeight) * 100 : 0;

  const prev = await prisma.shelfLifeWeightReading.findFirst({
    where: { sampleId },
    orderBy: { day: 'desc' },
  });

  const lossRatePctDay = prev && day > prev.day
    ? (weightLossPct - (prev.weightLossPct || 0)) / (day - prev.day)
    : weightLossPct / day;

  let abnormal = false;
  if (prev && weightGrams > prev.weightGrams * 1.02) abnormal = true;
  if (prev && ((prev.weightGrams - weightGrams) / prev.weightGrams) * 100 > 5) abnormal = true;
  if (weightLossPct > 10) abnormal = true;

  await prisma.shelfLifeWeightReading.create({
    data: {
      sampleId,
      day,
      weightGrams,
      weightLossPct,
      lossRatePctDay,
      abnormal,
    },
  });

  revalidatePath(`/shelf-life/${sampleId}`);
  return { success: true };
}

export async function markSampleFailed(formData: FormData) {
  await requireAuth();

  const id = String(formData.get('id'));
  const totalDays = Number(formData.get('totalDays'));
  const failureReason = String(formData.get('failureReason') || '').trim();

  await prisma.shelfLifeSample.update({
    where: { id },
    data: { status: 'FAILED', totalDays, failureReason },
  });

  revalidatePath(`/shelf-life/${id}`);
  revalidatePath('/shelf-life');
  return { success: true };
}

export async function deleteShelfLifeSample(formData: FormData) {
  await requireAuth();
  const id = String(formData.get('id'));
  await prisma.shelfLifeSample.delete({ where: { id } });
  revalidatePath('/shelf-life');
  return { success: true };
}
