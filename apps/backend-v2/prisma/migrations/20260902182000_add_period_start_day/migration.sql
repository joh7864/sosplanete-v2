-- AlterTable
ALTER TABLE "InstanceYear" ADD COLUMN "periodStartDay" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "GameConfig" ADD COLUMN "periodStartDay" INTEGER NOT NULL DEFAULT 3;
