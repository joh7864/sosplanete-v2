-- AlterTable
ALTER TABLE "ActionRef" ADD COLUMN IF NOT EXISTS "imageEvoe" TEXT;

-- AlterTable
ALTER TABLE "LocalAction" ADD COLUMN IF NOT EXISTS "imageEvoe" TEXT;

-- AlterTable
ALTER TABLE "evoe_mission_translation" ADD COLUMN IF NOT EXISTS "imageOverride" TEXT;
