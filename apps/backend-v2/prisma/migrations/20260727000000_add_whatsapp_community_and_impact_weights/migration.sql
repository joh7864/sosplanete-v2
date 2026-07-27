-- AlterTable: ajout des colonnes communauté WhatsApp et colonnes de pondération AnnualImpactData
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "whatsappCommunityName" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "whatsappCommunityUrl" TEXT;

-- AlterTable: ajout des colonnes de pondération AnnualImpactData
ALTER TABLE "AnnualImpactData" ADD COLUMN IF NOT EXISTS "annualMultiplierWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
ALTER TABLE "AnnualImpactData" ADD COLUMN IF NOT EXISTS "assiduityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "AnnualImpactData" ADD COLUMN IF NOT EXISTS "difficultyFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
ALTER TABLE "AnnualImpactData" ADD COLUMN IF NOT EXISTS "worldProjectionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
