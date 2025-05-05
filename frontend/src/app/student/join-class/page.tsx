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
import { joinClass } from "@/app/actions/joinClass";
import { fetchUser, User } from "@/app/actions/users";
import { useRouter } from "next/navigation";


export default function JoinClass() {
  const [classCode, setClassCode] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [classDetails, setClassDetails] = useState<Subject | null>(null);
  const [teacherDetails, setTeacherDetails] = useState<User | null>(null);
  const router = useRouter();

  const handleJoinClick = async () => {
    if (!classCode.trim()) return;
    
    const res: SubjectResponse = await fetchClassDetails(Number(classCode.trim()));
    
    if (!res.success) {
      setClassDetails(null);
      setShowConfirm(false);
    } else {
      setClassDetails(res.response || null);
      const user = await fetchUser(res.response?.teacherId || "");
      if (user.success) {
        setTeacherDetails(user.user || null);
      }
      setShowConfirm(true);
      setMessage("");
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setClassCode("");
    setClassDetails(null);
   const res = await joinClass(
     classDetails?.classCode || 0,
     sessionStorage.getItem("regno") || ""
   );
   if (res.success) {
    console.log("Joined class");
    router.push("/student")
   }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-12">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Join a Class</h1>
        <Input
          placeholder="Enter class code"
          type="number"
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
            <p>Class teacher: <span className="font-semibold">{teacherDetails?.name}</span></p>
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
