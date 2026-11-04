-- AlterTable
ALTER TABLE "InstanceYear" ADD COLUMN IF NOT EXISTS "easterEggPauseCycles" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "evoe_easter_egg_instance" ADD COLUMN IF NOT EXISTS "forcedHintTeamIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
