import { SubjectData } from "@/app/admin/page";


export function getFormattedTime(date = new Date()) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}


export function populateData(dbResponse: any[]) {
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
      if (!subjects.some((s) => s.classCode === element.classCode)) {
        subjects.push({ name: element.name, classCode: element.classCode });
      }
    }
  });

  return {
    batches: Array.from(batches).sort((a, b) => a.localeCompare(b)),
    years: Array.from(years).sort((a, b) => b - a),
    subjects,
  };
}