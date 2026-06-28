/*
  Warnings:

  - You are about to drop the column `assignedProjectId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_assignedProjectId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "assignedProjectId";

-- CreateTable
CREATE TABLE "_ProjectAssignments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectAssignments_AB_unique" ON "_ProjectAssignments"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectAssignments_B_index" ON "_ProjectAssignments"("B");

-- AddForeignKey
ALTER TABLE "_ProjectAssignments" ADD CONSTRAINT "_ProjectAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectAssignments" ADD CONSTRAINT "_ProjectAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
