"use client";

import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import BreadCrumbs from "../components/breadcrumbs";
import { usePathname } from "next/navigation";
import { getAllClasses } from "@/app/actions/fetchClassDetails";

function getFormattedTime(date = new Date()) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

interface SubjectData {
  name: string;
  id: number;
}

function populateData(dbResponse: any[]) {
  const batches = new Set<string>();
  const years = new Set<number>();
  const subjects: SubjectData[] = [];

  dbResponse.forEach((element: any) => {
    if (element.class) {
      batches.add(element.class);
    }
    if (element.batch) {
      years.add(element.batch);
    }
    if (element.name && element.classCode) {
      // Avoid duplicate subjects
      if (!subjects.some((s) => s.id === element.classCode)) {
        subjects.push({ name: element.name, id: element.classCode });
      }
    }
  });

  return {
    batches: Array.from(batches).sort((a, b) => a.localeCompare(b)),
    years: Array.from(years).sort((a, b) => b - a),
    subjects,
  };
}

export default function AdminDashboard() {
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const teacher =
    typeof window !== "undefined" ? sessionStorage.getItem("teacher") : null;
  const name =
    typeof window !== "undefined" ? sessionStorage.getItem("name") : "";

  useEffect(() => {
    getAllClasses(sessionStorage.getItem("regno") || "0").then((data) => {
      const populated = populateData(data);
      setClasses(data);
      setBatches(populated.batches);
      setYears(populated.years);
      setSubjects(populated.subjects);
      setLoading(false);
    });
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects
      .filter((subj) => {
        const classItem = classes.find((c) => c.classCode === subj.id);
        if (!classItem) return false;
        const batchMatch =
          selectedBatch === "all" || classItem.class === selectedBatch;
        const yearMatch =
          selectedYear === "all" || classItem.batch === Number(selectedYear);
        return batchMatch && yearMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, classes, selectedBatch, selectedYear]);

  if (!teacher) redirect("/login");
  if (teacher === "no") redirect("/student");
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading...
      </div>
    );

  const assignedItems = [
    "Task 1",
    "Task 2: Review Report",
    "Task 3: Meeting Prep",
  ];

  return (
    <div className="p-12">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-4xl">Welcome {name}</h1>
        <h1 className="font-bold text-2xl">{getFormattedTime()}</h1>
      </div>

      {BreadCrumbs(usePathname())}

      <div className="my-5 bg-gray-100 p-8 rounded-sm">
        <h1 className="font-bold text-2xl mb-4">Assigned</h1>
        {assignedItems && assignedItems.length > 0 ? (
          <div className="space-y-3">
            {assignedItems.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-card border rounded-md shadow-sm"
              >
                <p className="text-card-foreground">
                  {typeof item === "string" ? item : JSON.stringify(item)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 bg-muted rounded-md">
            <p className="text-muted-foreground">No assigned tasks yet.</p>
          </div>
        )}
      </div>

      <div className="py-8 flex flex-col gap-4">
        <h1 className="font-bold text-2xl">Subjects</h1>
        {/* Batch (Class) Selector */}
        <div className="p-1 bg-muted rounded-lg flex items-center gap-1 sm:gap-2 w-fit">
          <Button
            variant="ghost"
            className={cn(
              "px-3 py-1 h-auto text-sm sm:text-base",
              selectedBatch === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
            onClick={() => setSelectedBatch("all")}
          >
            All
          </Button>
          {batches.map((batch) => (
            <Button
              key={batch}
              variant="ghost"
              className={cn(
                "px-3 py-1 h-auto text-sm sm:text-base",
                selectedBatch === batch
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              onClick={() => setSelectedBatch(batch)}
            >
              {batch}
            </Button>
          ))}
        </div>
        {/* Year Selector */}
        <div className="p-1 bg-muted rounded-lg flex items-center gap-1 sm:gap-2 w-fit">
          <Button
            variant="ghost"
            className={cn(
              "px-3 py-1 h-auto text-sm sm:text-base",
              selectedYear === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
            onClick={() => setSelectedYear("all")}
          >
            All
          </Button>
          {years.map((year) => (
            <Button
              key={year}
              variant="ghost"
              className={cn(
                "px-3 py-1 h-auto text-sm sm:text-base",
                selectedYear === String(year)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              onClick={() => setSelectedYear(String(year))}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <div className="text-lg font-semibold mb-4">Subjects</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <a href="/admin/create-class">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex items-center justify-center text-center p-4 h-28 w-full min-w-[120px] sm:min-w-[140px] min-h-[112px] sm:min-h-[112px]">
                <span className="text-4xl text-muted-foreground">+</span>
              </CardContent>
            </Card>
          </a>
          {filteredSubjects.map((subj) => (
						<a href={`/admin/class/${subj.id}`}> 
							<Card
								key={subj.id}
								className="cursor-pointer hover:shadow-lg transition-shadow"
							>
								<CardContent className="flex items-center justify-center text-center p-4 h-28 w-full min-w-[120px] sm:min-w-[140px] min-h-[112px] sm:min-h-[112px] text-lg sm:text-xl font-medium break-words">
									{subj.name}
								</CardContent>
							</Card>
						</a>
          ))}
        </div>
      </div>
    </div>
  );
}
