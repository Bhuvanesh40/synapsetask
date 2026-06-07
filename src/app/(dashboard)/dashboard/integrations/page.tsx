import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getActiveWorkspace } from '@/services/active-workspace'
import { getWorkspaceIntegrations } from '@/app/actions/sync'
import IntegrationsView from '@/components/dashboard/IntegrationsView'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect('/login')
  }

  const workspace = await getActiveWorkspace()
  if (!workspace) {
    redirect('/dashboard')
  }

  const integrationsResult = await getWorkspaceIntegrations(workspace.id)
  const integrations = (integrationsResult.integrations || []).map((integration) => ({
    id: integration.id,
    platform: integration.platform,
    config: integration.config,
    isActive: integration.isActive,
    updatedAt: integration.updatedAt,
  }))

  return (
    <IntegrationsView
      workspaceId={workspace.id}
      integrations={integrations}
    />
  )
}
