"use client"

import {useParams} from "next/navigation"

export default function LabPage() {
	const params = useParams();
	const labSlug = params.labId;
	const subjectSlug = params.subjectId;
  return <h1>LAB {labSlug}</h1>;
}
