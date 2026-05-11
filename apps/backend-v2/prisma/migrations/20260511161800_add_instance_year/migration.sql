-- ============================================================
-- Migration : add_instance_year
-- Stratégie : backfill — on crée un InstanceYear pour chaque
--   (instanceId, schoolYear) existant, puis on relie les
--   entités orphelines avant de supprimer les anciens champs.
-- ============================================================

-- 1. Créer la table InstanceYear
CREATE TABLE "InstanceYear" (
    "id"               SERIAL NOT NULL,
    "instanceId"       INTEGER NOT NULL,
    "schoolYear"       TEXT NOT NULL,
    "isOpen"           BOOLEAN NOT NULL DEFAULT false,
    "gameStartDate"    TIMESTAMP(3),
    "gameEndDate"      TIMESTAMP(3),
    "gamePeriodsCount" INTEGER NOT NULL DEFAULT 24,
    "unlockedChapters" INTEGER NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstanceYear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstanceYear_instanceId_schoolYear_key"
    ON "InstanceYear"("instanceId", "schoolYear");

ALTER TABLE "InstanceYear"
    ADD CONSTRAINT "InstanceYear_instanceId_fkey"
    FOREIGN KEY ("instanceId") REFERENCES "Instance"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Backfill : insérer un InstanceYear pour chaque couple
--    (instanceId, schoolYear) distinct tiré de Period.
--    On récupère aussi les méta-jeu depuis Instance pour l'année 2024-2025.
INSERT INTO "InstanceYear" ("instanceId", "schoolYear", "isOpen", "gameStartDate", "gameEndDate", "gamePeriodsCount", "unlockedChapters")
SELECT DISTINCT
    p."instanceId",
    COALESCE(p."schoolYear", i."currentSchoolYear", '2024-2025') AS "schoolYear",
    i."isOpen",
    i."gameStartDate",
    i."gameEndDate",
    i."gamePeriodsCount",
    i."unlockedChapters"
FROM "Period" p
JOIN "Instance" i ON i."id" = p."instanceId"
ON CONFLICT ("instanceId", "schoolYear") DO NOTHING;

-- Sécurité : si une Instance n'avait aucune Period, on crée quand même une InstanceYear
INSERT INTO "InstanceYear" ("instanceId", "schoolYear", "isOpen", "gameStartDate", "gameEndDate", "gamePeriodsCount", "unlockedChapters")
SELECT
    i."id",
    COALESCE(i."currentSchoolYear", '2024-2025'),
    i."isOpen",
    i."gameStartDate",
    i."gameEndDate",
    i."gamePeriodsCount",
    i."unlockedChapters"
FROM "Instance" i
WHERE NOT EXISTS (
    SELECT 1 FROM "InstanceYear" iy WHERE iy."instanceId" = i."id"
)
ON CONFLICT ("instanceId", "schoolYear") DO NOTHING;

-- 3. Ajouter instanceYearId (nullable d'abord pour le backfill)
ALTER TABLE "Period"   ADD COLUMN "instanceYearId" INTEGER;
ALTER TABLE "Team"     ADD COLUMN "instanceYearId" INTEGER;
ALTER TABLE "Category" ADD COLUMN "instanceYearId" INTEGER;

-- 4. Backfill Period → instanceYearId
UPDATE "Period" p
SET "instanceYearId" = iy."id"
FROM "InstanceYear" iy
WHERE iy."instanceId" = p."instanceId"
  AND iy."schoolYear" = COALESCE(p."schoolYear", '2024-2025');

-- 5. Backfill Team → instanceYearId
--    Les teams n'ont qu'un instanceId; on les attribue à l'InstanceYear
--    dont le schoolYear correspond, ou à la première disponible.
UPDATE "Team" t
SET "instanceYearId" = (
    SELECT iy."id"
    FROM "InstanceYear" iy
    WHERE iy."instanceId" = t."instanceId"
      AND iy."schoolYear" = COALESCE(t."schoolYear", '2024-2025')
    LIMIT 1
);

-- Fallback : teams sans schoolYear exact → première InstanceYear de l'instance
UPDATE "Team" t
SET "instanceYearId" = (
    SELECT iy."id"
    FROM "InstanceYear" iy
    WHERE iy."instanceId" = t."instanceId"
    ORDER BY iy."schoolYear" DESC
    LIMIT 1
)
WHERE t."instanceYearId" IS NULL;

-- 6. Backfill Category → instanceYearId
UPDATE "Category" c
SET "instanceYearId" = (
    SELECT iy."id"
    FROM "InstanceYear" iy
    WHERE iy."instanceId" = c."instanceId"
      AND iy."schoolYear" = COALESCE(c."schoolYear", '2024-2025')
    LIMIT 1
);

UPDATE "Category" c
SET "instanceYearId" = (
    SELECT iy."id"
    FROM "InstanceYear" iy
    WHERE iy."instanceId" = c."instanceId"
    ORDER BY iy."schoolYear" DESC
    LIMIT 1
)
WHERE c."instanceYearId" IS NULL;

-- 7. Passer les colonnes en NOT NULL
ALTER TABLE "Period"   ALTER COLUMN "instanceYearId" SET NOT NULL;
ALTER TABLE "Team"     ALTER COLUMN "instanceYearId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "instanceYearId" SET NOT NULL;

-- 8. Ajouter les contraintes FK
ALTER TABLE "Period"
    ADD CONSTRAINT "Period_instanceYearId_fkey"
    FOREIGN KEY ("instanceYearId") REFERENCES "InstanceYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Team"
    ADD CONSTRAINT "Team_instanceYearId_fkey"
    FOREIGN KEY ("instanceYearId") REFERENCES "InstanceYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category"
    ADD CONSTRAINT "Category_instanceYearId_fkey"
    FOREIGN KEY ("instanceYearId") REFERENCES "InstanceYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Supprimer les anciennes colonnes de Period, Team, Category
ALTER TABLE "Period"   DROP COLUMN "instanceId";
ALTER TABLE "Period"   DROP COLUMN "schoolYear";
ALTER TABLE "Team"     DROP COLUMN "instanceId";
ALTER TABLE "Team"     DROP COLUMN "schoolYear";
ALTER TABLE "Category" DROP COLUMN "instanceId";
ALTER TABLE "Category" DROP COLUMN "schoolYear";

-- 10. Supprimer les colonnes devenues obsolètes d'Instance
ALTER TABLE "Instance" DROP COLUMN "isOpen";
ALTER TABLE "Instance" DROP COLUMN "gameStartDate";
ALTER TABLE "Instance" DROP COLUMN "gameEndDate";
ALTER TABLE "Instance" DROP COLUMN "gamePeriodsCount";
ALTER TABLE "Instance" DROP COLUMN "currentSchoolYear";
ALTER TABLE "Instance" DROP COLUMN "unlockedChapters";
