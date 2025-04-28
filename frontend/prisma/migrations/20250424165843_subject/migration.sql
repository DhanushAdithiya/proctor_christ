-- CreateTable
CREATE TABLE "Subject" (
    "classCode" INTEGER NOT NULL,
    "subjectCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "batch" INTEGER NOT NULL,
    "evaluators" TEXT[],
    "students" TEXT[],

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("classCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_classCode_key" ON "Subject"("classCode");
