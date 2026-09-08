-- AlterTable
ALTER TABLE "InstanceYear" ADD COLUMN IF NOT EXISTS "metaEnigmaSecretWord" TEXT DEFAULT 'CHRONOS',
ADD COLUMN IF NOT EXISTS "metaEnigmaPeriodGlyphs" JSONB;

-- AlterTable
ALTER TABLE "GameConfig" ADD COLUMN IF NOT EXISTS "metaEnigmaSecretWord" TEXT DEFAULT 'CHRONOS',
ADD COLUMN IF NOT EXISTS "metaEnigmaPeriodGlyphs" JSONB;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "hasChronoEgg" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hasRosettaStone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isMetaEnigmaUnlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "evoe_easter_egg" ADD COLUMN IF NOT EXISTS "specialReward" TEXT DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionDone_childId_periodId_idx" ON "ActionDone"("childId", "periodId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionDone_localActionId_idx" ON "ActionDone"("localActionId");
