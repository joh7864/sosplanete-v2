-- Création de la table CategoryRef (catégories globales AS)
CREATE TABLE "CategoryRef" (
  "id"    SERIAL PRIMARY KEY,
  "name"  TEXT NOT NULL,
  "icon"  TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CategoryRef_name_key" UNIQUE ("name")
);

-- Ajout du lien optionnel categoryRefId dans ActionRef
ALTER TABLE "ActionRef" ADD COLUMN "categoryRefId" INTEGER;
ALTER TABLE "ActionRef" ADD CONSTRAINT "ActionRef_categoryRefId_fkey"
  FOREIGN KEY ("categoryRefId") REFERENCES "CategoryRef"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
