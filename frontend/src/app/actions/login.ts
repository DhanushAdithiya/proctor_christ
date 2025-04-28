"use server";

import { prisma } from "@/lib/prisma";

export async function loginUser(_: any, formData: FormData) {
  const registerNumber = formData.get("register");
  const password = formData.get("password");

  if (!registerNumber || !password) {
    return { error: "Both fields are required" };
  }

  const user = await prisma.user.findUnique({
    where: {
			registerNumber: String(registerNumber)
    },
  });

  if (!user || user.password !== password) {
    return { error: "Invalid credentials" };
  }

  return {
    success: true,
    isAdmin: user.teacher,
		register: user.registerNumber,
		name: user.name,
  };
}
