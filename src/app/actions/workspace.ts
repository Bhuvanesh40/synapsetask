'use server'

import { auth } from '@/auth'
import db from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'

const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters.'),
})

/**
 * Creates a new workspace and registers the active user as an ADMIN.
 */
export async function createWorkspace(formData: z.infer<typeof CreateWorkspaceSchema>) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized: Please log in to create a workspace.' }
  }

  const validatedFields = CreateWorkspaceSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues[0].message }
  }

  const { name } = validatedFields.data
  const userId = session.user.id

  try {
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const existing = await db.workspace.findUnique({
      where: { slug },
    })

    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
    }

    const workspace = await db.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
    })

    return { success: true, workspaceId: workspace.id }
  } catch (error: any) {
    console.error('Create Workspace Exception:', error)
    return { success: false, error: 'Failed to create workspace. Please try again.' }
  }
}

/**
 * Retrieves all workspaces the current user is a member of.
 */
export async function getUserWorkspaces() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized.', workspaces: [] }
  }

  try {
    const workspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, workspaces }
  } catch (error) {
    console.error('Fetch Workspaces Exception:', error)
    return { success: false, error: 'Failed to load workspaces.', workspaces: [] }
  }
}

/**
 * Switches the active workspace by setting a cookie.
 */
export async function switchWorkspaceAction(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_workspace_id', workspaceId, { path: '/' })
  return { success: true }
}
