-- ==============================================================================
-- Migration SQL Production : Système d'Anniversaire & Messages de Souhaits
-- Application : SOS Planète / Évoé
-- SGBD : PostgreSQL
-- ==============================================================================

-- 1. Ajout des colonnes de suivi de célébration d'anniversaire sur Child
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "birthdayCelebratedYear" INTEGER;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "birthdayCelebratedDate" TIMESTAMP(3);

-- 2. Création de la table des souhaits d'anniversaire entre coéquipiers
CREATE TABLE IF NOT EXISTS "evoe_birthday_wish" (
    "id" SERIAL NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "senderPseudo" TEXT NOT NULL,
    "senderAvatar" TEXT,
    "senderTeamColor" TEXT,
    "message" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoe_birthday_wish_pkey" PRIMARY KEY ("id")
);

-- Index pour les performances de lecture et purge
CREATE INDEX IF NOT EXISTS "evoe_birthday_wish_recipientId_year_idx" ON "evoe_birthday_wish"("recipientId", "year");
CREATE INDEX IF NOT EXISTS "evoe_birthday_wish_createdAt_idx" ON "evoe_birthday_wish"("createdAt");

-- Contraintes de clés étrangères sécurisées (idempotentes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'evoe_birthday_wish_recipientId_fkey'
    ) THEN
        ALTER TABLE "evoe_birthday_wish" 
        ADD CONSTRAINT "evoe_birthday_wish_recipientId_fkey" 
        FOREIGN KEY ("recipientId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'evoe_birthday_wish_periodId_fkey'
    ) THEN
        ALTER TABLE "evoe_birthday_wish" 
        ADD CONSTRAINT "evoe_birthday_wish_periodId_fkey" 
        FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Décalage de +1 jour pour corriger les dates d'anniversaire existantes
-- NOTE : Ce décalage corrige le bug historique où chaque sauvegarde retirait 1 jour par décalage de fuseau horaire UTC/local.
-- Si vous préférez exécuter le script Node/TypeScript vérifié (qui logue chaque agent modifié), lancez :
--    npm run migrate:birthdates
-- Ou exécutez directement cette requête SQL sur la base de production :
UPDATE "Child" 
SET "birthDate" = (date_trunc('day', "birthDate") + INTERVAL '1 day 12 hours')
WHERE "birthDate" IS NOT NULL;
