/*
  Warnings:

  - You are about to drop the column `category` on the `ActionRef` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `LocalAction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ActionRef" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Instance" ADD COLUMN     "unlockedChapters" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LocalAction" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER;

-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "instanceId" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalAction" ADD CONSTRAINT "LocalAction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
