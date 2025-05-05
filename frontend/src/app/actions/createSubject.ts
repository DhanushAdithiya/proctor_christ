"use server";

import { prisma } from "@/lib/prisma";
import { addEvaluator } from "./addEvaluators";

export interface Subject {
	classCode?: number;
	name: string;
	subjectCode: string;
	batch: number;
	evaluators?: string[];
	class: string;
	section: string;
	trimester: number;
	teacherId: string;
}

export default async function createSubject(subject: Subject) {
	let classCode: number = Math.floor(Math.random() * 100000);

	const response = await prisma.subject.create({
		data: {
			classCode,
			name: subject.name,
			batch: subject.batch,
			section: subject.section,
			trimester: subject.trimester,
			subjectCode: subject.subjectCode,
			class: subject.class,
			teacherId: subject.teacherId,
		}
	})

	if (response && subject.evaluators){
		subject.evaluators.forEach(async (evaluator) => {
			try {
				await addEvaluator(evaluator, classCode)
			} catch (error) {
				console.error("An error occurred while adding evaluator", error)
			}
		})

		return {success: true, code: classCode}
	} else {
		return {success: false}
	}

}
