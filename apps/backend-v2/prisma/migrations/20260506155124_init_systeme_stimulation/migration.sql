-- AlterTable
ALTER TABLE "ActionDone" ADD COLUMN     "savedEnergy" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ActionRef" ADD COLUMN     "defaultEnergy" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "LocalAction" ADD COLUMN     "specificEnergy" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "avgActionsPerChildPerPeriod" INTEGER NOT NULL DEFAULT 8,
    "animalAdvanceMargin" INTEGER NOT NULL DEFAULT 2,
    "bienveillanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.40,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "emissionsParHabitantAn" DOUBLE PRECISION NOT NULL DEFAULT 11.0,
    "temperatureMalade" DOUBLE PRECISION NOT NULL DEFAULT 42.0,
    "temperatureSaine" DOUBLE PRECISION NOT NULL DEFAULT 37.0,
    "populationReference" INTEGER NOT NULL DEFAULT 68000000,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstanceAnimalUnlock" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "animalsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstanceAnimalUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoBarRaceSnapshot" (
    "id" SERIAL NOT NULL,
    "period" INTEGER NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "rankings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcoBarRaceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerreThermometerSnapshot" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "temperatureValue" DOUBLE PRECISION NOT NULL,
    "totalCo2Saved" DOUBLE PRECISION NOT NULL,
    "nbChildrenPlaying" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerreThermometerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_instanceId_key" ON "GameConfig"("instanceId");

-- AddForeignKey
ALTER TABLE "GameConfig" ADD CONSTRAINT "GameConfig_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstanceAnimalUnlock" ADD CONSTRAINT "InstanceAnimalUnlock_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerreThermometerSnapshot" ADD CONSTRAINT "TerreThermometerSnapshot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
