'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncTaskToJira, syncTaskToGitHub } from '@/app/actions/sync'
import { extractMeetingTasks } from '@/app/actions/meeting'
import {
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  GitMerge,
  Kanban,
  FileText,
  User,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

interface ActionItem {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'SYNCED' | 'COMPLETED'
  assigneeName: string | null
  assigneeEmail: string | null
  dueDate: string | null
  integrationMapping: Array<{
    platform: 'JIRA' | 'GITHUB'
    externalId: string
    externalUrl: string
  }>
}

interface Summary {
  summaryText: string
  markdownDoc: string
}

interface MeetingDetailViewProps {
  meeting: {
    id: string
    workspaceId: string
    title: string
    description: string | null
    date: string
    rawTranscript: string
    duration: number | null
  }
  summary: Summary | null
  actionItems: ActionItem[]
}

export default function MeetingDetailView({ meeting, summary, actionItems }: MeetingDetailViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'tasks' | 'docs' | 'transcript'>('tasks')
  const [extracting, setExtracting] = useState(false)
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null)
  const [syncPlatform, setSyncPlatform] = useState<'JIRA' | 'GITHUB' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExtract = async () => {
    setExtracting(true)
    setMessage(null)
    try {
      const res = await extractMeetingTasks(meeting.id, meeting.workspaceId)
      if (res.success) {
        setMessage({ type: 'success', text: 'Transcript processed successfully! Tasks and project specifications have been updated.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || 'Transcript processing failed.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred during analysis.' })
    } finally {
      setExtracting(false)
    }
  }

  const handleSync = async (itemId: string, platform: 'JIRA' | 'GITHUB') => {
    setSyncingItemId(itemId)
    setSyncPlatform(platform)
    setMessage(null)

    try {
      const res = platform === 'JIRA' 
        ? await syncTaskToJira(itemId, meeting.workspaceId)
        : await syncTaskToGitHub(itemId, meeting.workspaceId)

      if (res.success) {
        setMessage({
          type: 'success',
          text: `Task successfully synced with ${platform === 'JIRA' ? 'Jira' : 'GitHub'} (Key/Issue: ${res.externalId})!`,
        })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || `Sync to ${platform} failed.` })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected sync error occurred.' })
    } finally {
      setSyncingItemId(null)
      setSyncPlatform(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'MEDIUM':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'LOW':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  // Find mapping helpers
  const getMappingForPlatform = (item: ActionItem, platform: 'JIRA' | 'GITHUB') => {
    return item.integrationMapping.find((m) => m.platform === platform)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass rounded-2xl p-6 md:p-8 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{meeting.title}</h1>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">{meeting.description || 'No description added.'}</p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xxs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(meeting.date).toLocaleDateString()}
              </span>
              {meeting.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {meeting.duration} minutes
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-[0.99]"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Transcript...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {summary ? 'Reprocess Transcript' : 'Process Transcript'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global alert messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-medium animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-500/5 border-green-500/20 text-green-400'
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-900 gap-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === 'tasks' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Action Items ({actionItems.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === 'docs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Specifications
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`pb-3 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === 'transcript' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Raw Transcript
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* PANEL: ACTION ITEMS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-fade-in">
            {actionItems.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-gray-800">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">No action items found</h3>
                <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto leading-relaxed">
                  Process the transcript using the action bar above to extract action items.
                </p>
                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-600/50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {extracting ? 'Processing...' : 'Process Transcript Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {actionItems.map((item) => {
                  const jiraMapping = getMappingForPlatform(item, 'JIRA')
                  const githubMapping = getMappingForPlatform(item, 'GITHUB')

                  return (
                    <div
                      key={item.id}
                      className="glass-card rounded-2xl p-5 md:p-6 border border-gray-850 hover:border-gray-800 transition-colors flex flex-col md:flex-row justify-between gap-6"
                    >
                      <div className="space-y-3 min-w-0">
                        {/* Task Title & Badges */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-bold text-white text-sm md:text-base tracking-tight leading-snug">{item.title}</h3>
                          <span
                            className={`px-2 py-0.5 border rounded-md text-xxs font-bold uppercase tracking-wider ${getPriorityColor(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        {/* Task description */}
                        <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>

                        {/* Task assignees and deadlines info */}
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xxs font-semibold text-gray-500">
                          {item.assigneeName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              Assignee: {item.assigneeName}
                            </span>
                          )}
                          {item.dueDate && (
                            <span>Due Date: {new Date(item.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Sync triggers */}
                      <div className="flex flex-row md:flex-col justify-end gap-3.5 border-t md:border-t-0 pt-4 md:pt-0 border-gray-900 flex-shrink-0 self-end md:self-center">
                        {/* Jira button */}
                        {jiraMapping ? (
                          <a
                            href={jiraMapping.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xxs font-bold transition-all"
                          >
                            <Kanban className="w-3.5 h-3.5" />
                            Jira: {jiraMapping.externalId}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleSync(item.id, 'JIRA')}
                            disabled={syncingItemId !== null}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:text-white text-gray-300 disabled:opacity-50 rounded-xl text-xxs font-bold transition-all cursor-pointer"
                          >
                            {syncingItemId === item.id && syncPlatform === 'JIRA' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Kanban className="w-3.5 h-3.5 text-gray-500" />
                            )}
                            Sync to Jira
                          </button>
                        )}

                        {/* GitHub button */}
                        {githubMapping ? (
                          <a
                            href={githubMapping.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700/80 text-gray-300 border border-gray-700 rounded-xl text-xxs font-bold transition-all"
                          >
                            <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
                            GH Issue #{githubMapping.externalId}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleSync(item.id, 'GITHUB')}
                            disabled={syncingItemId !== null}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:text-white text-gray-300 disabled:opacity-50 rounded-xl text-xxs font-bold transition-all cursor-pointer"
                          >
                            {syncingItemId === item.id && syncPlatform === 'GITHUB' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <GitMerge className="w-3.5 h-3.5 text-gray-500" />
                            )}
                            Sync to GitHub
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL: DOCUMENTATION */}
        {activeTab === 'docs' && (
          <div className="animate-fade-in space-y-4">
            {!summary ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-gray-800">
                <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">No specifications generated</h3>
                <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto leading-relaxed">
                  Process the transcript to automatically generate project specifications and architectural documents.
                </p>
                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-600/50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {extracting ? 'Processing...' : 'Process Transcript'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Executive Summary panel */}
                <div className="lg:col-span-1 glass-card rounded-2xl p-5 border border-gray-850 h-fit space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Executive Summary</h3>
                  <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
                    {summary.summaryText.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>

                {/* Markdown document rendering */}
                <div className="lg:col-span-3 glass-card rounded-2xl p-6 md:p-8 border border-gray-850">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">Generated System Spec / PRD</h3>
                  <article className="prose prose-invert prose-xs max-w-none text-gray-300 leading-relaxed space-y-4 font-sans whitespace-pre-wrap">
                    {summary.markdownDoc}
                  </article>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL: RAW TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-gray-850 animate-fade-in">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Transcript Content</h3>
            <div className="bg-gray-950/80 border border-gray-900 rounded-xl p-5 max-h-[500px] overflow-y-auto leading-relaxed text-xs text-gray-400 font-mono whitespace-pre-wrap">
              {meeting.rawTranscript}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
