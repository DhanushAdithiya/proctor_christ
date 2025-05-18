"use server"
import { prisma } from "@/lib/prisma";
import supabase from "@/lib/supabase";

export interface LabSubmission {
    id: string
    labId: string
    labName: string
    subjectId: number
}
export async function submitAssignment(submission: LabSubmission, filePath: string): Promise<{success: boolean, message?: string}> {
    try{
        const fileUrl = await fetchLabSubmission(filePath);

        const res = await prisma.labSubmission.create({
            data:{
                studentId: submission.id,
                labId: submission.labId,
                submitDate: new Date(),
                submissionLink: fileUrl || "",
            }
        })

        if (res) {
            return {success: true, message: "Assignment submitted successfully"}
        }
       
        return {success: false, message: "Failed to submit assignment"}
    } catch (error) {
        console.error(error);
        return {success: false, message: "Failed to submit assignment"}
    }
}

export async function fetchLabSubmission(filePath: string) {
    try {
        const res = await supabase.storage.from("lab-submissions").getPublicUrl(filePath);

        if (res) {
            return res.data.publicUrl;
        }

        return ""
    } catch (error) {
        console.error(error);
        return "";
    }
}