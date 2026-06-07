import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import db from '@/lib/db'
import { authConfig } from './auth.config'

// Set fallback secrets for build-time compilation if missing on Vercel
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'build-time-placeholder-secret-must-be-32-chars-long'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
})
