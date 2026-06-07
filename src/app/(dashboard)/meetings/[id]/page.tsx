import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import db from '@/lib/db'
import { checkMeetingAccess } from '@/services/workspace'
import MeetingDetailView from '@/components/meetings/MeetingDetailView'

interface MeetingPageProps {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic'

export default async function MeetingDetailPage({ params }: MeetingPageProps) {
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect('/login')
  }

  const meetingId = params.id
  const userId = session.user.id

  // 1. Check if the user is member of the workspace owning the meeting
  const hasAccess = await checkMeetingAccess(userId, meetingId)
  if (!hasAccess) {
    notFound()
  }

  // 2. Fetch the meeting, summaries, action items and mapping links
  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    include: {
      actionItems: {
        include: {
          integrationMapping: {
            select: {
              platform: true,
              externalId: true,
              externalUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      summaries: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!meeting) {
    notFound()
  }

  // 3. Serialize data for Client Components
  const serializedMeeting = {
    id: meeting.id,
    workspaceId: meeting.workspaceId,
    title: meeting.title,
    description: meeting.description,
    date: meeting.date.toISOString(),
    rawTranscript: meeting.rawTranscript,
    duration: meeting.duration,
  }

  const serializedSummary = meeting.summaries.length > 0 
    ? {
        summaryText: meeting.summaries[0].summaryText,
        markdownDoc: meeting.summaries[0].markdownDoc,
      }
    : null

  const serializedActionItems = meeting.actionItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: item.status,
    assigneeName: item.assigneeName,
    assigneeEmail: item.assigneeEmail,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    integrationMapping: item.integrationMapping,
  }))

  return (
    <MeetingDetailView
      meeting={serializedMeeting}
      summary={serializedSummary}
      actionItems={serializedActionItems}
    />
  )
}
