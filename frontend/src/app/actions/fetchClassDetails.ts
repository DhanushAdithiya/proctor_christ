"use server";

import { prisma } from "@/lib/prisma";
import { Subject } from "@/app/actions/createSubject";

interface SubjectResponse {
  success: boolean;
  response?: Subject;
}

export async function fetchClassDetails(
  classCode: number,
): Promise<SubjectResponse> {
  const response = await prisma.subject.findUnique({
    where: {
      classCode,
    },
  });

  if (!response) {
    return { success: false };
  }

  return { success: true, response };
}

export async function getAllEvaluatorClasses(
  regNo: string,
): Promise<Subject[]> {
  const res = await prisma.subject.findMany({
    where: {
      OR: [{ teacher: Number(regNo) }, { evaluators: { has: regNo } }],
    },
  });

  return res;
}

export async function getAllStudentClasses(regNo: string) { }
