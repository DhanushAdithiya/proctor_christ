"use client";

import { useState } from "react";
import supabase from "@/lib/supabase";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// lucide-react icons
import { FileUp, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { submitAssignment } from '@/app/actions/handleSubmissions';
import { useParams } from "next/navigation";
import { Lab } from '@/app/components/labInfo';
import { addMarks } from "../actions/labs";

export default function FileUploader({labInfo}: {labInfo: Lab}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subjectId, labId } = useParams();
  const studentId = sessionStorage.getItem("regno");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
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

      const updateMarks = await addMarks(labId, studentId, 2, "timelySubission" );

      if (submit.success && updateMarks) {
        setSuccess(true);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setUploading(false);
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
            Upload your lab submission file
          </p>
        </div>
        
        <Button
          onClick={uploadFile}
          disabled={!file || uploading}
          className="w-full"
          variant="default"
        >
          {uploading ? (
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
          ) : (
            <FileUp className="w-4 h-4 mr-2" />
          )}
          {uploading ? "Uploading..." : "Submit File"}
        </Button>

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
            <AlertDescription>File submitted successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </div>
  );
}