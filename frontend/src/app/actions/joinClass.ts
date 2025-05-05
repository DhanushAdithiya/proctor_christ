"use server"

import {prisma} from "@/lib/prisma"


export async function joinClass(classCode: number, regno: string) {
    try {
        const student = await prisma.studentSubject.create({
            data:{
                studentId: regno,
                subjectId: classCode
            },
            include: {
                subject: {
                    include: {
                        teacher: true,
                        evaluators: true,
                        students: true,
                    }
                },
                student: true
            }
        })
        return {
            success: true,
            message: "Joined class successfully",
            student
        }
        
        
    } catch (error) {
        console.error("An error occurred while joining class", error)
        return {
            success: false,
            message: "An error occurred while joining class"
        }
    }
}