import prisma from './src/lib/prisma';

async function backfillPackhouseRejects() {
  console.log('Starting packhouse reject backfill...');

  // Get all packhouse loads that are now linked to harvests
  const loads = await prisma.packhouseLoad.findMany({
    where: { harvestId: { not: null } },
  });
  console.log(`Found ${loads.length} linked packhouse loads`);

  let linked = 0;
  let skipped = 0;

  for (const load of loads) {
    // Find unlinked packhouse rejects matching this load's date + variety
    const rejects = await prisma.packhouseReject.findMany({
      where: {
        date: load.date,
        variety: load.variety,
        packhouseLoadId: null,
      },
    });

    if (rejects.length > 0) {
      await prisma.packhouseReject.updateMany({
        where: { id: { in: rejects.map((r) => r.id) } },
        data: { packhouseLoadId: load.id },
      });
      linked += rejects.length;
      console.log(`✓ Linked ${rejects.length} reject(s) → packhouse load ${load.id} (${load.date} ${load.variety})`);
    } else {
      skipped++;
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`Packhouse rejects linked: ${linked}`);
  console.log(`Loads with no matching rejects: ${skipped}`);
}

backfillPackhouseRejects()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
