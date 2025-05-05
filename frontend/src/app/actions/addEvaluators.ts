"use server";

import { prisma } from "@/lib/prisma";

export interface User {
  name: string;
  registerNumber: string;
  password: string;
  role: string;
}

export async function getUser(registerNumber: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      registerNumber,
    },
  });

  return user;
}

export async function checkEvaluator(
  registerNumber: string
): Promise<{ error: string } | { success: boolean; name: string }> {
  try {
    const teacher = await getUser(registerNumber);

    if (!teacher) {
      return { error: "Evaluator not found" };
    }

    if (teacher.role != "TEACHER") {
      return { error: "User is not a teacher" };
    }

    return {
      success: true,
      name: teacher.name,
    };
  } catch (error) {
    console.error("An error occurred while checking evaluator", error);
    return {
      error: "Server error",
    };
  }
}

export async function addEvaluator(
  registerNumber: string,
  classCode: number
) {
  try {
    // check if teacher is already an evaluator
    const evaluator = await prisma.evaluatorSubject.findFirst({
      where: {
        evaluator: { registerNumber },
        subject: { classCode },
      },
    });

    if (evaluator) {
      return {
        success: false,
        error: "Teacher is already an evaluator",
      };
    }

    const res = await prisma.evaluatorSubject.create({
      data: {
        subject: { connect: { classCode } },
        evaluator: { connect: { registerNumber } },
      },
      include: {
        evaluator: {
          select: {
            name: true,
            registerNumber: true,
            role: true,
          },
        },
        subject: {
          select: {
            name: true,
            subjectCode: true,
            class: true,
            batch: true,
            section: true,
            trimester: true,
            teacher: {
              select: {
                name: true,
                registerNumber: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (res) {
      return {
        success: true,
        message: "Teacher added as evaluator",
      };
    }
  } catch (error) {
    console.error("error", error);
    return {
      success: false,
      error: "Failed to add evaluator",
    };
  }
}
