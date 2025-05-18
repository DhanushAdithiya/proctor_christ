
"use client";

import { useState } from "react";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import supabase from "@/lib/supabase";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// lucide-react icons
import { FileUp, FileCheck2, AlertTriangle, CheckCircle2, Loader2, CheckCircle } from "lucide-react";
import { submitAssignment, LabSubmission } from '@/app/actions/handleSubmissions';
import { useParams } from "next/navigation";
import { Lab } from '@/app/components/labInfo';
import { sub } from "date-fns";

function lineSimilarity(a: string, b: string): number {
  const linesA = new Set(a.split("\n").map((line) => line.trim()).filter(Boolean));
  const linesB = new Set(b.split("\n").map((line) => line.trim()).filter(Boolean));
  const intersection = new Set([...linesA].filter((x) => linesB.has(x)));
  const union = new Set([...linesA, ...linesB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

async function extractTextContent(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return "";

  if (["txt", "js", "py", "java", "cpp", "c", "md", "csv", "json", "r"].includes(ext)) {
    return await file.text();
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }

  if (["xlsx", "xls"].includes(ext)) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    let result = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      result += XLSX.utils.sheet_to_csv(sheet);
    });
    return result;
  }

  return "";
}

export default function PlagiarismChecker({labInfo}: {labInfo: Lab}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success , setSuccess] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<{
    percentage: number;
    matchedFiles: { filename: string; similarity: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { subjectId, labId } = useParams();
  const studentId = sessionStorage.getItem("regno");
  console.log(labInfo)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPlagiarismResult(null);
      setError(null);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    try {
      setError(null);
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${studentId}-${labInfo.name}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lab-submissions")
        .upload(`${subjectId}/${labInfo.name}/${fileName}`, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      


      const submit = await submitAssignment({
        id: studentId,
        subjectId: subjectId,
        labId: labId,
        labName: labInfo.name,
      }, uploadData.fullPath);

      if (submit.success) {
        setSuccess(true);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setUploading(false);
    }
  };

  const checkPlag = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    try {
      setError(null);
      const submittedContent = await extractTextContent(file);

      const { data: existingFiles, error: listError } = await supabase.storage
        .from("lab-submissions")
        .list("submissions", {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });
      if (listError) throw new Error(`Failed to fetch existing files: ${listError.message}`);

      const results = await Promise.all(
        existingFiles.map(async (existingFile) => {
          try {
            const { data, error: downloadError } = await supabase.storage
              .from("lab-submissions")
              .download(`submissions/${existingFile.name}`);
            if (downloadError || !data) return null;
            const existingFileObj = new File([data], existingFile.name);
            const existingContent = await extractTextContent(existingFileObj);
            const similarity = lineSimilarity(submittedContent, existingContent);
            return {
              filename: existingFile.name,
              similarity,
            };
          } catch {
            return null;
          }
        })
      );

      const validResults = results.filter(Boolean).sort((a, b) => b!.similarity - a!.similarity);
      const highestSimilarity = validResults.length > 0 ? validResults[0]!.similarity : 0;

      setPlagiarismResult({
        percentage: Math.round(highestSimilarity * 100),
        matchedFiles: validResults.map((r) => r!),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  return (
    <div className="py-10">
      <CardContent>
        <div className="mb-6">
          <Input
            type="file"
            onChange={handleFileChange}
            className="mb-2"
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Supported: Code (.js, .py, etc.), Documents (.docx, .txt), Data (.csv, .xlsx)
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            onClick={checkPlag}
            disabled={!file || uploading}
            className="w-full"
            variant="default"
          >
            {uploading ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <FileCheck2 className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Processing..." : "Check Plagiarism"}
          </Button>
          {plagiarismResult?.percentage < 90 && (
  <Button
    onClick={uploadFile}
    disabled={!file || uploading}
    className="w-full"
    variant="green" // Use the custom green variant
  >
    {uploading ? (
      <Loader2 className="animate-spin w-4 h-4 mr-2" />
    ) : (
      <FileUp className="w-4 h-4 mr-2" />
    )}
    {uploading ? "Uploading..." : "Upload File"}
  </Button>
)}
        </div>
        {error && (
          <Alert variant="destructive" className="mt-5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
  <Alert variant="default" className="mt-5">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <AlertTitle>Success</AlertTitle>
    <AlertDescription> Submitted successfully</AlertDescription>
  </Alert>
)}

{plagiarismResult && (
          <Card className="mt-8 bg-muted/40 border-0">
            <CardHeader className="flex flex-row items-center gap-2">
              {plagiarismResult.percentage > 70 ? (
                <AlertTriangle className="text-red-600 w-5 h-5" />
              ) : plagiarismResult.percentage > 40 ? (
                <AlertTriangle className="text-yellow-500 w-5 h-5" />
              ) : (
                <CheckCircle2 className="text-green-600 w-5 h-5" />
              )}
              <CardTitle className="text-lg font-semibold">Plagiarism Check Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Similarity Score</span>
                <span
                  className={`font-bold ${
                    plagiarismResult.percentage > 70
                      ? "text-red-600"
                      : plagiarismResult.percentage > 40
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {plagiarismResult.percentage}%
                </span>
              </div>
              <Progress
                value={plagiarismResult.percentage}
                className={`h-3 rounded-full`}
              />
              {plagiarismResult.matchedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Top matches:</h4>
                  <ul className="space-y-2">
                    {plagiarismResult.matchedFiles.slice(0, 3).map((match, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center px-2 py-1 rounded bg-muted/30"
                      >
                        <span className="truncate max-w-[60%]">{match.filename}</span>
                        <span className="font-medium">
                          {Math.round(match.similarity * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </div>
  );
}
