import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getActiveWorkspace } from '@/services/active-workspace'
import { getUserWorkspaces } from '@/app/actions/workspace'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/login')
  }

  // Fetch workspaces and verify active workspace cookie/database state
  const currentWorkspace = await getActiveWorkspace()
  const workspacesResponse = await getUserWorkspaces()
  const workspaces = workspacesResponse.workspaces || []

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex">
      {/* Static navigation sidebar */}
      <Sidebar
        user={session.user}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
      />

      {/* Main offset area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <main className="flex-grow px-8 py-8 md:px-12 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
