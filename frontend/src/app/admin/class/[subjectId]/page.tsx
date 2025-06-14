"use client";

import { useEffect, useState } from "react"; // Import useState
import BreadCrumbs from "@/app/components/breadcrumbs";
import { useParams, notFound } from "next/navigation";
import {fetchClassDetails, SubjectResponse} from "@/app/actions/fetchClassDetails";
import { Subject } from "@/app/actions/createSubject";
import PendingAssignments, { Assignment } from "@/app/components/pendingAssignments";
import SubjectHeader from "@/app/components/subjectHeader";
import AllAssignments from "@/app/components/allAssignments";
import { getAllAssignments, getPendingLabsForTeachersInClass } from "@/app/actions/fetchAssignments";

export default function SubjectPage() {
	const [classDetails, setClassDetails] = useState<SubjectResponse>();
	const [assignments, setAssignmetns] = useState<Assignment[]>([]);
	const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
	const slug = useParams();
	const classId = slug.subjectId;

	useEffect(() => {
		getPendingLabsForTeachersInClass(Number(classId)).then((data) => setPendingAssignments(data));
		getAllAssignments(Number(classId)).then((data) => setAssignmetns(data));
		fetchClassDetails(Number(classId)).then((data) => setClassDetails(data));
	}, [classId]);

	console.log(assignments);
	if (!classDetails) {
		return <h1>Loading...</h1>;
	}

	if (!classDetails.success) {
		notFound();
	}

	const {
		name,
		subjectCode,
		batch,
		evaluators,
		class: className,
		section,
		trimester,
		teacherId,
		classCode,
	} = classDetails.response as Subject;

	const subject: Subject = {
		classCode,
		name,
		subjectCode,
		batch,
		evaluators,
		class: className, 
		section,
		trimester,
		teacherId,
	};


	return (
		<div className="min-h-screen bg-white p-12 flex flex-col gap-8">
			<div className="mb-2">{BreadCrumbs()}</div>
			<SubjectHeader subject={subject} />
			<div className="flex flex-col gap-8 w-full">
				<PendingAssignments assignments={pendingAssignments} admin={true} />
				<AllAssignments assignments={assignments} admin={true} />
			</div>
		</div>
	);
}
