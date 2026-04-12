-- AlterTable
ALTER TABLE "Instance" ADD COLUMN     "gamePeriodsCount" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "gameStartDate" TIMESTAMP(3);
