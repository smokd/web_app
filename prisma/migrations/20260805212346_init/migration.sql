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
    "fieldRejectsKg" REAL NOT NULL,
    "fieldRejectPct" REAL NOT NULL,
    "blocks" TEXT,
    "notes" TEXT,
    "supervisor" TEXT,
    "weather" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PackhouseLoad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "processedKg" REAL NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "PackhouseReject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "rejectType" TEXT NOT NULL,
    "rejectKg" REAL NOT NULL,
    "rejectPct" REAL NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "FieldReject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "rejectType" TEXT NOT NULL,
    "rejectPct" REAL NOT NULL
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

-- CreateIndex
CREATE UNIQUE INDEX "Variety_name_key" ON "Variety"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RejectType_name_key" ON "RejectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherOption_name_key" ON "WeatherOption"("name");
