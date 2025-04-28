/*
  Warnings:

  - You are about to drop the column `admin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `register` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registerNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registerNumber` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_register_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "admin",
DROP COLUMN "register",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "registerNumber" TEXT NOT NULL,
ADD COLUMN     "teacher" BOOLEAN NOT NULL,
ALTER COLUMN "password" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("registerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_registerNumber_key" ON "User"("registerNumber");
