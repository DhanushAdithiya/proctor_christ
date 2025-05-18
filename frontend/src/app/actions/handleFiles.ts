"use sever";

import supabase from "@/lib/supabase";

export async function uploadFile(
  file: File,
  labName: string,
  subjectId: number,
  type: "instructions" | "additional"
): Promise<{url?: string, error?: string}> {
    // replace all spaces with dashes remove all special characters
    const renamedFile = new File(
      [file],
      `${subjectId}-${labName}-${type}-${file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`,
      { type: file.type }
    );

  const { data, error } = await supabase.storage
    .from("lab-instructions")
    .upload(`${subjectId}/${labName}/${type}/${renamedFile.name}`, renamedFile);

  if (error) {
    console.error("Error uploading file:", error);
    return { error: "Failed to upload file" };
  }

  const url =  supabase.storage.from("lab-instructions").getPublicUrl(data.path)

  return { url: url.data.publicUrl }

}

export async function deleteFile(
  file: string,
  labName: string,
  subjectId: number,
  type: "instructions" | "additional"
) {
  const { data, error } = await supabase.storage.from("lab-instructions").remove([`${subjectId}/${labName}/${type}/${file}`]);
  if (error) {
    console.error("Error deleting file:", error);
    return { error: "Failed to delete file" };
  }
  return { data };
}
