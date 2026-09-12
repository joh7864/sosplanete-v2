-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "unbridleDpr" BOOLEAN NOT NULL DEFAULT false;
