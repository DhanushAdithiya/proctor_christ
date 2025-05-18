"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
    Calendar as CalendarIcon,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Edit,
    Save,
    AlertTriangle,
    UploadCloud,
    File,
    FilePlus
} from 'lucide-react'; // Import icons
import { cn } from "@/lib/utils";
import LabInfo, { Lab } from '@/app/components/labInfo';


// Mock function to simulate fetching lab details
            const mockLab: Lab = {
                id: "labId",
                description: 'Analyze the given circuit and submit your report.  Include all calculations and diagrams.',
                name: `Lab ${"labId"}`, // Example: "Lab 1", "Lab 2", etc.
                dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Due in 7 days
                students: [
                    { id: 's1', name: 'Alice Smith', submitted: true, submissionTime: new Date(), grade: 85, file: 'assignment1_alice.pdf' },
                    { id: 's2', name: 'Bob Johnson', submitted: false },
                    { id: 's3', name: 'Charlie Brown', submitted: true, submissionTime: new Date(), grade: 92, file: 'lab_report_charlie.docx' },
                    { id: 's4', name: 'David Wilson', submitted: false },
                    { id: 's5', name: 'Eve Davis', submitted: true, submissionTime: new Date(), grade: 78, file: 'solution_eve.zip' },
                    { id: 's6', name: 'Frank Miller', submitted: true, submissionTime: new Date(), grade: 98, file: 'final_submission.pdf' },
                    { id: 's7', name: 'Grace Taylor', submitted: false },
                ],
                instructionFile: { name: 'lab_instructions.pdf', url: 'placeholder-url/lab_instructions.pdf' },
                additionalFiles: [
                    { name: 'resource1.pdf', url: 'placeholder-url/resource1.pdf' },
                    { name: 'code_example.zip', url: 'placeholder-url/code_example.zip' },
                ],
            };

export default function LabPage({ labId }: { labId: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sortedStudents = mockLab?.students.sort((a, b) => {
        if (a.submitted && !b.submitted) return -1;
        if (!a.submitted && b.submitted) return 1;
        return a.name.localeCompare(b.name);
    }) || [];

    // if (loading) {
    //     return <div className="text-gray-700 p-6">Loading lab details...</div>; // Simple loading indicator
    // }

    if (error) {
        return <div className="text-red-500 p-6">Error: {error}</div>;
    }

    if (!mockLab) {
        return <div className="text-gray-700 p-6">Lab not found.</div>;
    }

    const hasDueDatePassed = isPast(mockLab.dueDate);

    return (
        <div className="p-6 bg-white-100 min-h-screen">
            <div className="max-w-4xl mx-auto ">
                <LabInfo labInfo={mockLab} admin={true} />

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Student Submissions
                    </h2>
                    <div className="space-y-4">
                        {sortedStudents.map(student => (
                            <div
                                key={student.id}
                                className={cn(
                                    "p-4 rounded-lg border",
                                    student.submitted
                                        ? "bg-green-50/50 border-green-200"
                                        : hasDueDatePassed
                                            ? "bg-red-50/50 border-red-200"
                                            : "bg-gray-50/50 border-gray-200"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-medium text-gray-900">{student.name}</span>
                                        {student.submitted && (
                                            <span className="text-sm text-green-600 flex items-center gap-1">
                                                <CheckCircle className="h-4 w-4" />
                                                Submitted ({format(student.submissionTime!, "PPPppp")})
                                            </span>
                                        )}
                                        {!student.submitted && hasDueDatePassed && (
                                            <span className="text-sm text-red-600 flex items-center gap-1">
                                                <XCircle className="h-4 w-4" />
                                                Did Not Submit
                                            </span>
                                        )}
                                        {!student.submitted && !hasDueDatePassed && (
                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                Assigned
                                            </span>
                                        )}
                                    </div>
                                    {student.grade !== undefined && (
                                        <span className="text-xl font-bold text-blue-700">
                                            Grade: {student.grade}
                                        </span>
                                    )}
                                    {student.file && (
                                        <a
                                            href={student.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <File className="h-4 w-4" />
                                            {student.file}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};