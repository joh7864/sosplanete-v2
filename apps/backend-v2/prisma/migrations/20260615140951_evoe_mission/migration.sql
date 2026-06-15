-- CreateTable
CREATE TABLE "evoe_mission_translation" (
    "id" SERIAL NOT NULL,
    "localActionId" INTEGER NOT NULL,
    "titreSF" TEXT NOT NULL,
    "descriptionSF" TEXT NOT NULL,
    "pointsGagnes" INTEGER NOT NULL,
    "isHacked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "evoe_mission_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evoe_mission_translation_localActionId_key" ON "evoe_mission_translation"("localActionId");

-- AddForeignKey
ALTER TABLE "evoe_mission_translation" ADD CONSTRAINT "evoe_mission_translation_localActionId_fkey" FOREIGN KEY ("localActionId") REFERENCES "LocalAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
