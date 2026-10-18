-- Konami : l'artefact offert devient configurable (specialReward = ARCADE_GAME:<clé>).
-- On conserve le comportement historique (Space Invaders) pour les bases existantes.
UPDATE "evoe_easter_egg"
SET "specialReward" = 'ARCADE_GAME:space-invaders'
WHERE "code" = 'EE_KONAMI_80S'
  AND ("specialReward" IS NULL OR "specialReward" = 'NONE');
