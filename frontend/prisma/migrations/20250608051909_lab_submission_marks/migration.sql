/*
  Warnings:

  - You are about to drop the column `grade` on the `LabSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LabSubmission" DROP COLUMN "grade",
ADD COLUMN     "conceptClarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "plagarism" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "timelySubission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "viva" DOUBLE PRECISION NOT NULL DEFAULT 0;
