-- Migration SQL pour l'ajout des critères de tuning dans AnnualImpactData
-- Base de données : PostgreSQL

ALTER TABLE "AnnualImpactData" 
ADD COLUMN "assiduityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN "annualMultiplierWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN "difficultyFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
ADD COLUMN "worldProjectionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
