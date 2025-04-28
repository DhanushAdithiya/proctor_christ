"use server";
import { prisma } from "@/lib/prisma";

export async function fetchClassDetails(classCode: number) {
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

export async function getAllClasses(regNo: string) {
  const res = await prisma.subject.findMany({
    where: {
      OR: [{ teacher: Number(regNo) }, { evaluators: { has: regNo } }],
    },
  });

	return res;
}
