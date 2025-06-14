/*
  Warnings:

  - Added the required column `vivaQuestions` to the `Lab` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lab" ADD COLUMN     "vivaQuestions" TEXT NOT NULL;
