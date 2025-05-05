"use server";

import { prisma } from "@/lib/prisma";
import { Subject } from "@/app/actions/createSubject";
import { SubjectData } from "../admin/page";

export interface SubjectResponse {
  success: boolean;
  response?: Subject;
}

export async function fetchClassDetails(
  classCode: number,
): Promise<SubjectResponse> {
  const response = await prisma.subject.findUnique({
    where: {
      classCode,
    },
  });

  if (!response) {
    return { success: false };
  }

  return { success: true, response };
}

export async function getAllEvaluatorClasses(
  regNo: string,
): Promise<Subject[]> {

  const userData = await prisma.user.findUnique({
    where: {
      registerNumber: regNo
    },
    include: {
      // Get subjects where this user is the teacher
      teacherSubjects: {
        select: {
          classCode: true,
          subjectCode: true,
          name: true,
          class: true,
          section: true,
          batch: true,
          trimester: true,
        },
      },
      // Get subjects where this user is an evaluator
      evaluatorSubjects: {
        include: {
          subject: {
            select: {
              classCode: true,
              subjectCode: true,
              name: true,
              class: true,
              section: true,
              batch: true,
              trimester: true,
              teacherId: true,
            },
          },
        },
      },
    },
  });



  if (!userData) return [];

  const teacherSubjects: Subject[] = userData.teacherSubjects.map(subj => ({
    classCode: subj.classCode,
    name: subj.name,
    subjectCode: subj.subjectCode,
    batch: subj.batch,
    class: subj.class,
    section: subj.section,
    trimester: subj.trimester,
    teacherId: regNo,
    evaluators: [], // since teacherSubjects don’t include evaluators
  }));

  const evaluatorSubjects: Subject[] = userData.evaluatorSubjects.map(es => ({
    classCode: es.subject.classCode,
    name: es.subject.name,
    subjectCode: es.subject.subjectCode,
    batch: es.subject.batch,
    class: es.subject.class,
    section: es.subject.section,
    trimester: es.subject.trimester,
    teacherId: es.subject.teacherId,
    evaluators: [regNo], // current user is one evaluator
  }));

  return [...teacherSubjects, ...evaluatorSubjects];
}

export async function getAllStudentClasses(regNo: string): Promise<SubjectData[]> { 

  const response = await prisma.user.findUnique({
    where: {
      registerNumber: regNo
    } ,
    include: {
      studentSubjects: {
        select: {
          subject: {
            select: {
              classCode: true,
              name: true,
            }
          }
        }
      }
    }
  })

  const subjects: SubjectData[] = response?.studentSubjects.map(subj => ({
    classCode: subj.subject.classCode,
    name: subj.subject.name,
  })) || [];

  return subjects;
}
