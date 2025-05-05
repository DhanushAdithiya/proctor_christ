/*
  Warnings:

  - You are about to drop the column `evaluators` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `students` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `teacher` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `teacher` on the `User` table. All the data in the column will be lost.
  - Added the required column `teacherId` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER');

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "evaluators",
DROP COLUMN "students",
DROP COLUMN "teacher",
ADD COLUMN     "teacherId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "teacher",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "StudentSubject" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluatorSubject" (
    "id" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluatorSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubject_studentId_subjectId_key" ON "StudentSubject"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluatorSubject_evaluatorId_subjectId_key" ON "EvaluatorSubject"("evaluatorId", "subjectId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("classCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorSubject" ADD CONSTRAINT "EvaluatorSubject_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorSubject" ADD CONSTRAINT "EvaluatorSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("classCode") ON DELETE RESTRICT ON UPDATE CASCADE;
