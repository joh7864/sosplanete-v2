-- 1. Ajout des colonnes manquantes
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "currentSchoolYear" TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "icon" TEXT;

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;
ALTER TABLE "Period" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;
ALTER TABLE "LocalAction" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;
ALTER TABLE "GameConfig" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Colonnes de stimulation manquantes
ALTER TABLE "InstanceAnimalUnlock" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE "EcoBarRaceSnapshot" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE "TerreThermometerSnapshot" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT NOT NULL DEFAULT '2024-2025';

-- 2. Nettoyage et recréation des index uniques (pour inclure schoolYear)
DROP INDEX IF EXISTS "InstanceAnimalUnlock_instanceId_period_key";
CREATE UNIQUE INDEX IF NOT EXISTS "InstanceAnimalUnlock_instanceId_period_schoolYear_key" ON "InstanceAnimalUnlock"("instanceId", "period", "schoolYear");

DROP INDEX IF EXISTS "EcoBarRaceSnapshot_period_key";
CREATE UNIQUE INDEX IF NOT EXISTS "EcoBarRaceSnapshot_period_schoolYear_key" ON "EcoBarRaceSnapshot"("period", "schoolYear");

DROP INDEX IF EXISTS "LocalAction_instanceId_actionRefId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "LocalAction_instanceId_actionRefId_schoolYear_key" ON "LocalAction"("instanceId", "actionRefId", "schoolYear");

DROP INDEX IF EXISTS "SystemConfig_schoolYear_key";
CREATE UNIQUE INDEX IF NOT EXISTS "SystemConfig_schoolYear_key" ON "SystemConfig"("schoolYear");

DROP INDEX IF EXISTS "TerreThermometerSnapshot_instanceId_period_key";
CREATE UNIQUE INDEX IF NOT EXISTS "TerreThermometerSnapshot_instanceId_period_schoolYear_key" ON "TerreThermometerSnapshot"("instanceId", "period", "schoolYear");

DROP INDEX IF EXISTS "GameConfig_instanceId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "GameConfig_instanceId_schoolYear_key" ON "GameConfig"("instanceId", "schoolYear");
