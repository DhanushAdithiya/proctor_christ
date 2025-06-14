import {
	AlertTriangle,

	CalendarIcon,
	Clock,
	Edit,
	FilePlus,
	Save,
	File,
	XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateDate, updateFiles } from "@/app/actions/labs"
import { format, formatDistanceToNow, isPast } from "date-fns";
import { uploadFile } from "../actions/handleFiles";
import { useParams } from "next/navigation";

export interface UploadedFile {
	name: string;
	url: string;
}

export interface Lab {
	id: string;
	description: string;
	name: string;
	dueDate: Date;
	students?: Student[];
	instructionFile: UploadedFile | null;
	additionalFiles: UploadedFile[];
	submitted?: boolean;
	evaluated?: boolean;
	plagiarismPercentage?: number; // Optional, only if submitted
	submissionFile?: UploadedFile | null;
}

export interface Student {
	id: string;
	name: string;
	submitted: boolean;
	submissionTime?: Date; // Optional, only if submitted
	grade?: number; // Add grade
	file?: string;
}

export default function LabInfo({
	labInfo,
	admin,
}: {
	labInfo: Lab;
	admin: boolean;
}) {
	const [message, setMessage] = useState("");
	const [newInstructionFile, setNewInstructionFile] =
		useState<UploadedFile | null>(null);
	const [newAdditionalFiles, setNewAdditionalFiles] = useState<UploadedFile[]>(
		[],
	);
	const [lab, setLab] = useState<Lab>(labInfo);
	const [isDialogOpen, setIsDialogOpen] = useState(false); // This state isn't used in the provided JSX
	const [isPastDue, setIsPastDue] = useState(false);
	const [isEditingDueDate, setIsEditingDueDate] = useState(false);
	const [newDueDate, setNewDueDate] = useState<Date | undefined>(
		labInfo.dueDate,
	);
	const [newDueTime, setNewDueTime] = useState<{
		hours: string;
		minutes: string;
		ampm: string;
	}>({
		hours: format(labInfo.dueDate, "hh"),
		minutes: format(labInfo.dueDate, "mm"),
		ampm: format(labInfo.dueDate, "aa"),
	});

	const { subjectId, labId } = useParams(); // labId is imported but not used in the provided code

	// Initialize lab state with labInfo on component mount
	useEffect(() => {
		setLab(labInfo);
	}, [labInfo]);

	const handleDateChange = (date: Date | undefined) => {
		setNewDueDate(date);
	};

	const handleTimeChange = (
		field: "hours" | "minutes" | "ampm",
		value: string,
	) => {
		setNewDueTime((prev) => ({ ...prev, [field]: value }));
	};

	const handleConfirmChangeDueDate = async () => {
		if (newDueDate) {
			const selectedDateTime = new Date(
				newDueDate.getFullYear(),
				newDueDate.getMonth(),
				newDueDate.getDate(),
				parseInt(newDueTime.hours) +
				(newDueTime.ampm === "PM" && parseInt(newDueTime.hours) !== 12
					? 12
					: 0),
				parseInt(newDueTime.minutes),
				0,
			);

			if (selectedDateTime < new Date()) {
				setIsPastDue(true);
				return;
			}

			setLab((prevLab) => {
				if (prevLab) {
					const finalDueDate = new Date(
						newDueDate.getFullYear(),
						newDueDate.getMonth(),
						newDueDate.getDate(),
						parseInt(newDueTime.hours) +
						(newDueTime.ampm === "PM" && parseInt(newDueTime.hours) !== 12
							? 12
							: 0),
						parseInt(newDueTime.minutes),
						0,
					);
					return { ...prevLab, dueDate: finalDueDate };
				}
				return prevLab;
			});

			setIsDialogOpen(false); // This state isn't used in the provided JSX
			setIsPastDue(false);
			setIsEditingDueDate(false);

			const status = await updateDate(lab.id, newDueDate);
			if (status) {
				setMessage("Due date updated successfully");
			}
		}
	};

	const handleInstructionFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			// In a real app, you'd upload the file and get a URL
			const res = await uploadFile(file, lab.name, subjectId, "instructions");
			if (res.url) {
				const uploadedFile: UploadedFile = {
					name: file.name,
					url: res.url,
				};

				setNewInstructionFile(uploadedFile);
				setMessage(`New instruction file "${file.name}" selected.`);
			} else {
				setMessage("Could not upload file");
			}
		}
	};

	const handleAdditionalFilesChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (files) {
			const newFiles: UploadedFile[] = [];
			for (let file of Array.from(files)) {
				const res = await uploadFile(file, lab.name, subjectId, "additional");
				if (res.url) {
					const uploadedFile: UploadedFile = {
						name: file.name,
						url: res.url,
					};
					newFiles.push(uploadedFile);
				} else {
					setMessage("Could not upload additional files");
					console.error(res.error);
				}
			}
			setNewAdditionalFiles((prev) => [...prev, ...newFiles]);
			setMessage(`${newFiles.length} additional file(s) selected.`);
		}
	};

	const handleSaveFiles = async () => {
		const newLab = { ...lab };
		if (newInstructionFile) {
			newLab.instructionFile = newInstructionFile
			let resourceFiles = [newInstructionFile.url];
			lab.additionalFiles.map((file) => {
				resourceFiles.push(file.url);
			})

			const res = await updateFiles(lab.id, resourceFiles);
			if (res) {
				setMessage("Files updated successfully.");
				setNewInstructionFile(null);
			} else {
				setMessage("Could not upload files");
			}
		}

		if (newAdditionalFiles.length > 0) {
			newLab.additionalFiles = [
				...newLab.additionalFiles,
				...newAdditionalFiles,
			];

			let resourceFiles = [lab.instructionFile?.url]
			newLab.additionalFiles.map((file) => {
				resourceFiles.push(file.url)
			})
			newAdditionalFiles.map((file) => {
				resourceFiles.push(file.url)
			})

			const res = await updateFiles(lab.id, resourceFiles);
			if (res) {
				setMessage("Updated Additional Files");
				setNewAdditionalFiles([]);
			}
		}

		setLab(newLab);
	};

	const removeAdditionalFile = (index: number) => {
		setNewAdditionalFiles((prevFiles) =>
			prevFiles.filter((_, i) => i !== index),
		);
	};

	return (
		<div>
			<h1 className="text-3xl font-bold text-gray-900 mb-6">
				Lab Details: {lab.name}
			</h1>

			<p className="text-gray-700 mb-6">{lab.description}</p>

			{/* Due Date */}
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-xl font-semibold text-gray-700 mb-2 flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Due Date:
					</h2>
					{isEditingDueDate ? (
						<div className="flex flex-col sm:flex-row items-center gap-4">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"outline"}
										className={cn(
											"w-full sm:w-auto justify-start text-left font-normal",
											!newDueDate && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
										{newDueDate ? (
											format(newDueDate, "PPP")
										) : (
											<span>Pick a date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0 bg-white" align="start">
									<Calendar
										mode="single"
										selected={newDueDate}
										onSelect={handleDateChange}
										disabled={(date) =>
											date < new Date(new Date().setHours(0, 0, 0, 0))
										}
										initialFocus
										className="bg-white"
									/>
								</PopoverContent>
							</Popover>
							<div className="flex items-center gap-2">
								<Select
									value={newDueTime.hours}
									onValueChange={(value) => handleTimeChange("hours", value)}
								>
									<SelectTrigger className="w-[80px]">
										<SelectValue placeholder="HH" />
									</SelectTrigger>
									<SelectContent>
										{Array.from({ length: 12 }, (_, i) => {
											const hour = (i + 1).toString().padStart(2, "0");
											return (
												<SelectItem key={hour} value={hour}>
													{hour}
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
								<span className="text-gray-500">:</span>
								<Select
									value={newDueTime.minutes}
									onValueChange={(value) => handleTimeChange("minutes", value)}
								>
									<SelectTrigger className="w-[80px]">
										<SelectValue placeholder="MM" />
									</SelectTrigger>
									<SelectContent>
										{["00", "15", "30", "45"].map((min) => (
											<SelectItem key={min} value={min}>
												{min}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select
									value={newDueTime.ampm}
									onValueChange={(value) => handleTimeChange("ampm", value)}
								>
									<SelectTrigger className="w-[90px]">
										<SelectValue placeholder="AM/PM" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="AM">AM</SelectItem>
										<SelectItem value="PM">PM</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={handleConfirmChangeDueDate}
								variant="outline"
								size="sm"
								className="bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300"
							>
								<Save className="h-4 w-4 mr-2" />
								Save
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-4">
							<p className="text-gray-900 font-medium">
								{format(lab.dueDate, "PPPppp")}
							</p>
							{admin && (
								<Button
									onClick={() => {
										setIsEditingDueDate(true);
										setNewDueDate(lab.dueDate);
										setNewDueTime({
											hours: format(lab.dueDate, "hh"),
											minutes: format(lab.dueDate, "mm"),
											ampm: format(lab.dueDate, "aa"),
										});
									}}
									variant="outline"
									size="sm"
									className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
								>
									<Edit className="h-4 w-4 mr-2" />
									Edit
								</Button>
							)}
						</div>
					)}
					{isPastDue && (
						<p className="mt-2 text-sm text-red-500 flex items-center gap-1">
							<AlertTriangle className="h-4 w-4" />
							Due date and time must be in the future.
						</p>
					)}
				</div>
				{message && (
					<div className="text-green-600 p-2 rounded bg-green-50">
						{message}
					</div>
				)}
			</div>

			{/* Files Section */}
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-gray-700 mb-4">Files</h2>
				<div className="space-y-4">
					{/* Instruction File */}
					<div>
						<Label className="block text-sm font-medium text-gray-700">
							Instruction File
						</Label>
						<div className="mt-1 flex items-center gap-4">
							{lab.instructionFile ? (
								<div className="flex items-center gap-2">
									<a
										href={lab.instructionFile.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:underline flex items-center gap-1"
									>
										<File className="h-4 w-4" />
										{lab.instructionFile.name}
									</a>
								</div>
							) : (
								<span className="text-gray-500">
									No instruction file uploaded.
								</span>
							)}
							<Input
								id="instructionFile"
								type="file"
								onChange={handleInstructionFileChange}
								className="hidden"
								accept=".doc,.docx,.pdf"
							/>
							<label htmlFor="instructionFile">
								{admin && (
									<Button variant="outline" asChild>
										<div className="flex items-center gap-2">
											<FilePlus className="h-4 w-4" />
											<span>Change File</span>
										</div>
									</Button>
								)}
							</label>
						</div>
					</div>

					{/* Additional Files */}
					<div>
						<Label className="block text-sm font-medium text-gray-700">
							Additional Files
						</Label>
						<div className="mt-1 flex items-center gap-4">
							{lab.additionalFiles.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{lab.additionalFiles.map((file, index) => (
										<a
											key={index}
											href={file.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline flex items-center gap-1 mr-2"
										>
											<File className="h-4 w-4" />
											{file.name}
										</a>
									))}
								</div>
							) : (
								<span className="text-gray-500">
									No additional files uploaded.
								</span>
							)}
							<Input
								id="additionalFiles"
								type="file"
								multiple
								onChange={handleAdditionalFilesChange}
								className="hidden"
								accept="*"
							/>
							<label htmlFor="additionalFiles">
								{admin && (
									<Button variant="outline" asChild>
										<div className="flex items-center gap-2">
											<FilePlus className="h-4 w-4" />
											<span>Add Files</span>
										</div>
									</Button>
								)}
							</label>
						</div>
						{newAdditionalFiles.length > 0 && (
							<div className="mt-2">
								<p className="text-sm font-medium text-gray-700">
									Files to Add:
								</p>
								<ul className="list-disc list-inside">
									{newAdditionalFiles.map((file, index) => (
										<li
											key={index}
											className="text-sm text-gray-600 flex items-center justify-between"
										>
											<span>{file.name}</span>
											<Button
												variant="ghost"
												size="icon"
												className="ml-2 text-red-500 hover:text-red-700"
												onClick={() => removeAdditionalFile(index)}
											>
												<XCircle className="h-4 w-4" />
											</Button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
					{admin && (
						<Button onClick={handleSaveFiles} className="mt-4">
							Save Files
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
