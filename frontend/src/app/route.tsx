import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/validation/loginValidation'
import type { NextApiRequest, NextApiResponse } from 'next'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const { registerNumber, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { register: Number(registerNumber) },
  })

  if (!user || user.password !== Number(password)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  return res.status(200).json({ role: user.role }) // user.role = 'admin' or 'student'
}
