-- AlterTable
ALTER TABLE "TableAssignment" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "TableAssignment_guest_id_key" ON "TableAssignment"("guest_id");

