import prisma from './src/lib/prisma';

async function backfill() {
  console.log('Starting backfill...');

  const harvests = await prisma.harvest.findMany();
  console.log(`Found ${harvests.length} harvest records`);

  let linkedPackhouse = 0;
  let linkedFieldRejects = 0;
  let skippedPackhouse = 0;

  for (const harvest of harvests) {
    // --- Link PackhouseLoad ---
    // Find unlinked packhouse loads matching this harvest's date + variety
    const packhouseLoads = await prisma.packhouseLoad.findMany({
      where: {
        date: harvest.date,
        variety: harvest.variety,
        harvestId: null,
      },
    });

    if (packhouseLoads.length > 0) {
      // Link the first one (harvestId is @unique, only one allowed)
      await prisma.packhouseLoad.update({
        where: { id: packhouseLoads[0].id },
        data: { harvestId: harvest.id },
      });
      linkedPackhouse++;
      console.log(`✓ Linked packhouse load ${packhouseLoads[0].id} → harvest ${harvest.id} (${harvest.date} ${harvest.variety})`);

      // Warn about extras that can't be linked
      if (packhouseLoads.length > 1) {
        skippedPackhouse += packhouseLoads.length - 1;
        console.log(`  ⚠ ${packhouseLoads.length - 1} additional packhouse load(s) for this harvest could not be linked (unique constraint)`);
      }
    }

    // --- Link FieldReject ---
    // Find unlinked field rejects matching this harvest's date + variety
    const fieldRejects = await prisma.fieldReject.findMany({
      where: {
        date: harvest.date,
        variety: harvest.variety,
        harvestId: null,
      },
    });

    if (fieldRejects.length > 0) {
      await prisma.fieldReject.updateMany({
        where: { id: { in: fieldRejects.map((r) => r.id) } },
        data: { harvestId: harvest.id },
      });
      linkedFieldRejects += fieldRejects.length;
      console.log(`✓ Linked ${fieldRejects.length} field reject(s) → harvest ${harvest.id} (${harvest.date} ${harvest.variety})`);
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`Packhouse loads linked: ${linkedPackhouse}`);
  console.log(`Field rejects linked: ${linkedFieldRejects}`);
  if (skippedPackhouse > 0) {
    console.log(`Packhouse loads skipped (duplicate): ${skippedPackhouse}`);
  }
}

backfill()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
