-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_userId_idx";

-- CreateTable
CREATE TABLE "ShelfLifeObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shrivelCount" INTEGER NOT NULL DEFAULT 0,
    "softCount" INTEGER NOT NULL DEFAULT 0,
    "collapsedCount" INTEGER NOT NULL DEFAULT 0,
    "otherDefects" TEXT,
    "overallStatus" TEXT,
    "totalDefects" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    FOREIGN KEY ("sampleId") REFERENCES "ShelfLifeSample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShelfLifeSample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "fruitSize" INTEGER,
    "lCode" TEXT,
    "block" TEXT,
    "pickDate" TEXT,
    "pickTemp" REAL,
    "packDate" TEXT,
    "brix" REAL,
    "freightType" TEXT,
    "customer" TEXT,
    "palletCode" TEXT,
    "week" INTEGER,
    "moisturePct" REAL,
    "packWeight" REAL,
    "targetTemp" REAL NOT NULL DEFAULT 5.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalDays" INTEGER,
    "failureReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShelfLifeTempImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tempRange" TEXT NOT NULL,
    "avgShelfLife" REAL,
    "failureRate" REAL,
    "sampleCount" INTEGER
);

-- CreateTable
CREATE TABLE "ShelfLifeVarietyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variety" TEXT NOT NULL,
    "avgShelfLifeAir" REAL,
    "avgShelfLifeSea" REAL,
    "failureRatePct" REAL,
    "avgBrix" REAL,
    "avgPickTemp" REAL,
    "recommendedAirOverpack" REAL,
    "recommendedSeaOverpack" REAL,
    "riskLevelAir" TEXT,
    "riskLevelSea" TEXT
);

-- CreateTable
CREATE TABLE "ShelfLifeWeightCurve" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variety" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "predictedLossPct" REAL NOT NULL,
    "upper95LossPct" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "ShelfLifeWeightReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "weightGrams" REAL NOT NULL,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightLossPct" REAL,
    "lossRatePctDay" REAL,
    "abnormal" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("sampleId") REFERENCES "ShelfLifeSample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FieldReject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "rejectType" TEXT NOT NULL,
    "inputMode" TEXT NOT NULL DEFAULT 'KG',
    "inputValue" REAL NOT NULL DEFAULT 0,
    "rejectKg" REAL NOT NULL DEFAULT 0,
    "rejectPct" REAL NOT NULL DEFAULT 0,
    "harvestId" INTEGER,
    FOREIGN KEY ("harvestId") REFERENCES "Harvest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FieldReject" ("date", "id", "rejectPct", "rejectType", "variety") SELECT "date", "id", "rejectPct", "rejectType", "variety" FROM "FieldReject";
DROP TABLE "FieldReject";
ALTER TABLE "new_FieldReject" RENAME TO "FieldReject";
CREATE TABLE "new_Harvest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "harvestedKg" REAL NOT NULL,
    "fieldRejectsKg" REAL NOT NULL DEFAULT 0,
    "fieldRejectPct" REAL NOT NULL DEFAULT 0,
    "blocks" TEXT,
    "supervisor" TEXT,
    "notes" TEXT,
    "weather" TEXT,
    "weatherTemp" REAL,
    "weatherLat" REAL,
    "weatherLon" REAL,
    "weatherSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Harvest" ("blocks", "createdAt", "date", "fieldRejectPct", "fieldRejectsKg", "harvestedKg", "id", "notes", "supervisor", "variety", "weather") SELECT "blocks", "createdAt", "date", "fieldRejectPct", "fieldRejectsKg", "harvestedKg", "id", "notes", "supervisor", "variety", "weather" FROM "Harvest";
DROP TABLE "Harvest";
ALTER TABLE "new_Harvest" RENAME TO "Harvest";
CREATE TABLE "new_PackhouseLoad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "processedKg" REAL NOT NULL,
    "notes" TEXT,
    "harvestId" INTEGER,
    FOREIGN KEY ("harvestId") REFERENCES "Harvest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PackhouseLoad" ("date", "id", "notes", "processedKg", "variety") SELECT "date", "id", "notes", "processedKg", "variety" FROM "PackhouseLoad";
DROP TABLE "PackhouseLoad";
ALTER TABLE "new_PackhouseLoad" RENAME TO "PackhouseLoad";
CREATE TABLE "new_PackhouseReject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "rejectType" TEXT NOT NULL,
    "inputMode" TEXT NOT NULL DEFAULT 'KG',
    "inputValue" REAL NOT NULL DEFAULT 0,
    "rejectKg" REAL NOT NULL DEFAULT 0,
    "rejectPct" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "packhouseLoadId" INTEGER,
    FOREIGN KEY ("packhouseLoadId") REFERENCES "PackhouseLoad" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PackhouseReject" ("date", "id", "notes", "rejectKg", "rejectPct", "rejectType", "variety") SELECT "date", "id", "notes", "rejectKg", "rejectPct", "rejectType", "variety" FROM "PackhouseReject";
DROP TABLE "PackhouseReject";
ALTER TABLE "new_PackhouseReject" RENAME TO "PackhouseReject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeSample_sampleId_key" ON "ShelfLifeSample"("sampleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeTempImpact_tempRange_key" ON "ShelfLifeTempImpact"("tempRange" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeVarietyProfile_variety_key" ON "ShelfLifeVarietyProfile"("variety" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeWeightCurve_variety_day_key" ON "ShelfLifeWeightCurve"("variety" ASC, "day" ASC);

