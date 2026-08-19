-- CreateTable
CREATE TABLE "Variety" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RejectType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'packhouse',
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "WeatherOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Harvest" (
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
    CONSTRAINT "Harvest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldReject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "rejectType" TEXT NOT NULL,
    "inputMode" TEXT NOT NULL DEFAULT 'KG',
    "inputValue" REAL NOT NULL DEFAULT 0,
    "rejectKg" REAL NOT NULL DEFAULT 0,
    "rejectPct" REAL NOT NULL DEFAULT 0,
    "harvestId" INTEGER,
    CONSTRAINT "FieldReject_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackhouseLoad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "processedKg" REAL NOT NULL,
    "notes" TEXT,
    "harvestId" INTEGER,
    CONSTRAINT "PackhouseLoad_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackhouseReject" (
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
    CONSTRAINT "PackhouseReject_packhouseLoadId_fkey" FOREIGN KEY ("packhouseLoadId") REFERENCES "PackhouseLoad" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Block" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "harvestedKg" REAL NOT NULL,
    "fieldRejectsKg" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    CONSTRAINT "ShelfLifeObservation_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "ShelfLifeSample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "ShelfLifeWeightReading_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "ShelfLifeSample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE "ShelfLifeTempImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tempRange" TEXT NOT NULL,
    "avgShelfLife" REAL,
    "failureRate" REAL,
    "sampleCount" INTEGER
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
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "changes" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Variety_name_key" ON "Variety"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RejectType_name_key" ON "RejectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherOption_name_key" ON "WeatherOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeSample_sampleId_key" ON "ShelfLifeSample"("sampleId");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeVarietyProfile_variety_key" ON "ShelfLifeVarietyProfile"("variety");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeTempImpact_tempRange_key" ON "ShelfLifeTempImpact"("tempRange");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeWeightCurve_variety_day_key" ON "ShelfLifeWeightCurve"("variety", "day");

