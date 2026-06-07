import { PrismaClient } from '@prisma/client'

// Set a fallback DATABASE_URL for build-time compilation if it's missing on Vercel
if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy?sslmode=require"
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const db = globalThis.prismaGlobal ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db
