-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PackhouseLoad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "processedKg" REAL NOT NULL,
    "notes" TEXT,
    "harvestId" INTEGER,
    CONSTRAINT "PackhouseLoad_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PackhouseLoad" ("date", "harvestId", "id", "notes", "processedKg", "variety") SELECT "date", "harvestId", "id", "notes", "processedKg", "variety" FROM "PackhouseLoad";
DROP TABLE "PackhouseLoad";
ALTER TABLE "new_PackhouseLoad" RENAME TO "PackhouseLoad";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
