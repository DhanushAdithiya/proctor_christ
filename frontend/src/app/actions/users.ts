"use server";

import { prisma } from "@/lib/prisma";

export interface User {
    registerNumber: string;
    name: string;
    role: string;
}


export async function fetchUser(regno: string): Promise<{success: boolean, user?: User, message?: string}> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        registerNumber: regno,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("An error occurred while fetching user", error);
    return {
      success: false,
      message: "An error occurred while fetching user",
    };
  }
}
