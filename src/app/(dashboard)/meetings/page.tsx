import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getActiveWorkspace } from '@/services/active-workspace'
import { getWorkspaceMeetings } from '@/app/actions/meeting'
import { Calendar, Clock, ArrowRight, Video, FileText, Sparkles, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/login')
  }

  const workspace = await getActiveWorkspace()
  if (!workspace) {
    redirect('/dashboard')
  }

  const meetingsResult = await getWorkspaceMeetings(workspace.id)
  const meetings = meetingsResult.meetings || []

  return (
    <div className="space-y-8">
      {/* Top Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Meetings</h1>
          <p className="text-gray-400 text-xs mt-1">
            Manage your audio recordings and past transcripts in {workspace.name}.
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Transcript
        </Link>
      </div>

      {/* Main List */}
      {meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 glass border border-dashed border-gray-800 rounded-2xl min-h-[50vh] text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 mb-4">
            <Video className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No meetings added yet</h2>
          <p className="text-gray-400 text-xs mb-6 max-w-xs leading-relaxed">
            Upload raw transcripts or paste conversation text to start extracting action items with AI.
          </p>
          <Link
            href="/meetings/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Create Meeting Transcript
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting: any) => (
            <div
              key={meeting.id}
              className="glass-card rounded-2xl p-6 border border-gray-800/80 flex flex-col justify-between hover:border-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div>
                {/* Top Badge Meta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xxs font-semibold text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(meeting.date).toLocaleDateString()}
                  </div>
                  {meeting.duration && (
                    <div className="flex items-center gap-1.5 text-xxs font-semibold text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {meeting.duration}m
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white leading-tight mb-2 truncate-2-lines">
                  {meeting.title}
                </h3>
                
                {/* Description Snippet */}
                <p className="text-xs text-gray-400 leading-relaxed truncate-3-lines mb-6">
                  {meeting.description || 'No description provided.'}
                </p>
              </div>

              {/* Action and task status footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-900/60 mt-auto">
                <div className="flex items-center gap-1.5 text-xxs text-indigo-400 font-bold bg-indigo-500/5 px-2.5 py-1 border border-indigo-500/10 rounded-md">
                  <Sparkles className="w-3 h-3 text-indigo-400 fill-indigo-400/20" />
                  {meeting._count.actionItems} tasks
                </div>
                
                <Link
                  href={`/meetings/${meeting.id}`}
                  className="flex items-center gap-1 text-xs font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
