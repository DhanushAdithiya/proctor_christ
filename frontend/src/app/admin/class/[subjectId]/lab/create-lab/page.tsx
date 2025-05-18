"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { UploadCloud, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFile, deleteFile } from "@/app/actions/handleFiles";
import { CreateLab, createLab } from "@/app/actions/labs";
import { useRouter } from "next/navigation";

export interface UploadedFile {
  name: string;
  url: string; // In a real app, this would be a URL (e.g., from cloud storage)
}
import { useParams } from "next/navigation";
import { date } from "zod";

export default function CreateLabPage() {
  const { subjectId } = useParams();
  const [labName, setLabName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState<{
    hours: string;
    minutes: string;
    ampm: string;
  }>({
    hours: "12",
    minutes: "00",
    ampm: "PM",
  });
  const [instructionFile, setInstructionFile] = useState<UploadedFile | null>(
    null
  );
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPastDue, setIsPastDue] = useState(false);

  const router = useRouter();

  const handleDateChange = (date: Date | undefined) => {
    setDueDate(date);
  };

  const handleTimeChange = (
    field: "hours" | "minutes" | "ampm",
    value: string
  ) => {
    setDueTime((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstructionFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const res = await uploadFile(
        file,
        labName,
        Number(subjectId),
        "instructions"
      );

      if (res.error) {
        setMessage(res.error);
        return;
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: res.url || ""
      };
      setInstructionFile(uploadedFile);
      setMessage(`Instruction file "${file.name}" uploaded.`);
    }
  };

  const handleAdditionalFilesChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = [];
      for (let file of files) {
        const res = await uploadFile(file, labName, Number(subjectId), "additional");

        if (res.error) {
          setMessage(res.error);
          return;
        }

        const uploadedFile: UploadedFile = {
          name: file.name,
          url: res.url || "",
        };
        newFiles.push(uploadedFile);
      }
      setAdditionalFiles([...additionalFiles, ...newFiles]);
      setMessage(`${newFiles.length} additional file(s) uploaded.`);
    }
  };

  const handleCreateLab = () => {
    if (dueDate) {
      const selectedDateTime = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
        parseInt(dueTime.hours) +
          (dueTime.ampm === "PM" && parseInt(dueTime.hours) !== 12 ? 12 : 0),
        parseInt(dueTime.minutes),
        0
      );

      if (selectedDateTime < new Date()) {
        setIsPastDue(true);
        return; // Stop lab creation if due date/time is in the past
      }
    }
    setIsDialogOpen(true);
  };

  const handleConfirmCreateLab = async () => {
    // Here, you would send the data to your backend.
    const finalDueDate = dueDate
      ? new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate(),
          parseInt(dueTime.hours) +
            (dueTime.ampm === "PM" && parseInt(dueTime.hours) !== 12 ? 12 : 0),
          parseInt(dueTime.minutes),
          0
        )
      : undefined;


      // TODO: Get the links for the files
      const lab: CreateLab = {
        name: labName,
        description,
        submissionDeadline: finalDueDate || new Date(),
        subjectId: Number(subjectId),
        creatorId: sessionStorage.getItem("regno") || "",
        files: [instructionFile?.url || "", ...additionalFiles.map((file) => file.url)],
      }

      console.log(lab)
      const res = await createLab(lab);
      if (res.success) {
        setMessage("Lab Created");
        router.push(`/admin/class/${subjectId}/lab/${res.id}`);
      } else {
        setMessage("Failed to create lab");
      }

    // Reset form
    setLabName("");
    setDescription("");
    setDueDate(undefined);
    setDueTime({ hours: "12", minutes: "00", ampm: "PM" });
    setInstructionFile(null);
    setAdditionalFiles([]);
    setIsDialogOpen(false);
    setMessage("Lab Created");
    setIsPastDue(false);
  };

  // TODO: This is not working
  const removeAdditionalFile = (index: number) => {
    // Optimistically remove the file from the UI
    const fileToRemove = additionalFiles[index];
    setAdditionalFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));

    // Call the deleteFile action
    if (fileToRemove?.name) {
      // We only pass the name, adjust as necessary for your backend
      deleteFile(fileToRemove.name, labName,  Number(subjectId), "additional")
        .then((res) => {
          if (res.error) {
            // If there's an error, revert the UI change and show a message
            setMessage(
              `Failed to delete ${fileToRemove.name}: ${res.error}`
            );
            setAdditionalFiles(additionalFiles); // Restore previous state
          } else {
            setMessage(`File "${fileToRemove.name}" deleted.`);
          }
        })
        .catch((error) => {
          setMessage(
            `Error deleting ${fileToRemove.name}: ${error.message}`
          );
          setAdditionalFiles(additionalFiles); // Restore previous state
        });
    }
  };

  // TODO: This is not working
  const removeInstructionFile = () => {
    if (instructionFile?.name) {
      deleteFile(instructionFile.name, labName, Number(subjectId), "instructions")
        .then((res) => {
          if (res.error) {
            setMessage(`Failed to delete ${instructionFile.name}: ${res.error}`);
          } else {
            setMessage(`Instruction File "${instructionFile.name}" deleted.`);
            setInstructionFile(null);
          }
        })
        .catch((error) => {
          setMessage(`Error deleting file: ${error.message}`);
        });
    }
    setInstructionFile(null);
  };

  useEffect(() => {
    setIsPastDue(false);
  }, [dueDate, dueTime]);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Lab</h1>

        <div className="space-y-6">
          <div>
            <Label
              htmlFor="labName"
              className="block text-sm font-medium text-gray-700"
            >
              Lab Name
            </Label>
            <Input
              id="labName"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="mt-1"
              placeholder="Enter lab name"
            />
          </div>

          <div>
            <Label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              placeholder="Enter lab description"
              rows={4}
            />
          </div>

          <div>
            <Label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700"
            >
              Due Date and Time
            </Label>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {dueDate ? (
                      format(dueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  {" "}
                  {/* Added bg-white here */}
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <Select
                  value={dueTime.hours}
                  onValueChange={(value) => handleTimeChange("hours", value)}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = (i + 1).toString().padStart(2, "0");
                      return (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span className="text-gray-500">:</span>
                <Select
                  value={dueTime.minutes}
                  onValueChange={(value) => handleTimeChange("minutes", value)}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((min) => (
                      <SelectItem key={min} value={min}>
                        {min}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={dueTime.ampm}
                  onValueChange={(value) => handleTimeChange("ampm", value)}
                >
                  <SelectTrigger className="w-[90px]">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isPastDue && (
              <p className="mt-2 text-sm text-red-500">
                Due date and time must be in the future.
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="instructionFile"
              className="block text-sm font-medium text-gray-700"
            >
              Instruction File
            </Label>
            <div className="mt-1 flex items-center gap-4">
              <Input
                id="instructionFile"
                type="file"
                onChange={handleInstructionFileChange}
                className="hidden"
                accept=".doc,.docx,.pdf" // Specify accepted file types
              />
              <label htmlFor="instructionFile">
                <Button variant="outline" asChild>
                  <div className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload File</span>
                  </div>
                </Button>
              </label>
              {instructionFile && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm text-gray-600 truncate max-w-[200px]"
                    title={instructionFile.name}
                  >
                    {instructionFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={removeInstructionFile}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label
              htmlFor="additionalFiles"
              className="block text-sm font-medium text-gray-700"
            >
              Additional Files
            </Label>
            <div className="mt-1">
              <Input
                id="additionalFiles"
                type="file"
                multiple
                onChange={handleAdditionalFilesChange}
                className="hidden"
                accept="*" // Allow any file type.  Restrict as needed.
              />
              <label htmlFor="additionalFiles">
                <Button variant="outline" asChild>
                  <div className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Files</span>
                  </div>
                </Button>
              </label>
            </div>
            {additionalFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">
                  Uploaded Files:
                </p>
                <ul className="list-disc list-inside">
                  {additionalFiles.map((file, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-center justify-between"
                    >
                      <span
                        className="truncate max-w-[200px]"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => removeAdditionalFile(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {message && <p className="mt-4 text-sm text-green-500">{message}</p>}
        <div className="mt-8">
          <Button
            onClick={handleCreateLab}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Lab
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Lab Creation</DialogTitle>
              <DialogDescription>
                Are you sure you want to create this lab?
                <div className="mt-4">
                  <p>
                    <span className="font-semibold">Lab Name:</span> {labName}
                  </p>
                  <p>
                    <span className="font-semibold">Description:</span>{" "}
                    {description}
                  </p>
                  <p>
                    <span className="font-semibold">Due Date:</span>{" "}
                    {dueDate
                      ? format(dueDate, "PPP") +
                        " " +
                        dueTime.hours +
                        ":" +
                        dueTime.minutes +
                        " " +
                        dueTime.ampm
                      : "No Due Date"}
                  </p>
                  <p>
                    <span className="font-semibold">Instruction File:</span>{" "}
                    {instructionFile?.name || "None"}
                  </p>
                  <p>
                    <span className="font-semibold">Additional Files:</span>{" "}
                    {additionalFiles.length > 0
                      ? additionalFiles.map((file) => file.name).join(", ")
                      : "None"}
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleConfirmCreateLab}>
                Create Lab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

