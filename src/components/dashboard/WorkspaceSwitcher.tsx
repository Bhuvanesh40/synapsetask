'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { switchWorkspaceAction, createWorkspace } from '@/app/actions/workspace'
import { ChevronDown, Plus, Check, Loader2, Briefcase } from 'lucide-react'

interface Workspace {
  id: String
  name: string
  slug: string
}

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
}

export default function WorkspaceSwitcher({ currentWorkspace, workspaces }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSwitch = async (id: string) => {
    if (id === currentWorkspace?.id) {
      setIsOpen(false)
      return
    }
    setSwitchingId(id)
    try {
      const res = await switchWorkspaceAction(id)
      if (res.success) {
        setIsOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSwitchingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    setError(null)
    setCreating(true)

    try {
      const res = await createWorkspace({ name: newWorkspaceName })
      if (res.success && res.workspaceId) {
        setNewWorkspaceName('')
        setShowCreateModal(false)
        await switchWorkspaceAction(res.workspaceId)
        router.refresh()
      } else {
        setError(res.error || 'Failed to create workspace.')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative">
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 rounded-xl text-left text-sm font-medium text-white transition-all duration-200 active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 z-40 bg-gray-900 border border-gray-800 rounded-xl shadow-xl py-1.5 overflow-hidden animate-fade-in">
            <div className="max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 text-xxs font-semibold text-gray-500 uppercase tracking-wider">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id as string}
                  onClick={() => handleSwitch(ws.id as string)}
                  disabled={switchingId !== null}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/60 text-left transition-colors duration-150 cursor-pointer"
                >
                  <span className="truncate">{ws.name}</span>
                  {switchingId === ws.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : ws.id === currentWorkspace?.id ? (
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-800/80 mt-1.5 pt-1.5 px-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowCreateModal(true)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 rounded-lg text-left transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Workspace
              </button>
            </div>
          </div>
        </>
      )}

      {/* Inline Modal/Dialog for Create Workspace */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl animate-scale-up">
            <h3 className="text-base font-bold text-white mb-2">Create Workspace</h3>
            <p className="text-xs text-gray-400 mb-4">Organize your meetings and action items with a dedicated workspace.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}
              <input
                type="text"
                required
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Acme Corp, Engineering..."
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newWorkspaceName.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
