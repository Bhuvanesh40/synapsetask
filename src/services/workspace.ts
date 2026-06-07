import db from '@/lib/db'

/**
 * Checks if a user has access to a specific workspace.
 */
export async function checkWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  if (!userId || !workspaceId) return false

  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })

  return !!membership
}

/**
 * Ensures a user has access to a workspace, otherwise throws an error.
 */
export async function ensureWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
  const hasAccess = await checkWorkspaceAccess(userId, workspaceId)
  if (!hasAccess) {
    throw new Error('Unauthorized: You do not have access to this workspace.')
  }
}

/**
 * Checks if a user has access to a specific meeting through their workspace membership.
 */
export async function checkMeetingAccess(userId: string, meetingId: string): Promise<boolean> {
  if (!userId || !meetingId) return false

  const meeting = await db.meeting.findFirst({
    where: {
      id: meetingId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    select: { id: true },
  })

  return !!meeting
}

/**
 * Ensures a user has access to a meeting, otherwise throws an error.
 */
export async function ensureMeetingAccess(userId: string, meetingId: string): Promise<void> {
  const hasAccess = await checkMeetingAccess(userId, meetingId)
  if (!hasAccess) {
    throw new Error('Unauthorized: You do not have access to this meeting.')
  }
}

/**
 * Checks if a user has access to an action item through workspace membership.
 */
export async function checkActionItemAccess(userId: string, actionItemId: string): Promise<boolean> {
  if (!userId || !actionItemId) return false

  const actionItem = await db.actionItem.findFirst({
    where: {
      id: actionItemId,
      meeting: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    select: { id: true },
  })

  return !!actionItem
}

/**
 * Ensures a user has access to an action item, otherwise throws an error.
 */
export async function ensureActionItemAccess(userId: string, actionItemId: string): Promise<void> {
  const hasAccess = await checkActionItemAccess(userId, actionItemId)
  if (!hasAccess) {
    throw new Error('Unauthorized: You do not have access to this action item.')
  }
}

/**
 * Retrieves the user's role in a workspace (e.g., ADMIN, MEMBER).
 */
export async function getWorkspaceRole(userId: string, workspaceId: string) {
  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: { role: true },
  })

  return membership?.role || null
}
