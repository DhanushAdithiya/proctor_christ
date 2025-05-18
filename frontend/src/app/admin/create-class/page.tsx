"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import BreadCrumbs from "@/app/components/breadcrumbs";
import { usePathname } from "next/navigation";
import createSubject, { Subject } from "@/app/actions/createSubject";
import { useRouter } from "next/navigation"; // or 'next/router' in older versions
import { checkEvaluator } from "@/app/actions/addEvaluators";

const CreateSubjectForm = () => {
	const router = useRouter();

	const [subjectName, setSubjectName] = useState("");
	const [subjectCode, setSubjectCode] = useState("");
	const [course, setCourse] = useState("");
	const [trimester, setTrimester] = useState("");
	const [section, setSection] = useState("");
	const [year, setYear] = useState("");
	const [evaluatorCode, setEvaluatorCode] = useState("");
	const [evaluatorNames, setEvaluatorNames] = useState<string[]>([]);
	const [evaluators, setEvaluators] = useState<string[]>([]);
	const [message, setMessage] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleAddEvaluator = async () => {
		if (evaluatorCode.trim()) {
			if (evaluatorCode.trim() == sessionStorage.getItem("regno")) {
				setMessage("You cannot add yourself as an evaluator.");
				return;
			}

			const res = await checkEvaluator(evaluatorCode.trim());

			if (res.success) {
				const evals = new Set(evaluators).add(evaluatorCode.trim());
				setEvaluators([...evals]);
				setEvaluatorCode("");
				setMessage(
					`${res.name} - ${evaluatorCode.trim()} was added as an evaluator.`,
				);
				setEvaluatorNames([...evaluatorNames, res.name]);
			} else {
				setMessage(res.error);
			}
		} else {
			setMessage("Please enter a teacher code.");
		}
	};

	const handleCreateSubject = () => {
		setIsDialogOpen(true); // Open the dialog
	};



	const handleConfirmCreateSubject = async () => {
		const subject: Subject = {
			name: subjectName,
			subjectCode,
			class: course,
			batch: Number(year),
			trimester: Number(trimester),
			evaluators,
			section,
			teacherId: sessionStorage.getItem("regno") || ""
		};

		const res = await createSubject(subject);
		if (res.success) {
			setIsDialogOpen(false);
			setMessage("Subject Created");
			const route = `/admin/class/${res.code}`;
			router.push(route); 
		} else {
			setMessage("Issue with server creation");
		}
	};

	return (
		<div className="p-12 h-screen bg-white flex-grow">
			<h2 className="h-[5%] text-4xl font-bold mb-6 text-gray-900">
				Create a New Subject
			</h2>

			{BreadCrumbs()}

			<div className="h-[80%] p-6 py-10 bg-gray-100 overflow-y-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
					{/* Left Column */}
					<div className="h-full flex flex-col justify-between">
						<div className="mb-4">
							<Label
								htmlFor="subjectName"
								className="block text-sm font-semibold text-gray-700"
							>
								Subject Name
							</Label>
							<Input
								id="subjectName"
								type="text"
								value={subjectName}
								onChange={(e) => setSubjectName(e.target.value)}
								className="mt-1 border-black"
								placeholder="Enter subject name"
							/>
						</div>
						<div className="mb-4">
							<Label
								htmlFor="subjectCode"
								className="block text-sm font-semibold text-gray-700"
							>
								Subject Code
							</Label>
							<Input
								id="subjectCode"
								type="text"
								value={subjectCode}
								onChange={(e) => setSubjectCode(e.target.value)}
								className="mt-1 border-black"
								placeholder="Enter subject code"
							/>
						</div>
						<div className="mb-4 grid grid-cols-3 gap-4">
							<div>
								<Label
									htmlFor="course"
									className="block text-sm font-semibold text-gray-700"
								>
									Course
								</Label>
								<Input
									id="course"
									type="text"
									value={course}
									onChange={(e) => setCourse(e.target.value)}
									className="mt-1 border-black"
									placeholder="e.g., BSCS"
								/>
							</div>
							<div>
								<Label
									htmlFor="trimester"
									className="block text-sm font-semibold text-gray-700"
								>
									Trimester
								</Label>
								<Input
									id="trimester"
									type="text"
									value={trimester}
									onChange={(e) => setTrimester(e.target.value)}
									className="mt-1 border-black"
									placeholder="e.g., 1st"
								/>
							</div>
							<div>
								<Label
									htmlFor="section"
									className="block text-sm font-semibold text-gray-700"
								>
									Section
								</Label>
								<Input
									id="section"
									type="text"
									value={section}
									onChange={(e) => setSection(e.target.value)}
									className="mt-1 border-black"
									placeholder="e.g., A"
								/>
							</div>
						</div>
						<div className="mb-4">
							<Label
								htmlFor="year"
								className="block text-sm font-semibold text-gray-700"
							>
								Year
							</Label>
							<Input
								id="year"
								type="text"
								value={year}
								onChange={(e) => setYear(e.target.value)}
								className="mt-1 border-black"
								placeholder="e.g., 2024"
							/>
						</div>
					</div>

					{/* Right Column */}
					<div className="flex flex-col justify-start">
						<div className="mb-4">
							<Label className="block text-sm font-semibold text-gray-700">
								Add Evaluators
							</Label>
							<div className="flex items-end gap-2">
								<Input
									type="text"
									value={evaluatorCode}
									onChange={(e) => setEvaluatorCode(e.target.value)}
									placeholder="Enter teacher code"
									className="border-black flex-1"
								/>
								<Button
									variant="outline"
									onClick={handleAddEvaluator}
									className="bg-black text-white hover:bg-gray-800"
								>
									Add
								</Button>
							</div>
							{message && (
								<p
									className={cn(
										"mt-2 text-sm",
										message.includes("added")
											? "text-green-500"
											: "text-red-500",
									)}
								>
									{message}
								</p>
							)}
							{evaluators.length > 0 && (
								<div className="mt-2">
									<p className="text-sm font-semibold text-gray-700">
										Evaluators:
									</p>
									<ul className="list-disc list-inside">
										{evaluators.map((evaluator, index) => (
											<li key={index} className="text-sm text-gray-600">
												{evaluator} - {evaluatorNames[index]}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</div>

					<Button
						onClick={handleCreateSubject}
						className="w-full bg-black hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					>
						Create a Subject
					</Button>
				</div>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Subject Creation</DialogTitle>
						<DialogDescription>
							Are you sure you want to create this subject?
							<div className="mt-4">
								<p>
									<span className="font-semibold">Subject Name:</span>{" "}
									{subjectName}
								</p>
								<p>
									<span className="font-semibold">Subject Code:</span>{" "}
									{subjectCode}
								</p>
								<p>
									<span className="font-semibold">Course:</span> {course}
								</p>
								<p>
									<span className="font-semibold">Trimester:</span> {trimester}
								</p>
								<p>
									<span className="font-semibold">Section:</span> {section}
								</p>
								<p>
									<span className="font-semibold">Year:</span> {year}
								</p>
								<p>
									<span className="font-semibold">Evaluators:</span>{" "}
									{evaluators.join(", ") || "None"}
								</p>
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" onClick={handleConfirmCreateSubject}>
							Create Subject
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default CreateSubjectForm;
