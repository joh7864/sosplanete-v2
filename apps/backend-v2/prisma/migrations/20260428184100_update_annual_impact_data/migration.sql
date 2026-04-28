-- AlterTable
ALTER TABLE "AnnualImpactData" DROP COLUMN "waterImpact",
DROP COLUMN "co2Impact",
DROP COLUMN "wasteImpact",
ADD COLUMN     "dActuel" INTEGER,
ADD COLUMN     "moyCo2Monde" DOUBLE PRECISION,
ADD COLUMN     "moyEauMonde" DOUBLE PRECISION,
ADD COLUMN     "moyDechetsMonde" DOUBLE PRECISION,
ADD COLUMN     "popMonde" DOUBLE PRECISION;
