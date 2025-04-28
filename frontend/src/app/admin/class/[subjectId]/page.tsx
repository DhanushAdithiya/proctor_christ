"use client";

import { useEffect, useState } from "react"; // Import useState
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button
import { Copy, Check, Clock } from "lucide-react"; // Import icons
import { useToast } from "@/hooks/use-toast";
import breadCrumbs from "@/app/components/breadcrumbs";
import { usePathname, useParams, notFound } from "next/navigation";
import {fetchClassDetails} from "@/app/actions/fetchClassDetails";
import { Subject } from "@/app/actions/createSubject";

// Define interfaces for your data (example)
interface Assignment {
	id: string;
	name: string;
	status?: "pending" | "completed" | "graded"; // Added status for filtering
	// Add other assignment properties if needed
}

const allAssignments: Assignment[] = [
	{ id: "lab1", name: "Lab 1", status: "pending" },
	{ id: "lab2", name: "Lab 2", status: "graded" },
	{ id: "lab3", name: "Lab 3", status: "pending" },
	{ id: "project", name: "Project Proposal", status: "completed" },
	{ id: "quiz1", name: "Quiz 1", status: "graded" },
	// Add more assignments as needed
];

// Filter assignments based on status (example)
const pendingAssignments = allAssignments.filter((a) => a.status === "pending");
const assignmentsForGrid = allAssignments; // Or maybe filter differently for the grid?
// --- End Mock Data ---

// Helper component for displaying lists with an empty state (Optional but recommended)
interface ItemsListProps<T> {
	title?: string;
	items: T[];
	renderItem: (item: T, index: number) => React.ReactNode;
	emptyMessage: string | React.ReactNode;
	itemKey: keyof T | ((item: T) => string); // To get a unique key for each item
}

function ItemsList<T>({
	title,
	items,
	renderItem,
	emptyMessage,
	itemKey,
}: ItemsListProps<T>) {
	const getKey = (item: T) => {
		if (typeof itemKey === "function") {
			return itemKey(item);
		}
		// Ensure the key exists and is string/number before accessing
		const key = item[itemKey];
		if (typeof key === "string" || typeof key === "number") {
			return key;
		}
		// Fallback or error handling if key is not primitive
		console.error("Invalid key type provided to ItemsList:", key);
		return Math.random().toString(); // Not ideal, provide a proper key!
	};

	return (
		<div className="mb-6">
			{" "}
			{/* Add margin below the list section */}
			{title && <h3 className="text-lg font-medium mb-3">{title}</h3>}{" "}
			{/* Consistent heading style */}
			{items && items.length > 0 ? (
				<div className="space-y-2">
					{" "}
					{/* Spacing between list items */}
					{items.map((item, index) => (
						<div key={getKey(item)}>
							{" "}
							{/* Use unique key */}
							{renderItem(item, index)}
						</div>
					))}
				</div>
			) : (
				<div className="flex items-center justify-center text-sm p-4 bg-muted/50 rounded-md border border-dashed">
					{typeof emptyMessage === "string" ? (
						<p className="text-muted-foreground">{emptyMessage}</p>
					) : (
						emptyMessage
					)}
				</div>
			)}
		</div>
	);
}

// --- End Helper Component ---
//

export default function SubjectPage() {
	// State for copy button feedback
	const [isCopied, setIsCopied] = useState(false);
	const { toast } = useToast(); // Initialize toast
	const [classDetails, setClassDetails] = useState();
	const slug = useParams();
	const classId = slug.subjectId;

	useEffect(() => {
		fetchClassDetails(Number(classId)).then((data) => setClassDetails(data));
	}, []);

	console.log(classDetails);
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
		teacher,
		classCode,
	} = classDetails.response;

	const subject: Subject = {
		classCode,
		name,
		subjectCode,
		batch,
		evaluators,
		class: className, // 'class' is a reserved word, so we rename it during destructuring
		section,
		trimester,
		teacher,
	};

	console.log(subject);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(subject.classCode);
			setIsCopied(true);
			toast({
				title: "Copied!",
				description: `Subject code ${subject.classCode} copied to clipboard.`,
				duration: 2000, // Show toast for 2 seconds
			});
			setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
		} catch (err) {
			console.error("Failed to copy text: ", err);
			toast({
				title: "Error",
				description: "Failed to copy subject code.",
				variant: "destructive",
				duration: 2000,
			});
		}
	};

	return (
		<div className="min-h-screen bg-white p-12 flex flex-col gap-8">
			{/* Breadcrumbs */}
			<div className="mb-2">{breadCrumbs(usePathname())}</div>

			{/* Subject Header */}
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold text-gray-900">
					{subject.subjectCode} - {subject.name} - {subject.batch}
				</h1>
				<div className="flex items-center text-sm text-gray-500 gap-2">
					<span>
						Subject Code:{" "}
						<span className="font-medium text-gray-700">
							{subject.classCode}
						</span>
					</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleCopy}
						className="h-5 w-5"
					>
						{isCopied ? (
							<Check className="h-3.5 w-3.5 text-green-600" />
						) : (
							<Copy className="h-3.5 w-3.5" />
						)}
						<span className="sr-only">Copy Subject Code</span>
					</Button>
				</div>
			</div>

			{/* Main Content Sections */}
			<div className="flex flex-col gap-8 w-full">
				{/* Pending Assignments */}
				<div className="flex-1">
					<ItemsList
						title="Pending Assignments"
						items={pendingAssignments}
						itemKey="id"
						renderItem={(assignment) => (
							<div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm transition-colors">
								<span className="text-gray-900">{assignment.name}</span>
								<Clock className="h-4 w-4 text-gray-400" />
							</div>
						)}
						emptyMessage="No pending assignments for this subject."
					/>
				</div>

				{/* All Assignments Grid */}
				<div className="flex-[2]">
					<h3 className="text-xl font-semibold mb-4 text-gray-900">
						All Assignments
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{/* Add New Assignment Card */}
						<div className="border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-all duration-200 rounded-lg flex items-center justify-center cursor-pointer min-h-[112px] min-w-[100px]">
							<span className="text-4xl text-gray-300">+</span>
						</div>
						{/* Assignment Cards */}
						{assignmentsForGrid.map((assignment) => (
							<div
								key={assignment.id}
								className="bg-white border border-gray-200 hover:shadow-lg hover:bg-blue-50 transition-all duration-200 rounded-lg flex items-center justify-center text-center p-4 min-h-[112px] min-w-[100px] text-base font-medium text-gray-900 cursor-pointer"
							>
								{assignment.name}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
