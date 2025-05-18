-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "submissionDeadline" TIMESTAMP(3) NOT NULL,
    "resourceLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSubmission" (
    "id" TEXT NOT NULL,
    "submitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionLink" TEXT,
    "remarks" TEXT,
    "grade" DOUBLE PRECISION,
    "labId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "LabSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabSubmission_labId_studentId_key" ON "LabSubmission"("labId", "studentId");

-- AddForeignKey
ALTER TABLE "Lab" ADD CONSTRAINT "Lab_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("classCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lab" ADD CONSTRAINT "Lab_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSubmission" ADD CONSTRAINT "LabSubmission_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSubmission" ADD CONSTRAINT "LabSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
