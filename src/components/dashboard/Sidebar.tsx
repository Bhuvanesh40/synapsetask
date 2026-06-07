'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { LayoutDashboard, FileText, Puzzle, LogOut, Zap, User } from 'lucide-react'

interface UserProps {
  name?: string | null
  email?: string | null
}

interface WorkspaceProps {
  id: string
  name: string
  slug: string
}

interface SidebarProps {
  user: UserProps
  currentWorkspace: WorkspaceProps | null
  workspaces: WorkspaceProps[]
}

export default function Sidebar({ user, currentWorkspace, workspaces }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Meetings',
      href: '/meetings',
      icon: FileText,
    },
    {
      label: 'Integrations',
      href: '/dashboard/integrations',
      icon: Puzzle,
    },
  ]

  return (
    <aside className="w-64 bg-gray-950/80 border-r border-gray-900 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Branding */}
      <div className="p-6 border-b border-gray-900 flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
          <Zap className="w-5 h-5 fill-white/10" />
        </div>
        <div>
          <span className="font-extrabold text-white tracking-tight text-base">SynapseTask</span>
          <span className="text-indigo-400 font-bold ml-0.5 text-xs">Pro</span>
        </div>
      </div>


      {/* Workspace Switcher Box */}
      <div className="p-4 border-b border-gray-900/60">
        <WorkspaceSwitcher currentWorkspace={currentWorkspace} workspaces={workspaces} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Session Area */}
      <div className="p-4 border-t border-gray-900 flex flex-col gap-3 bg-gray-950/50">
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
            <User className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xxs text-gray-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 border border-gray-800 hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/20 text-gray-400 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
