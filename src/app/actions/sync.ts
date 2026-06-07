'use server'

import { auth } from '@/auth'
import db from '@/lib/db'
import { z } from 'zod'
import { ensureWorkspaceAccess, ensureActionItemAccess } from '@/services/workspace'
import { syncToJira, syncToGitHub } from '@/services/sync'
import { encrypt } from '@/lib/crypto'
import { IntegrationPlatform } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const SaveIntegrationSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required.'),
  platform: z.enum(['JIRA', 'GITHUB']),
  token: z.string().min(1, 'Token or API Key is required.'),
  config: z.string().refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, 'Configuration must be a valid JSON string.'),
})

/**
 * Saves or updates workspace credentials for Jira/GitHub.
 */
export async function saveWorkspaceIntegration(formData: z.infer<typeof SaveIntegrationSchema>) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  const validatedFields = SaveIntegrationSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues[0].message }
  }

  const { workspaceId, platform, token, config } = validatedFields.data
  const userId = session.user.id

  try {
    // 1. Authorize workspace access
    await ensureWorkspaceAccess(userId, workspaceId)

    // 2. Encrypt token
    const encryptedToken = encrypt(token)

    // 3. Save integration details
    await db.workspaceIntegration.upsert({
      where: {
        workspaceId_platform: {
          workspaceId,
          platform: platform as IntegrationPlatform,
        },
      },
      create: {
        workspaceId,
        platform: platform as IntegrationPlatform,
        encryptedToken,
        config,
        isActive: true,
      },
      update: {
        encryptedToken,
        config,
        isActive: true,
      },
    })

    revalidatePath(`/dashboard/integrations`)
    return { success: true }
  } catch (error: any) {
    console.error('Save Integration Action Exception:', error)
    return { success: false, error: error.message || 'Failed to save integration settings.' }
  }
}

/**
 * Disables a workspace integration.
 */
export async function deleteWorkspaceIntegration(workspaceId: string, platform: 'JIRA' | 'GITHUB') {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized.' }
  }

  try {
    await ensureWorkspaceAccess(session.user.id, workspaceId)

    await db.workspaceIntegration.delete({
      where: {
        workspaceId_platform: {
          workspaceId,
          platform: platform as IntegrationPlatform,
        },
      },
    })

    revalidatePath(`/dashboard/integrations`)
    return { success: true }
  } catch (error: any) {
    console.error('Delete Integration Action Exception:', error)
    return { success: false, error: error.message || 'Failed to delete integration.' }
  }
}

interface SyncResult {
  success: boolean
  externalId?: string
  externalUrl?: string
  error?: string
}

/**
 * Pushes an action item to Jira.
 */
export async function syncTaskToJira(actionItemId: string, workspaceId: string): Promise<SyncResult> {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  try {
    await ensureWorkspaceAccess(session.user.id, workspaceId)
    await ensureActionItemAccess(session.user.id, actionItemId)

    const result = await syncToJira(actionItemId, workspaceId)
    
    if (result.success) {
      // Revalidate parent meeting view
      const actionItem = await db.actionItem.findUnique({
        where: { id: actionItemId },
        select: { meetingId: true },
      })
      if (actionItem) {
        revalidatePath(`/meetings/${actionItem.meetingId}`)
      }
    }

    return result
  } catch (error: any) {
    console.error('Jira Sync Action Exception:', error)
    return { success: false, error: error.message || 'Failed to sync with Jira.' }
  }
}

/**
 * Pushes an action item to GitHub.
 */
export async function syncTaskToGitHub(actionItemId: string, workspaceId: string): Promise<SyncResult> {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  try {
    await ensureWorkspaceAccess(session.user.id, workspaceId)
    await ensureActionItemAccess(session.user.id, actionItemId)

    const result = await syncToGitHub(actionItemId, workspaceId)

    if (result.success) {
      const actionItem = await db.actionItem.findUnique({
        where: { id: actionItemId },
        select: { meetingId: true },
      })
      if (actionItem) {
        revalidatePath(`/meetings/${actionItem.meetingId}`)
      }
    }

    return result
  } catch (error: any) {
    console.error('GitHub Sync Action Exception:', error)
    return { success: false, error: error.message || 'Failed to sync with GitHub.' }
  }
}

/**
 * Fetches configured integrations for a workspace, omitting the secret encrypted tokens.
 */
export async function getWorkspaceIntegrations(workspaceId: string) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized.', integrations: [] }
  }

  try {
    await ensureWorkspaceAccess(session.user.id, workspaceId)

    const integrations = await db.workspaceIntegration.findMany({
      where: { workspaceId },
      select: {
        id: true,
        platform: true,
        config: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return { success: true, integrations }
  } catch (error: any) {
    console.error('Get Integrations Exception:', error)
    return { success: false, error: error.message || 'Failed to load integrations.', integrations: [] }
  }
}
