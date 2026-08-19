import prisma from "../src/lib/prisma";

async function main() {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: bigint;
      seq: bigint;
      table: string;
      from: string;
      to: string;
      on_update: string;
      on_delete: string;
    }>
  >(`PRAGMA foreign_key_list("PackhouseLoad")`);

  console.log("=== PACKHOUSE FOREIGN KEY ===");
  console.dir(rows, { depth: null });

  const migrations = await prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >(
    `SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at`,
  );

  console.log("\n=== MIGRATIONS ===");
  console.dir(migrations, { depth: null });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
