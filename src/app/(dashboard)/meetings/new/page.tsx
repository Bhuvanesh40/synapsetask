'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createMeeting } from '@/app/actions/meeting'
import { ArrowLeft, Loader2, UploadCloud, Zap } from 'lucide-react'

export default function NewMeetingPage() {
  const router = useRouter()
  const [workspaceId, setWorkspaceId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('30')
  const [rawTranscript, setRawTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // We read the active workspace from cookie dynamically
  // Since this is a client component, we can use document.cookie to find active_workspace_id
  const getActiveWorkspaceId = () => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(^| )active_workspace_id=([^;]+)'))
    return match ? match[2] : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const currentWorkspaceId = getActiveWorkspaceId()
    if (!currentWorkspaceId) {
      setError('Active workspace is not resolved. Please select or reload your workspace.')
      setLoading(false)
      return
    }

    try {
      const res = await createMeeting({
        workspaceId: currentWorkspaceId,
        title,
        description,
        date,
        rawTranscript,
        duration: duration ? parseInt(duration, 10) : undefined,
      })

      if (res.success && res.meetingId) {
        router.push(`/meetings/${res.meetingId}`)
      } else {
        setError(res.error || 'Failed to save meeting.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill transcript template for testing
  const loadTemplate = () => {
    const template = `[00:01] Sarah: Let's align on the Next.js database sync layout. We need to connect Prisma to our Neon serverless database. Dave, can you take care of setting up the schemas?
[00:25] Dave: Yeah, I'll do that by Wednesday. We'll need a User, Account, Workspace, Meeting and ActionItem models. I'll make sure they support multi-tenancy correctly.
[00:45] Sarah: Great. We also need to implement AES-256 token encryption for Jira and GitHub. I'll take that on myself. We should have that ready in a couple of days.
[01:10] Dave: Perfect. What about the frontend dashboard design? We want a nice dark mode theme with glassmorphic cards and a workspace switcher.
[01:30] Sarah: I can design the UI shell. Let's make sure it supports responsive grids and Lucide icons. I'll implement this by next Monday.
[02:00] Dave: Excellent. Let's make sure all server actions validate workspace membership to isolate data.`
    setRawTranscript(template)
    setTitle('Database Schema & AI Dashboard Sync Sync-up')
    setDescription('Technical alignment meeting regarding Neon database schemas, token encryption, and dashboard client pages.')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">New Meeting Transcript</h1>
          <p className="text-gray-400 text-xs mt-1">
            Input meeting conversation dialogs to automatically isolate engineering tasks.
          </p>
        </div>
        <button
          onClick={loadTemplate}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 rounded-lg text-xxs font-bold transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          Load Demo Transcript
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 border border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Meeting Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product sync, Planning..."
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of meeting purpose (optional)"
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="transcript" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Transcript Text
            </label>
            <textarea
              id="transcript"
              required
              rows={10}
              value={rawTranscript}
              onChange={(e) => setRawTranscript(e.target.value)}
              placeholder="Paste raw conversation transcript here. Format:
Sarah: We need to build the auth page...
Dave: I'll setup the DB adapters..."
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-650 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono transition-all resize-y leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Saving transcript...
              </>
            ) : (
              <>
                <UploadCloud className="w-4.5 h-4.5" />
                Save Meeting & Analyze
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
