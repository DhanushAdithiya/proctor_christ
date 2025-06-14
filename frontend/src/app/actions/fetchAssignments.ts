"use server";

import { prisma } from "@/lib/prisma";
import { Assignment } from "../components/pendingAssignments";

export async function getAllAssignments(subjectId: number) {
  const assignments = await prisma.lab.findMany({
    where: {
      subjectId,
    },
  });

  const assignmentList: Assignment[] = [];

  for (const assignment of assignments) {
    assignmentList.push({
      id: assignment.id,
      name: assignment.name,
      status: "pending",
    });
  }

  return assignments;
}

// Get pending lab submissions for a student in a specific class
export async function getPendingLabsForStudentInClass(
  studentId: string,
  classCode: number
) {
  const pendingLabs = await prisma.lab.findMany({
    where: {
      subjectId: classCode,
      subject: {
        students: {
          some: {
            studentId: studentId,
          },
        },
      },
      // Find labs where this student has no submission
      NOT: {
        submissions: {
          some: {
            studentId: studentId,
          },
        },
      },
      // Only include labs where deadline hasn't passed (optional)
      submissionDeadline: {
        gte: new Date(),
      },
    },
    include: {
      subject: true,
      creator: {
        select: {
          name: true,
        },
      },
    },
  });

  const assignmentList: Assignment[] = [];

  for (const assignment of pendingLabs) {
    assignmentList.push({
      id: assignment.id,
      name: assignment.name,
      status: "pending",
    });
  }

  return assignmentList;
}



export async function getPendingLabsForTeachersInClass(
  classCode: number
) {
	const res = await prisma.lab.findMany({
		where: {
			subjectId: classCode,
			submissionDeadline: {
				gte: new Date(),
			}
		}
	})
	
	const assignmentList: Assignment[] = [];
  for (const assignment of res) {
    assignmentList.push({
      id: assignment.id,
      name: assignment.name,
      status: "pending",
    });
  }

  return assignmentList;
}

// Get pending lab submissions for a student across all classes
export async function getAllPendingLabsForStudent(studentId: string) {
  // First get all subjects this student is enrolled in
  const enrolledSubjects = await prisma.studentSubject.findMany({
    where: {
      studentId: studentId,
    },
    select: {
      subjectId: true,
    },
  });

  // Get the subject IDs as an array
  const subjectIds = enrolledSubjects.map((subject) => subject.subjectId);

  // Get all pending labs for these subjects
  const pendingLabs = await prisma.lab.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      // Find labs where this student has no submission
      NOT: {
        submissions: {
          some: {
            studentId: studentId,
          },
        },
      },
      // Only include labs where deadline hasn't passed (optional)
      submissionDeadline: {
        gte: new Date(),
      },
    },
    include: {
      subject: true,
      creator: {
        select: {
          name: true,
        },
      },
    },
  });


  const assignmentList: Assignment[] = [];

  for (const assignment of pendingLabs) {
    assignmentList.push({
      id: assignment.id,
      name: assignment.name,
      status: "pending",
    });
  }

  return assignmentList;
}
