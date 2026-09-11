-- AlterTable
ALTER TABLE "Child" ADD COLUMN "birthdayCelebratedYear" INTEGER;
ALTER TABLE "Child" ADD COLUMN "birthdayCelebratedDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "evoe_birthday_wish" (
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

-- CreateIndex
CREATE INDEX "evoe_birthday_wish_recipientId_year_idx" ON "evoe_birthday_wish"("recipientId", "year");

-- CreateIndex
CREATE INDEX "evoe_birthday_wish_createdAt_idx" ON "evoe_birthday_wish"("createdAt");

-- AddForeignKey
ALTER TABLE "evoe_birthday_wish" ADD CONSTRAINT "evoe_birthday_wish_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoe_birthday_wish" ADD CONSTRAINT "evoe_birthday_wish_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;
