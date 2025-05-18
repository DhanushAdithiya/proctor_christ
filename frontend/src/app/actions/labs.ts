"use server";

import {prisma} from "@/lib/prisma";
import LabInfo, { Lab } from "../components/labInfo";
import supabase from "@/lib/supabase";
import { UploadedFile } from "../admin/class/[subjectId]/lab/create-lab/page";

export interface CreateLab {
    name: string,
    description: string,
    submissionDeadline: Date,
    subjectId: number,
    creatorId: string,
    files: string[]
}

export async function createLab(lab: CreateLab): Promise<{success: boolean, id?: string, error?: string}> {

    try{
        const res = await prisma.lab.create({
        data: {
            name: lab.name,
            description: lab.description,
            submissionDeadline: lab.submissionDeadline,
            creatorId: lab.creatorId,
            subjectId: lab.subjectId,
            resourceLink: lab.files
        },
        });

        if (res) {
            return {success: true, id: res.id}
        } else {
            return {success: false}
        }
    } catch (error) {
        console.error(error);
        return {success: false, error: "Failed to create lab"};
    }
}


export async function fetchLab(labId: string, studentId: string): Promise<{success: boolean, lab?: Lab, error?: string}> {
    try {
        const lab = await prisma.lab.findUnique({
            where: {
                id: labId,
            },
        });
        
        if (!lab) {
            return {success: false, error: "Lab not found"}
        }

        const {instructionFile, additionalFiles} = await getLabFiles(lab.name, lab.subjectId);

        if (!instructionFile) {
            return {success: false, error: "Instruction file not found"}
        }

        // Check if the student has submitted this lab
        const submission = await prisma.labSubmission.findUnique({
            where: {
                labId_studentId: {
                    labId: lab.id,
                    studentId: studentId
                }
            }
        });

        // Determine submission status
        const submitted = submission !== null;

        const labInfo: Lab = {
            id: lab.id,
            name: lab.name,
            description: lab.description,
            dueDate: lab.submissionDeadline,
            additionalFiles, 
            instructionFile,
            submitted: submitted, // Add the new 'submitted' field
        }
        return {success: true, lab: labInfo};

    } catch (error) {
        console.error("An error occurred while fetching lab", error);
        return {success: false, error: "An error occurred while fetching lab"}
    }
}

export  async function getLabFiles(
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

export async function markCompleted(studentId: number, labId: string)
{
 const res = await prisma.labSubmission.update({
  where: {
    studentId,
    labId
  },
  data: {

  }
 })
}