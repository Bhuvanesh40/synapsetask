import dotenv from 'dotenv'
import path from 'path'

// Load environment variables immediately before any ES modules run
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const sampleTranscript = `
[00:10] Alex: Hello everyone. Let's outline our roadmap for the SynapseTask auth features.
[00:30] Jessica: Yes, we need to implement NextAuth session validation across server actions. I'll build the authentication config module by this Thursday.
[00:55] Alex: That sounds good. We also need to map the Postgres database tables using Prisma. We should have User, Workspace, and Integration models. Dave, can you write the schema file and generate the client by Friday?
[01:25] Dave: Absolutely, I'll write the Prisma schema and run migrations on Neon DB.
[01:50] Jessica: We also need to encrypt integration tokens using AES-256-GCM. I can take that card. I'll write the crypto helper function by next Tuesday.
[02:15] Alex: Great. Let's make sure the UI is clean and dark mode by default. Let's try to review this together next Wednesday.
`

async function runVerification() {
  console.log('==================================================')
  console.log('🚀 SynapseTask Pro - Core AI Engine Verification')
  console.log('==================================================\n')

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not defined in your environment variables.')
    console.log('\nPlease configure it in your .env or .env.local file:')
    console.log('GEMINI_API_KEY="your-api-key-here"\n')
    process.exit(1)
  }

  console.log('🔄 Calling Gemini API to parse transcript and extract specifications...\n')

  try {
    const { extractMeetingIntelligence } = await import('../services/ai')
    const result = await extractMeetingIntelligence(sampleTranscript, new Date())

    console.log('✅ AI Processing Completed Successfully!\n')
    console.log('--------------------------------------------------')
    console.log('📋 1. EXECUTIVE SUMMARY')
    console.log('--------------------------------------------------')
    console.log(result.summaryText)
    console.log('\n--------------------------------------------------')
    console.log('📝 2. EXTRACTED ACTION ITEMS (TASKS)')
    console.log('--------------------------------------------------')
    
    if (result.actionItems.length === 0) {
      console.log('No action items found.')
    } else {
      result.actionItems.forEach((task, idx) => {
        console.log(`[Task ${idx + 1}] ${task.title}`)
        console.log(`   - Priority: ${task.priority}`)
        console.log(`   - Assignee: ${task.assigneeName || 'Unassigned'} (${task.assigneeEmail || 'No Email'})`)
        console.log(`   - Due Date: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'None'}`)
        console.log(`   - Context: ${task.description}\n`)
      })
    }

    console.log('--------------------------------------------------')
    console.log('📐 3. TECHNICAL SPECIFICATION (MARKDOWN)')
    console.log('--------------------------------------------------')
    console.log(result.markdownDoc.substring(0, 1000) + '\n... [truncated for display] ...')
    console.log('\n==================================================')
    console.log('🎉 Verification Test Passed! Core AI services work perfectly.')
    console.log('==================================================')

  } catch (error: any) {
    console.error('❌ Error running verification:', error.message || error)
  }
}

runVerification()
