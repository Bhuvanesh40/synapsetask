import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import db from '@/lib/db'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Set fallback secrets for build-time compilation if missing on Vercel
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'build-time-placeholder-secret-must-be-32-chars-long'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }
        }

        return null
      },
    }),
  ],
})
