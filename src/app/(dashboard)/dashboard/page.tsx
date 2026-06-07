import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import db from '@/lib/db'
import { getActiveWorkspace } from '@/services/active-workspace'
import { FileText, CheckCircle2, Zap, ArrowRight, Upload, GitMerge, Kanban } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/login')
  }

  const workspace = await getActiveWorkspace()
  if (!workspace) {
    // Render state where there is no workspace
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">No Workspace Found</h2>
        <p className="text-gray-400 mb-6 max-w-sm">Create a workspace to start analyzing meetings and extracting tasks.</p>
      </div>
    )
  }

  // Fetch metrics in database
  const [totalMeetings, totalTasks, syncedTasks, completedTasks, recentMeetings] = await Promise.all([
    db.meeting.count({
      where: { workspaceId: workspace.id },
    }),
    db.actionItem.count({
      where: { meeting: { workspaceId: workspace.id } },
    }),
    db.actionItem.count({
      where: {
        meeting: { workspaceId: workspace.id },
        status: 'SYNCED',
      },
    }),
    db.actionItem.count({
      where: {
        meeting: { workspaceId: workspace.id },
        status: 'COMPLETED',
      },
    }),
    db.meeting.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { date: 'desc' },
      take: 3,
      include: {
        _count: {
          select: { actionItems: true },
        },
      },
    }),
  ])

  // Calculate percentages
  const syncRate = totalTasks > 0 ? Math.round((syncedTasks / totalTasks) * 100) : 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-10">
      {/* Header welcome banner */}
      <div className="relative rounded-2xl overflow-hidden glass border border-indigo-500/10 p-8 glow-indigo">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome to <span className="text-gradient">{workspace.name}</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Convert your spoken meeting transcripts into clear, trackable engineering backlogs. Automatically extract tasks and synchronize them with GitHub and Jira.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Transcript
            </Link>
            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Configure Sync
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Meetings */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Meetings</span>
            <div className="p-2 rounded-lg bg-gray-850 text-gray-400 border border-gray-800">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white">{totalMeetings}</span>
          <p className="text-xxs text-gray-500 mt-2">Analyzed audio, video and transcript files</p>
        </div>

        {/* Action Items */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Action Items</span>
            <div className="p-2 rounded-lg bg-gray-850 text-indigo-400 border border-indigo-500/10">
              <Zap className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white">{totalTasks}</span>
          <p className="text-xxs text-gray-500 mt-2">Automated engineering tasks</p>
        </div>

        {/* Ecosystem Sync Rate */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ecosystem Sync</span>
            <div className="p-2 rounded-lg bg-gray-850 text-green-400 border border-green-500/10">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{syncedTasks}</span>
            <span className="text-xs text-green-400 font-medium">({syncRate}%)</span>
          </div>
          <p className="text-xxs text-gray-500 mt-2">Pushed to Jira or GitHub repositories</p>
        </div>

        {/* Task Completion Rate */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 rounded-lg bg-gray-850 text-purple-400 border border-purple-500/10">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{completedTasks}</span>
            <span className="text-xs text-purple-400 font-medium">({completionRate}%)</span>
          </div>
          <p className="text-xxs text-gray-500 mt-2">Marked completed or closed externally</p>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Meetings list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Meetings</h2>
            <Link
              href="/meetings"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMeetings.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center border border-dashed border-gray-800">
                <p className="text-sm text-gray-400 mb-2">No meetings created yet.</p>
                <Link href="/meetings/new" className="text-xs font-semibold text-indigo-400 hover:underline">
                  Add your first transcript
                </Link>
              </div>
            ) : (
              recentMeetings.map((mt) => (
                <Link
                  key={mt.id}
                  href={`/meetings/${mt.id}`}
                  className="block glass-card rounded-2xl p-5 hover:bg-gray-900/50 border border-gray-800 hover:border-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{mt.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {mt.date.toLocaleDateString()} {mt.duration ? `• ${mt.duration} mins` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xxs font-semibold">
                        {mt._count.actionItems} tasks
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Integration Integrals status */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Ecosystem Sync Status</h2>
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-gray-800">
            {/* Jira Connection Status */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-gray-950/40 border border-gray-900">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Kanban className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Atlassian Jira</h4>
                  <p className="text-xxs text-gray-400 mt-0.5">Map to Jira software boards</p>
                </div>
              </div>
              <Link
                href="/dashboard/integrations"
                className="text-xxs font-semibold text-indigo-400 hover:underline pt-0.5"
              >
                Manage
              </Link>
            </div>

            {/* GitHub Connection Status */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-gray-950/40 border border-gray-900">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-300 flex-shrink-0">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">GitHub Issues</h4>
                  <p className="text-xxs text-gray-400 mt-0.5">Push issue tracker tickets</p>
                </div>
              </div>
              <Link
                href="/dashboard/integrations"
                className="text-xxs font-semibold text-indigo-400 hover:underline pt-0.5"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
