"use server";

import { prisma } from "@/lib/prisma";

export interface Subject {
	classCode?: number;
	name: string;
	subjectCode: string;
	batch: number;
	evaluators: string[];
	class: string;
	section: string;
	trimester: number;
	teacher: number;
}

export default async function createSubject(subject: Subject) {
	let classCode: number = Math.floor(Math.random() * 100000);

	const response = await prisma.subject.create({
		data: {
			classCode,
			name: subject.name,
			subjectCode: subject.subjectCode,
			class: subject.class,
			batch: subject.batch,
			evaluators: subject.evaluators,
			students: [],
			section: subject.section,
			trimester: subject.trimester,
			teacher: subject.teacher
		},
	});

	if (response ){
		return {success: true, code: classCode}
	} else {
		return {success: false}
	}

}
