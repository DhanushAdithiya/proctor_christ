"use client";
import React, { useState, useEffect } from "react";
import { format, isPast } from "date-fns";
import { Users, CheckCircle, XCircle, Clock, File, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import LabInfo from "@/app/components/labInfo";
import { fetchLabInfoWithSubmissions, generateLabMarksExcel, downloadAllSubmissions } from "@/app/actions/labs";
import { useParams } from "next/navigation";

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

export default function LabPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lab, setLab] = useState<LabTeacher | null>(null);
  const [downloadingMarks, setDownloadingMarks] = useState(false);
  const [downloadingSubmissions, setDownloadingSubmissions] = useState(false);
  const { labId, subjectId } = useParams();

  useEffect(() => {
    fetchLabInfoWithSubmissions(labId as string).then((fetchedLab) => {
      if (!fetchedLab.success) {
        setError(fetchedLab.error || "error");
      } else {
        setLab(fetchedLab.lab!);
      }
      setLoading(false);
    });
  }, [labId]);

  const handleDownloadMarks = async () => {
    if (!lab) return;
    
    setDownloadingMarks(true);
    try {
      const excelData = await generateLabMarksExcel(lab.id, lab.name);
      
      // Create and download the Excel file on client side
      const blob = new Blob([excelData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lab.name}_marks.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download marks:", error);
    } finally {
      setDownloadingMarks(false);
    }
  };

  const handleDownloadAllSubmissions = async () => {
    if (!lab) return;
    
    setDownloadingSubmissions(true);
    try {
      const zipData = await downloadAllSubmissions(subjectId as string, lab.name);
      
      // Create and download the zip file on client side
      const blob = new Blob([zipData], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lab.name}_submissions.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download submissions:", error);
    } finally {
      setDownloadingSubmissions(false);
    }
  };

  const handleViewSubmission = (submissionLink: string) => {
    // Direct download of the submission file
    const link = document.createElement('a');
    link.href = submissionLink;
    link.download = '';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedStudents =
    lab?.students.sort((a, b) => {
      if (a.submitted && !b.submitted) return -1;
      if (!a.submitted && b.submitted) return 1;
      return a.name.localeCompare(b.name);
    }) || [];

  if (loading) {
    return <div className="text-gray-700 p-6">Loading lab details...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">Error: {error}</div>;
  }

  if (!lab) {
    return <div className="text-gray-700 p-6">Lab not found.</div>;
  }

  const hasDueDatePassed = isPast(lab.dueDate);
  const submittedCount = lab.students.filter(s => s.submitted).length;
  const totalStudents = lab.students.length;

  return (
    <div className="p-6 bg-white-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <LabInfo labInfo={lab} admin={true} />
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Student Submissions ({submittedCount}/{totalStudents})
            </h2>
            
            <div className="flex gap-3">
              <button
                onClick={handleDownloadAllSubmissions}
                disabled={downloadingSubmissions}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                {downloadingSubmissions ? "Downloading..." : "Download All Submissions"}
              </button>
              
              <button
                onClick={handleDownloadMarks}
                disabled={downloadingMarks}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                {downloadingMarks ? "Downloading..." : "Download Marks"}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {sortedStudents.map((student) => (
              <div
                key={student.id}
                className={cn(
                  "p-4 rounded-lg border",
                  student.submitted
                    ? "bg-green-50/50 border-green-200"
                    : hasDueDatePassed
                      ? "bg-red-50/50 border-red-200"
                      : "bg-gray-50/50 border-gray-200",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-medium text-gray-900">
                      {student.name}
                    </span>
                    {student.submitted && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Submitted {student.submissionTime && `(${format(student.submissionTime, "PPPppp")})`}
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
                  
                  <div className="flex items-center gap-4">
                    {student.evaluated && (
                      <span className="text-sm text-green-600 font-medium">
                        Evaluated
                      </span>
                    )}
                    {student.file && (
                      <button
                        onClick={() => handleViewSubmission(student.file!)}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <File className="h-4 w-4" />
                        View Submission
                      </button>
                    )}
                  </div>
                </div>
                
                {student.submitted && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Viva</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {student.viva}/3
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Timely Submission</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {student.timelySubmission}/2
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Plagiarism</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {student.plagiarism}/2
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Concept Clarity</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {student.conceptClarity}/3
                      </div>
                    </div>
                  </div>
                )}
                
                {student.remarks && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Remarks:</div>
                    <div className="text-sm text-gray-800 mt-1">{student.remarks}</div>
                  </div>
                )}
              </div>
            ))}
            
            {sortedStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students enrolled in this lab.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}