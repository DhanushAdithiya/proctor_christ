import { z } from "zod"

export const loginSchema = z.object({
  registerNumber: z
    .string()
    .regex(/^\d+$/, { message: "Register number must be numeric" })
    .min(5, { message: "Register number must be at least 5 digits" }),

  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export type LoginInput = z.infer<typeof loginSchema>
