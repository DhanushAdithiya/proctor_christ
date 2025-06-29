"use server"

import { prisma } from "@/lib/prisma";
import LabInfo, { Lab } from "../components/labInfo";
import supabase from "@/lib/supabase";
import { UploadedFile } from "../admin/class/[subjectId]/lab/create-lab/page";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface CreateLab {
	name: string,
	description: string,
	submissionDeadline: Date,
	subjectId: number,
	creatorId: string,
	files: string[],
	questions: string
}

interface Student {
  id: string;
  name: string;
  submitted: boolean;
  submissionTime?: Date;
  file?: string;
  viva: number;
  timelySubmission: number;
  plagiarism: number;
  conceptClarity: number;
  evaluated: boolean;
  remarks?: string;
}

interface LabTeacher {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  subjectId: number;
  vivaQuestions: string;
  instructionFile?: {
    name: string;
    url: string;
  };
  additionalFiles: Array<{
    name: string;
    url: string;
  }>;
  students: Student[];
}

export async function createLab(lab: CreateLab): Promise<{ success: boolean, id?: string, error?: string }> {
	try {
		const res = await prisma.lab.create({
			data: {
				name: lab.name,
				description: lab.description,
				submissionDeadline: lab.submissionDeadline,
				creatorId: lab.creatorId,
				subjectId: lab.subjectId,
				resourceLink: lab.files,
				vivaQuestions: lab.questions
			},
		});

		if (res) {
			return { success: true, id: res.id }
		} else {
			return { success: false }
		}
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to create lab" };
	}
}

export async function fetchLabInfoWithSubmissions(labId: string): Promise<{ success: boolean, lab?: LabTeacher, error?: string }> {
	try {
		const lab = await prisma.lab.findUnique({
			where: {
				id: labId
			},
			include: {
				subject: {
					include: {
						students: {
							include: {
								student: true
							}
						}
					}
				},
				submissions: {
					include: {
						student: true
					}
				}
			}
		});

		if (!lab) {
			return { success: false, error: "Lab not found" };
		}

		const { instructionFile, additionalFiles } = await getLabFiles(lab.name, lab.subjectId);

		if (!instructionFile) {
			return { success: false, error: "Instruction file not found" };
		}

		// Create a map of submissions for quick lookup
		const submissionMap = new Map();
		lab.submissions.forEach(submission => {
			submissionMap.set(submission.studentId, submission);
		});

		// Map all students enrolled in the subject
		const students: Student[] = lab.subject.students.map(studentSubject => {
			const submission = submissionMap.get(studentSubject.studentId);
			
			return {
				id: studentSubject.studentId,
				name: studentSubject.student.name,
				submitted: !!submission,
				submissionTime: submission?.submitDate,
				file: submission?.submissionLink || undefined,
				viva: submission?.viva || 0,
				timelySubmission: submission?.timelySubission || 0, // Note: keeping the typo from schema
				plagiarism: submission?.plagarism || 0, // Note: keeping the typo from schema
				conceptClarity: submission?.conceptClarity || 0,
				evaluated: submission?.evaluated || false,
				remarks: submission?.remarks || undefined
			};
		});

		const labInfo: LabTeacher = {
			id: lab.id,
			name: lab.name,
			description: lab.description,
			subjectId: lab.subjectId,
			dueDate: lab.submissionDeadline,
			vivaQuestions: lab.vivaQuestions,
			instructionFile,
			additionalFiles,
			students
		};

		return { success: true, lab: labInfo };

	} catch (error) {
		console.error("An error occurred while fetching lab with submissions", error);
		return { success: false, error: "An error occurred while fetching lab" };
	}
}

export async function fetchLabInfo(labId: string) {
	try {
		const lab = await prisma.lab.findUnique({
			where: {
				id: labId
			}
		})

		if (!lab) {
			return { success: false, error: "Lab not found" }
		}

		console.log(lab.name, lab.subjectId);
		const { instructionFile, additionalFiles } = await getLabFiles(lab.name, lab.subjectId);

		if (!instructionFile) {
			return { success: false, error: "Instruction file not found" }
		}

		const labInfo =  {
			id: lab.id,
			name: lab.name,
			description: lab.description,
			subjectId: lab.subjectId,
			dueDate: lab.submissionDeadline,
			instructionFile,
			vivaQuestions: lab.vivaQuestions,
			additionalFiles
		}

		return { success: true, lab:labInfo}

	} catch (error) {
		console.error("An error occured while fetching lab", error)
		return { success: false, error: "An error occurred while fetching lab" }
	}
}

export async function fetchLab(labId: string, studentId: string): Promise<{ success: boolean, lab?: Lab, error?: string }> {
	try {
		const res = await fetchLabInfo(labId);

		if (!res.success || !res.lab) {
			return { success: false, error: "Lab not found" }
		}

		const lab = res.lab;

		const { instructionFile, additionalFiles } = await getLabFiles(lab.name, lab.subjectId);

		if (!instructionFile) {
			return { success: false, error: "Instruction file not found" }
		}

		// Check if the student has submitted this lab
		const submission = await prisma.labSubmission.findUnique({
			where: {
				labId_studentId: {
					labId: lab.id,
					studentId: studentId
				}
			}
		})

		// Determine submission status
		const submitted = submission !== null;

		const labInfo: Lab = {
			id: lab.id,
			name: lab.name,
			description: lab.description,
			dueDate: lab.dueDate,
			additionalFiles,
			instructionFile,
			evaluated: submission?.evaluated ? submission : false ,
			submitted: submitted, // Add the new 'submitted' field
		}
		console.log(labInfo);
		console.log(submission)

		return { success: true, lab: labInfo };

	} catch (error) {
		console.error("An error occurred while fetching lab", error);
		return { success: false, error: "An error occurred while fetching lab" }
	}
}

export async function generateLabMarksExcel(labId: string, labName: string): Promise<Buffer> {
	try {
		const lab = await prisma.lab.findUnique({
			where: {
				id: labId
			},
			include: {
				subject: {
					include: {
						students: {
							include: {
								student: true
							}
						}
					}
				},
				submissions: {
					include: {
						student: true
					}
				}
			}
		});

		if (!lab) {
			throw new Error("Lab not found");
		}

		// Create a map of submissions for quick lookup
		const submissionMap = new Map();
		lab.submissions.forEach(submission => {
			submissionMap.set(submission.studentId, submission);
		});

		// Prepare data for Excel
		const excelData = lab.subject.students.map(studentSubject => {
			const submission = submissionMap.get(studentSubject.studentId);
			
			return {
				'Student ID': studentSubject.studentId,
				'Student Name': studentSubject.student.name,
				'Submitted': submission ? 'Yes' : 'No',
				'Submission Date': submission?.submitDate ? new Date(submission.submitDate).toLocaleDateString() : 'N/A',
				'Viva Score (3)': submission?.viva || 0,
				'Timely Submission Score (2)': submission?.timelySubission || 0,
				'Plagiarism Score (2)': submission?.plagarism || 0,
				'Concept Clarity Score (3)': submission?.conceptClarity || 0,
				'Total Score (10)': (submission?.viva || 0) + (submission?.timelySubission || 0) + (submission?.plagarism || 0) + (submission?.conceptClarity || 0),
				'Evaluated': submission?.evaluated ? 'Yes' : 'No',
				'Remarks': submission?.remarks || 'N/A'
			};
		});

		// Create workbook and worksheet
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(excelData);

		// Set column widths
		ws['!cols'] = [
			{ width: 15 }, // Student ID
			{ width: 25 }, // Student Name
			{ width: 12 }, // Submitted
			{ width: 18 }, // Submission Date
			{ width: 15 }, // Viva Score
			{ width: 25 }, // Timely Submission Score
			{ width: 20 }, // Plagiarism Score
			{ width: 25 }, // Concept Clarity Score
			{ width: 18 }, // Total Score
			{ width: 12 }, // Evaluated
			{ width: 30 }  // Remarks
		];

		// Add worksheet to workbook
		XLSX.utils.book_append_sheet(wb, ws, 'Lab Marks');

		// Generate Excel file buffer and return it
		const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
		return Buffer.from(excelBuffer);

	} catch (error) {
		console.error("Error generating lab marks Excel:", error);
		throw error;
	}
}

export async function downloadAllSubmissions(subjectId: string, labName: string): Promise<Buffer> {
	try {
		// List all files in the lab submissions folder
		const { data: files, error } = await supabase.storage
			.from("lab-submissions")
			.list(`${subjectId}/${labName}`);

		if (error) {
			throw new Error(`Error listing files: ${error.message}`);
		}

		if (!files || files.length === 0) {
			throw new Error("No submissions found for this lab");
		}

		// Create a new JSZip instance
		const zip = new JSZip();

		// Download each file and add to zip
		for (const file of files) {
			if (file.name && file.name !== '.emptyFolderPlaceholder') {
				const filePath = `${subjectId}/${labName}/${file.name}`;
				
				const { data: fileData, error: downloadError } = await supabase.storage
					.from("lab-submissions")
					.download(filePath);

				if (downloadError) {
					console.error(`Error downloading file ${file.name}:`, downloadError);
					continue; // Skip this file and continue with others
				}

				if (fileData) {
					// Convert blob to array buffer
					const arrayBuffer = await fileData.arrayBuffer();
					zip.file(file.name, arrayBuffer);
				}
			}
		}

		// Generate the zip file
		const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
		return zipBuffer;

	} catch (error) {
		console.error("Error creating submissions zip:", error);
		throw error;
	}
}

export async function getLabFiles(
	labName: string,
	subjectId: number
): Promise<{
	instructionFile?: UploadedFile,
	additionalFiles: UploadedFile[]
}> {
	// Initialize the result object
	const result = {
		instructionFile: undefined as UploadedFile | undefined,
		additionalFiles: [] as UploadedFile[]
	};

	// Get instruction files
	const { data: instructionData, error: instructionError } = await supabase.storage
		.from("lab-instructions")
		.list(`${subjectId}/${labName}/instructions`);

	if (instructionError) {
		console.error("Error fetching instruction files:", instructionError);
		return result;
	}

	// Get the instruction file
	if (instructionData && instructionData.length > 0) {
		const instructionFilePath = `${subjectId}/${labName}/instructions/${instructionData[0].name}`;
		const { data: urlData } = supabase.storage
			.from("lab-instructions")
			.getPublicUrl(instructionFilePath);

		result.instructionFile = {
			name: instructionData[0].name,
			url: urlData.publicUrl
		};
	}

	// Get additional files
	const { data: additionalData, error: additionalError } = await supabase.storage
		.from("lab-instructions")
		.list(`${subjectId}/${labName}/additional`);

	if (additionalError) {
		console.error("Error fetching additional files:", additionalError);
		return result;
	}

	// Add additional files to result
	if (additionalData && additionalData.length > 0) {
		result.additionalFiles = additionalData.map(file => {
			const filePath = `${subjectId}/${labName}/additional/${file.name}`;
			const { data: urlData } = supabase.storage
				.from("lab-instructions")
				.getPublicUrl(filePath);

			return {
				name: file.name,
				url: urlData.publicUrl
			} as UploadedFile;
		});
	}

	return result;
}

export async function updateDate(labId:string, newDeadline: Date): Promise<boolean> {
	const res = await prisma.lab.update({
		where: {
			id: labId
		},
		data: {
			submissionDeadline: newDeadline
		}
	})

	if (res) {
		return true
	} else {
		return false
	}
}

export async function updateFiles(labId: string, resourceFiles:string[] ): Promise<boolean> {
		const res = await prisma.lab.update({
			where: {
				id: labId
			},
			data: {
				resourceLink: resourceFiles	
			}
		})

	if (!res) {
		return false
	}

	return true
}

export async function markCompleted(labid: string, studentId: string, score: number) {
	console.log(score)
	const res = await prisma.labSubmission.update({
		where: {
			labId_studentId: {
				labId: labid,
				studentId: studentId
			}
		},
		data: {
			evaluated: true,
			viva: score
		}
	})

	if (!res) {
		return false;
	}

	return true
}

export async function addMarks(labid: string, studentId: string, score: number, category: string) {
	// Valid categories that can be updated
	const validCategories = ['viva', 'timelySubission', 'plagarism', 'conceptClarity'];
	
	// Check if the provided category is valid
	if (!validCategories.includes(category)) {
		throw new Error(`Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`);
	}
	
	// Build the data object dynamically
	const updateData: Record<string, number> = {
		[category]: score
	};
	
	try {
		const res = await prisma.labSubmission.update({
			where: {
				labId_studentId: {
					labId: labid,
					studentId: studentId
				}
			},
			data: updateData
		});

		if (!res) {
			return false;
		}
		return true;
	} catch (error) {
		console.error('Error updating marks:', error);
		return false;
	}
}