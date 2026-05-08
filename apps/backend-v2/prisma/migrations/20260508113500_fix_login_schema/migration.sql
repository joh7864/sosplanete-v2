-- AlterTable (Instance)
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "currentSchoolYear" TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- AlterTable (Category)
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;

-- AlterTable (Team)
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;

-- AlterTable (Period)
ALTER TABLE "Period" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;

-- AlterTable (LocalAction)
ALTER TABLE "LocalAction" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;

-- AlterTable (GameConfig)
ALTER TABLE "GameConfig" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Drop and Recreate unique indexes to include schoolYear
-- InstanceAnimalUnlock
DROP INDEX IF EXISTS "InstanceAnimalUnlock_instanceId_period_key";
CREATE UNIQUE INDEX IF NOT EXISTS "InstanceAnimalUnlock_instanceId_period_schoolYear_key" ON "InstanceAnimalUnlock"("instanceId", "period", "schoolYear");

-- EcoBarRaceSnapshot
CREATE UNIQUE INDEX IF NOT EXISTS "EcoBarRaceSnapshot_period_schoolYear_key" ON "EcoBarRaceSnapshot"("period", "schoolYear");

-- LocalAction
DROP INDEX IF EXISTS "LocalAction_instanceId_actionRefId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "LocalAction_instanceId_actionRefId_schoolYear_key" ON "LocalAction"("instanceId", "actionRefId", "schoolYear");
