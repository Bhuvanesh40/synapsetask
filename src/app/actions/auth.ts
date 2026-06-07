'use server'

import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export async function registerUser(formData: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(formData)
  
  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    }
  }

  const { name, email, password } = validatedFields.data

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists.' }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Create user and a default workspace inside a transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })

      // Generate a clean slug
      let slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-workspace`
      
      // Handle slug conflicts
      const existingWorkspace = await tx.workspace.findUnique({
        where: { slug },
      })
      if (existingWorkspace) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
      }

      await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug,
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
        },
      })

      return user
    })

    return { success: true, userId: newUser.id }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { success: false, error: `Registration failed: ${error.message || error}` }
  }
}
