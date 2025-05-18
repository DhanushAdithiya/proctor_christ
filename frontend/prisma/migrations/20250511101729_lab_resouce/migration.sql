/*
  Warnings:

  - The `resourceLink` column on the `Lab` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Lab" DROP COLUMN "resourceLink",
ADD COLUMN     "resourceLink" TEXT[];
