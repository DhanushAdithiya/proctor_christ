"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchClassDetails, SubjectResponse } from "@/app/actions/fetchClassDetails";
import { Subject } from "@/app/actions/createSubject";
import { cn } from "@/lib/utils";

export default function JoinClass() {
  const [classCode, setClassCode] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [classDetails, setClassDetails] = useState<Subject | null>(null);

  const handleJoinClick = async () => {
    if (!classCode.trim()) return;
    
    const res: SubjectResponse = await fetchClassDetails(Number(classCode.trim()));
    
    if (!res.success) {
      setMessage("Class not found");
      setClassDetails(null);
      setShowConfirm(false);
    } else {
      setClassDetails(res.response);
      setShowConfirm(true);
      setMessage("");
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    // Handle actual join logic here
    if (classDetails) {
      alert(`Joined class: ${classDetails.name}`);
    }
    setClassCode("");
    setClassDetails(null);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-12">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Join a Class</h1>
        <Input
          placeholder="Enter class code"
          value={classCode}
          onChange={(e) => {
            setClassCode(e.target.value);
            setMessage(""); // Clear message when typing
          }}
          className="text-lg"
        />
        <Button
          className="w-full mt-4"
          onClick={handleJoinClick}
          disabled={!classCode.trim()}
        >
          Join Class
        </Button>
        {message && (
          <p className={cn("mt-2 text-sm text-red-500")}>
            {message}
          </p>
        )}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm to join {classDetails?.name}?
            </DialogTitle>
          </DialogHeader>
          <div className="text-gray-700 mb-4 space-y-2">
            <p>Class code: <span className="font-semibold">{classCode}</span></p>
            <p>Class teacher: <span className="font-semibold">{classDetails?.teacher}</span></p>
            {/* TODO: FETCH TEACHER NAME */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
