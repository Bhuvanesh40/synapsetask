import db from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { IntegrationPlatform, TaskStatus } from '@prisma/client'

interface SyncResult {
  success: boolean
  externalId?: string
  externalUrl?: string
  error?: string
}

/**
 * Pushes a specific ActionItem to Jira.
 */
export async function syncToJira(actionItemId: string, workspaceId: string): Promise<SyncResult> {
  try {
    // 1. Fetch action item details
    const actionItem = await db.actionItem.findUnique({
      where: { id: actionItemId },
      include: { meeting: true },
    })

    if (!actionItem) {
      return { success: false, error: 'Action item not found.' }
    }

    // 2. Fetch active Jira integration for workspace
    const integration = await db.workspaceIntegration.findUnique({
      where: {
        workspaceId_platform: {
          workspaceId,
          platform: IntegrationPlatform.JIRA,
        },
      },
    })

    if (!integration || !integration.isActive) {
      return { success: false, error: 'Jira integration is not active or configured for this workspace.' }
    }

    // 3. Decrypt token and parse config
    const apiToken = decrypt(integration.encryptedToken)
    let config: { baseUrl: string; email: string; projectKey: string }
    try {
      config = JSON.parse(integration.config || '{}')
    } catch {
      return { success: false, error: 'Invalid Jira configuration.' }
    }

    const { baseUrl, email, projectKey } = config
    if (!baseUrl || !email || !projectKey) {
      return { success: false, error: 'Jira base URL, email, and project key are required in config.' }
    }

    // 4. Build Jira API v3 request payload (Atlassian Document Format)
    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/issue`
    const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`

    const descriptionDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `${actionItem.description}\n\n---\nExtracted from meeting: "${actionItem.meeting.title}" on ${actionItem.meeting.date.toLocaleDateString()}`,
            },
          ],
        },
      ],
    }

    const payload = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: actionItem.title,
        description: descriptionDoc,
        issuetype: {
          name: 'Task',
        },
        priority: {
          name: mapPriorityToJira(actionItem.priority),
        },
      },
    }

    // 5. Send API Request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Jira API error:', errorText)
      return { success: false, error: `Jira API responded with ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    const externalId = data.key as string // Jira key (e.g. "PROJ-101")
    const externalUrl = `${baseUrl.replace(/\/$/, '')}/browse/${externalId}`

    // 6. Record the sync mapping in db
    await db.$transaction([
      db.integrationMapping.upsert({
        where: {
          actionItemId_platform: {
            actionItemId,
            platform: IntegrationPlatform.JIRA,
          },
        },
        create: {
          actionItemId,
          platform: IntegrationPlatform.JIRA,
          externalId,
          externalUrl,
        },
        update: {
          externalId,
          externalUrl,
          syncedAt: new Date(),
        },
      }),
      db.actionItem.update({
        where: { id: actionItemId },
        data: { status: TaskStatus.SYNCED },
      }),
    ])

    return { success: true, externalId, externalUrl }
  } catch (error: any) {
    console.error('Jira Sync Exception:', error)
    return { success: false, error: error.message || 'An unexpected error occurred during Jira sync.' }
  }
}

/**
 * Pushes a specific ActionItem to GitHub as an issue.
 */
export async function syncToGitHub(actionItemId: string, workspaceId: string): Promise<SyncResult> {
  try {
    // 1. Fetch action item details
    const actionItem = await db.actionItem.findUnique({
      where: { id: actionItemId },
      include: { meeting: true },
    })

    if (!actionItem) {
      return { success: false, error: 'Action item not found.' }
    }

    // 2. Fetch active GitHub integration
    const integration = await db.workspaceIntegration.findUnique({
      where: {
        workspaceId_platform: {
          workspaceId,
          platform: IntegrationPlatform.GITHUB,
        },
      },
    })

    if (!integration || !integration.isActive) {
      return { success: false, error: 'GitHub integration is not active or configured for this workspace.' }
    }

    // 3. Decrypt token and parse config
    const pat = decrypt(integration.encryptedToken)
    let config: { owner: string; repo: string }
    try {
      config = JSON.parse(integration.config || '{}')
    } catch {
      return { success: false, error: 'Invalid GitHub configuration.' }
    }

    const { owner, repo } = config
    if (!owner || !repo) {
      return { success: false, error: 'GitHub owner and repository name are required in config.' }
    }

    // 4. Build GitHub API Request
    const url = `https://api.github.com/repos/${owner}/${repo}/issues`
    const bodyMarkdown = `## Action Item Context
${actionItem.description}

---
* **Priority:** ${actionItem.priority}
* **Extracted from Meeting:** [${actionItem.meeting.title}](/meetings/${actionItem.meeting.id})
* **Meeting Date:** ${actionItem.meeting.date.toLocaleDateString()}`

    const payload = {
      title: actionItem.title,
      body: bodyMarkdown,
      labels: ['synapsetask', `priority:${actionItem.priority.toLowerCase()}`],
    }

    // 5. Send API Request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SynapseTask-AI-SaaS',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', errorText)
      return { success: false, error: `GitHub API responded with ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    const externalId = data.number.toString() as string // Issue number (e.g. "45")
    const externalUrl = data.html_url as string

    // 6. Record the sync mapping in db
    await db.$transaction([
      db.integrationMapping.upsert({
        where: {
          actionItemId_platform: {
            actionItemId,
            platform: IntegrationPlatform.GITHUB,
          },
        },
        create: {
          actionItemId,
          platform: IntegrationPlatform.GITHUB,
          externalId,
          externalUrl,
        },
        update: {
          externalId,
          externalUrl,
          syncedAt: new Date(),
        },
      }),
      db.actionItem.update({
        where: { id: actionItemId },
        data: { status: TaskStatus.SYNCED },
      }),
    ])

    return { success: true, externalId, externalUrl }
  } catch (error: any) {
    console.error('GitHub Sync Exception:', error)
    return { success: false, error: error.message || 'An unexpected error occurred during GitHub sync.' }
  }
}

/**
 * Maps task priority to Jira standard priority names.
 */
function mapPriorityToJira(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'Low'
    case 'MEDIUM':
      return 'Medium'
    case 'HIGH':
      return 'High'
    case 'URGENT':
      return 'Highest'
    default:
      return 'Medium'
  }
}
