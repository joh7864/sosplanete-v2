-- DropForeignKey
ALTER TABLE "ActionDone" DROP CONSTRAINT "ActionDone_childId_fkey";

-- AddForeignKey
ALTER TABLE "ActionDone" ADD CONSTRAINT "ActionDone_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
