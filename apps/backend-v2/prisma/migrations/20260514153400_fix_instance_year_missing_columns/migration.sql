-- ============================================================
-- Migration : fix_instance_year_missing_columns
-- Description : Ajoute les colonnes manquantes (hostUrl, icon, adminId)
--               à la table InstanceYear et les backfill depuis Instance.
-- ============================================================

-- 1. Ajouter les colonnes à InstanceYear
ALTER TABLE "InstanceYear" ADD COLUMN "hostUrl" TEXT;
ALTER TABLE "InstanceYear" ADD COLUMN "icon" TEXT;
ALTER TABLE "InstanceYear" ADD COLUMN "adminId" INTEGER;

-- 2. Backfill des données depuis Instance vers InstanceYear
-- On associe les données de l'ancre (Instance) à ses déclinaisons annuelles (InstanceYear).
-- Pour hostUrl et icon, on les propage partout.
-- Pour adminId, on ne l'écrase que si InstanceYear n'en a pas déjà un (sécurité).
UPDATE "InstanceYear" iy
SET 
    "hostUrl" = i."hostUrl",
    "icon" = i."icon",
    "adminId" = COALESCE(iy."adminId", i."adminId")
FROM "Instance" i
WHERE iy."instanceId" = i."id";

-- 3. Créer l'index unique (hostUrl, schoolYear) comme spécifié dans le schema
CREATE UNIQUE INDEX "InstanceYear_hostUrl_schoolYear_key" ON "InstanceYear"("hostUrl", "schoolYear");

-- 4. Ajouter la contrainte FK pour adminId
ALTER TABLE "InstanceYear" ADD CONSTRAINT "InstanceYear_adminId_fkey" 
    FOREIGN KEY ("adminId") REFERENCES "User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Nettoyage de la table Instance (suppression des colonnes obsolètes)
-- On ne le fait que maintenant pour être sûr d'avoir pu backfiller.
-- Note : on ne supprime PAS adminId de Instance car il est toujours dans le schema.prisma.

-- On doit d'abord supprimer l'index unique sur hostUrl dans Instance s'il existe
DROP INDEX IF EXISTS "Instance_hostUrl_key";

ALTER TABLE "Instance" DROP COLUMN "hostUrl";
ALTER TABLE "Instance" DROP COLUMN "icon";
