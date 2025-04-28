"use server"

import { prisma } from "@/lib/prisma"

export async function addEvaluator(registerNumber: string) {
	const teacher = await prisma.user.findUnique({
		where: {
			registerNumber
		}
	})

	if (!teacher) {
		return {error: "Evaluator not found"};
	}

	if (!teacher.teacher) {
		return {error: "User is not a teacher"};
	}

	return {
		success: true,
		name: teacher.name,
	}
}
