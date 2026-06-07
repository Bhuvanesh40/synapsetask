import { cookies } from 'next/headers'
import db from '@/lib/db'
import { auth } from '@/auth'

/**
 * Gets the active workspace for the logged-in session, using cookies with a fallback.
 */
export async function getActiveWorkspace() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return null
  }

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('active_workspace_id')?.value

  if (workspaceId) {
    // Validate that the user is actually a member of this workspace
    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
      include: {
        workspace: true,
      },
    })
    
    if (membership) {
      return membership.workspace
    }
  }

  // Fallback: Fetch the first workspace the user has access to
  const firstMembership = await db.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return firstMembership?.workspace || null
}
