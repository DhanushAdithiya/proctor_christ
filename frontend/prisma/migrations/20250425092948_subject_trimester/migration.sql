/*
  Warnings:

  - Added the required column `trimester` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "trimester" INTEGER NOT NULL;
