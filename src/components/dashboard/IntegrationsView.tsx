'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorkspaceIntegration, deleteWorkspaceIntegration } from '@/app/actions/sync'
import { Kanban, GitMerge, CheckCircle, Trash2, Loader2, Save, HelpCircle } from 'lucide-react'

interface Integration {
  id: string
  platform: 'JIRA' | 'GITHUB'
  config: string | null
  isActive: boolean
  updatedAt: Date
}

interface IntegrationsViewProps {
  workspaceId: string
  integrations: Integration[]
}

export default function IntegrationsView({ workspaceId, integrations }: IntegrationsViewProps) {
  const router = useRouter()
  const [loadingPlatform, setLoadingPlatform] = useState<'JIRA' | 'GITHUB' | null>(null)
  const [deletingPlatform, setDeletingPlatform] = useState<'JIRA' | 'GITHUB' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Jira config states
  const [jiraUrl, setJiraUrl] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraToken, setJiraToken] = useState('')
  const [jiraProject, setJiraProject] = useState('')

  // GitHub config states
  const [githubPat, setGithubPat] = useState('')
  const [githubOwner, setGithubOwner] = useState('')
  const [githubRepo, setGithubRepo] = useState('')

  // Check which integration is active
  const activeJira = integrations.find((i) => i.platform === 'JIRA' && i.isActive)
  const activeGithub = integrations.find((i) => i.platform === 'GITHUB' && i.isActive)

  // Parse existing configs
  const jiraConfig = activeJira ? JSON.parse(activeJira.config || '{}') : null
  const githubConfig = activeGithub ? JSON.parse(activeGithub.config || '{}') : null

  const handleSaveJira = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingPlatform('JIRA')
    setError(null)
    setSuccess(null)

    const configString = JSON.stringify({
      baseUrl: jiraUrl,
      email: jiraEmail,
      projectKey: jiraProject.toUpperCase(),
    })

    try {
      const res = await saveWorkspaceIntegration({
        workspaceId,
        platform: 'JIRA',
        token: jiraToken,
        config: configString,
      })

      if (res.success) {
        setSuccess('Jira integration configured successfully!')
        setJiraToken('')
        router.refresh()
      } else {
        setError(res.error || 'Failed to save Jira settings.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoadingPlatform(null)
    }
  }

  const handleSaveGithub = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingPlatform('GITHUB')
    setError(null)
    setSuccess(null)

    const configString = JSON.stringify({
      owner: githubOwner,
      repo: githubRepo,
    })

    try {
      const res = await saveWorkspaceIntegration({
        workspaceId,
        platform: 'GITHUB',
        token: githubPat,
        config: configString,
      })

      if (res.success) {
        setSuccess('GitHub integration configured successfully!')
        setGithubPat('')
        router.refresh()
      } else {
        setError(res.error || 'Failed to save GitHub settings.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoadingPlatform(null)
    }
  }

  const handleDelete = async (platform: 'JIRA' | 'GITHUB') => {
    setDeletingPlatform(platform)
    setError(null)
    setSuccess(null)

    try {
      const res = await deleteWorkspaceIntegration(workspaceId, platform)
      if (res.success) {
        setSuccess(`${platform === 'JIRA' ? 'Jira' : 'GitHub'} integration removed.`)
        router.refresh()
      } else {
        setError(res.error || 'Failed to remove integration.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setDeletingPlatform(null)
    }
  }

  const prefillDemo = (platform: 'JIRA' | 'GITHUB') => {
    if (platform === 'JIRA') {
      setJiraUrl('https://synapsetask-team.atlassian.net')
      setJiraEmail('dev@synapsetask.ai')
      setJiraToken('dummy-jira-token-value')
      setJiraProject('PROJ')
    } else {
      setGithubPat('dummy-github-pat-value')
      setGithubOwner('synapsetask-org')
      setGithubRepo('synapsetask-app')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Ecosystem Sync Setup</h1>
        <p className="text-gray-400 text-xs mt-1">
          Connect Jira projects and GitHub repositories to sync action items.
        </p>
      </div>

      {/* Alert states */}
      {success && (
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs font-semibold text-green-400 flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-semibold text-red-400 flex items-center gap-2">
          <Trash2 className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION: JIRA INTEGRATION */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Kanban className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white leading-tight">Atlassian Jira Software</h2>
                  <p className="text-xxs text-gray-500 mt-0.5">Sync tasks directly into Jira project backlogs</p>
                </div>
              </div>
              
              {activeJira && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-green-500/30 bg-green-500/5 text-green-400 text-xxs font-bold uppercase tracking-wider">
                  Connected
                </span>
              )}
            </div>

            {activeJira ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-900 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Jira Domain:</span>
                    <span className="text-white font-semibold">{jiraConfig?.baseUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Account Email:</span>
                    <span className="text-white font-semibold">{jiraConfig?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Project Key:</span>
                    <span className="text-white font-semibold">{jiraConfig?.projectKey}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete('JIRA')}
                  disabled={deletingPlatform === 'JIRA'}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {deletingPlatform === 'JIRA' ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-4.5 h-4.5" />
                  )}
                  Disconnect Jira
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveJira} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xxs text-gray-500 font-bold uppercase tracking-wider">Configure connection</span>
                  <button
                    type="button"
                    onClick={() => prefillDemo('JIRA')}
                    className="text-xxs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Use Mock Credentials
                  </button>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">Jira Cloud URL</label>
                  <input
                    type="url"
                    required
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.target.value)}
                    placeholder="https://company.atlassian.net"
                    className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">User Email</label>
                  <input
                    type="email"
                    required
                    value={jiraEmail}
                    onChange={(e) => setJiraEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">API Token</label>
                    <input
                      type="password"
                      required
                      value={jiraToken}
                      onChange={(e) => setJiraToken(e.target.value)}
                      placeholder="Atlassian Token"
                      className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Key</label>
                    <input
                      type="text"
                      required
                      value={jiraProject}
                      onChange={(e) => setJiraProject(e.target.value)}
                      placeholder="PROJ"
                      className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingPlatform === 'JIRA'}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {loadingPlatform === 'JIRA' ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Save className="w-4.5 h-4.5" />
                  )}
                  Save Jira Config
                </button>
              </form>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-900/60 text-xxs text-gray-500 flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>Jira synchronization requires an Atlassian API token. You can generate one in your Atlassian Profile Security settings.</p>
          </div>
        </div>

        {/* SECTION: GITHUB INTEGRATION */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 text-gray-300 border border-gray-700 flex items-center justify-center">
                  <GitMerge className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white leading-tight">GitHub Issue Tracker</h2>
                  <p className="text-xxs text-gray-500 mt-0.5">Map tasks to repository issue boards</p>
                </div>
              </div>
              
              {activeGithub && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-green-500/30 bg-green-500/5 text-green-400 text-xxs font-bold uppercase tracking-wider">
                  Connected
                </span>
              )}
            </div>

            {activeGithub ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-900 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Repo Owner/Org:</span>
                    <span className="text-white font-semibold">{githubConfig?.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Repository Name:</span>
                    <span className="text-white font-semibold">{githubConfig?.repo}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete('GITHUB')}
                  disabled={deletingPlatform === 'GITHUB'}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {deletingPlatform === 'GITHUB' ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-4.5 h-4.5" />
                  )}
                  Disconnect GitHub
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveGithub} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xxs text-gray-500 font-bold uppercase tracking-wider">Configure connection</span>
                  <button
                    type="button"
                    onClick={() => prefillDemo('GITHUB')}
                    className="text-xxs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Use Mock Credentials
                  </button>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">Personal Access Token (PAT)</label>
                  <input
                    type="password"
                    required
                    value={githubPat}
                    onChange={(e) => setGithubPat(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">Repo Owner</label>
                    <input
                      type="text"
                      required
                      value={githubOwner}
                      onChange={(e) => setGithubOwner(e.target.value)}
                      placeholder="e.g. facebook"
                      className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">Repo Name</label>
                    <input
                      type="text"
                      required
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      placeholder="e.g. react"
                      className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingPlatform === 'GITHUB'}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {loadingPlatform === 'GITHUB' ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Save className="w-4.5 h-4.5" />
                  )}
                  Save GitHub Config
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-900/60 text-xxs text-gray-500 flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>GitHub sync requires a Personal Access Token (classic) with `repo` scope enabled, allowing the creation of issues in private or public repos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
