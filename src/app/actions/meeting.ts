'use server'

import { auth } from '@/auth'
import db from '@/lib/db'
import { z } from 'zod'
import { ensureWorkspaceAccess, ensureMeetingAccess } from '@/services/workspace'
import { extractMeetingIntelligence } from '@/services/ai'
import { TaskStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const CreateMeetingSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required.'),
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  date: z.string().transform((val) => new Date(val)),
  rawTranscript: z.string().min(10, 'Transcript must contain at least 10 characters.'),
  duration: z.preprocess((val) => Number(val), z.number().int().positive().optional()),
})

/**
 * Creates a new meeting record.
 */
export async function createMeeting(formData: any) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  const validatedFields = CreateMeetingSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues[0].message }
  }

  const { workspaceId, title, description, date, rawTranscript, duration } = validatedFields.data
  const userId = session.user.id

  try {
    // 1. Authorize workspace access
    await ensureWorkspaceAccess(userId, workspaceId)

    // 2. Create meeting
    const meeting = await db.meeting.create({
      data: {
        workspaceId,
        title,
        description,
        date,
        rawTranscript,
        duration,
        createdById: userId,
      },
    })

    revalidatePath(`/meetings`)
    return { success: true, meetingId: meeting.id }
  } catch (error: any) {
    console.error('Create Meeting Exception:', error)
    return { success: false, error: error.message || 'Failed to save meeting.' }
  }
}

/**
 * Triggers AI task extraction and summary document building.
 */
export async function extractMeetingTasks(meetingId: string, workspaceId: string) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized.' }
  }

  const userId = session.user.id

  try {
    // 1. Authorize access
    await ensureWorkspaceAccess(userId, workspaceId)
    await ensureMeetingAccess(userId, meetingId)

    // 2. Fetch meeting
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
    })

    if (!meeting) {
      return { success: false, error: 'Meeting not found.' }
    }

    // 3. Run AI extraction
    const intelligence = await extractMeetingIntelligence(meeting.rawTranscript, meeting.date)

    // 4. Save results in transaction
    await db.$transaction(async (tx) => {
      // Upsert summary
      const existingSummary = await tx.summary.findFirst({
        where: { meetingId },
      })

      if (existingSummary) {
        await tx.summary.update({
          where: { id: existingSummary.id },
          data: {
            summaryText: intelligence.summaryText,
            markdownDoc: intelligence.markdownDoc,
          },
        })
      } else {
        await tx.summary.create({
          data: {
            meetingId,
            summaryText: intelligence.summaryText,
            markdownDoc: intelligence.markdownDoc,
          },
        })
      }

      // Delete ONLY pending action items to avoid losing external integration mappings
      await tx.actionItem.deleteMany({
        where: {
          meetingId,
          status: TaskStatus.PENDING,
        },
      })

      // Insert new action items
      if (intelligence.actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: intelligence.actionItems.map((item) => ({
            meetingId,
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: TaskStatus.PENDING,
            assigneeName: item.assigneeName,
            assigneeEmail: item.assigneeEmail,
            dueDate: item.dueDate,
          })),
        })
      }
    })

    revalidatePath(`/meetings/${meetingId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Extract Tasks Action Exception:', error)
    return { success: false, error: error.message || 'Failed to extract action items.' }
  }
}

/**
 * Fetches all meetings for a workspace.
 */
export async function getWorkspaceMeetings(workspaceId: string) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return { success: false, error: 'Unauthorized.', meetings: [] }
  }

  try {
    await ensureWorkspaceAccess(session.user.id, workspaceId)

    const meetings = await db.meeting.findMany({
      where: { workspaceId },
      orderBy: { date: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        _count: {
          select: { actionItems: true },
        },
      },
    })

    return { success: true, meetings }
  } catch (error: any) {
    console.error('Get Workspace Meetings Exception:', error)
    return { success: false, error: error.message || 'Failed to retrieve meetings.', meetings: [] }
  }
}
